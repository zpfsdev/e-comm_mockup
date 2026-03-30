import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderItemStatus, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type {
  OrderItemStatusUpdateResponseDto,
  OrderSummaryDto,
  PaginatedOrdersResponseDto,
} from './models/order.dto';

/** Handles order placement, retrieval, and per-item status updates for sellers. */
@Injectable()
export class OrdersService {
  private readonly shippingFee: Prisma.Decimal;
  private readonly commissionRate: Prisma.Decimal;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const shippingFeeNumber =
      this.configService.get<number>('ORDERS_SHIPPING_FEE') ?? 58;
    const commissionRateNumber =
      this.configService.get<number>('ORDERS_COMMISSION_RATE') ?? 0.05;

    this.shippingFee = new Prisma.Decimal(shippingFeeNumber);
    this.commissionRate = new Prisma.Decimal(commissionRateNumber);
  }

  /**
   * Places a new order in a single atomic transaction.
   * Pre-flight validation runs before the transaction to fail fast on obvious errors.
   * All stock checks and writes happen inside the transaction to prevent TOCTOU races.
   */
  async createOrder(
    userId: number,
    dto: CreateOrderDto,
  ): Promise<OrderSummaryDto> {
    this.validateOrderRequest(dto);
    await this.assertAddressOwnership(userId, dto.userAddressId);

    const productIds = dto.items.map((i) => i.productId);
    const quantityMap = new Map(
      dto.items.map((i) => [i.productId, i.quantity]),
    );
    const orderNotes = this.resolveOrderNotes(dto);

    return this.prisma.$transaction(async (tx) => {
      const products = await this.fetchAndValidateProducts(
        tx,
        productIds,
        quantityMap,
      );
      const totalAmount = this.calculateOrderTotal(products, quantityMap);

      const order = await this.persistOrder(tx, {
        userId,
        products,
        quantityMap,
        totalAmount,
        userAddressId: dto.userAddressId,
        notes: orderNotes,
      });

      await this.decrementStock(tx, products, quantityMap);
      await this.createCommissions(tx, order.orderItems, products);
      await tx.cartItem.deleteMany({ where: { cart: { userId } } });

      return this.mapToOrderSummaryDto(order);
    });
  }

  private validateOrderRequest(dto: CreateOrderDto): void {
    if (!dto.items.length) {
      throw new BadRequestException('Order must contain at least one item.');
    }
    if (
      (dto.userAddressId && dto.deliveryAddress) ||
      (!dto.userAddressId && !dto.deliveryAddress)
    ) {
      throw new BadRequestException(
        'Provide either userAddressId or deliveryAddress, but not both.',
      );
    }
    const productIds = dto.items.map((i) => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException(
        'Duplicate product entries in order items are not allowed.',
      );
    }
  }

  private async assertAddressOwnership(
    userId: number,
    userAddressId?: number,
  ): Promise<void> {
    if (!userAddressId) return;
    const userAddress = await this.prisma.userAddress.findFirst({
      where: { id: userAddressId, userId },
    });
    if (!userAddress) {
      throw new ForbiddenException(
        'The specified address does not belong to your account.',
      );
    }
  }

  private resolveOrderNotes(dto: CreateOrderDto): string | undefined {
    if (!dto.deliveryAddress) return dto.notes;
    const addressLine = [
      dto.deliveryAddress.streetLine,
      dto.deliveryAddress.barangay,
      dto.deliveryAddress.city,
    ]
      .filter(Boolean)
      .join(', ');
    return dto.notes ? `${addressLine} — ${dto.notes}` : addressLine;
  }

  private async fetchAndValidateProducts(
    tx: Prisma.TransactionClient,
    productIds: number[],
    quantityMap: Map<number, number>,
  ): Promise<
    Array<{
      id: number;
      price: Prisma.Decimal;
      stockQuantity: number;
      sellerId: number;
    }>
  > {
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, status: 'Available' },
      select: { id: true, price: true, stockQuantity: true, sellerId: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable.');
    }

    for (const product of products) {
      const qty = quantityMap.get(product.id) ?? 0;
      if (product.stockQuantity < qty) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.id}.`,
        );
      }
    }

    return products;
  }

  private calculateOrderTotal(
    products: Array<{ id: number; price: Prisma.Decimal }>,
    quantityMap: Map<number, number>,
  ): Prisma.Decimal {
    const itemTotal = products.reduce((sum, product) => {
      const qty = quantityMap.get(product.id) ?? 0;
      return sum.plus(new Prisma.Decimal(product.price).mul(qty));
    }, new Prisma.Decimal(0));
    return itemTotal.plus(this.shippingFee);
  }

  private async persistOrder(
    tx: Prisma.TransactionClient,
    params: {
      userId: number;
      products: Array<{
        id: number;
        price: Prisma.Decimal;
        stockQuantity: number;
        sellerId: number;
      }>;
      quantityMap: Map<number, number>;
      totalAmount: Prisma.Decimal;
      userAddressId?: number;
      notes?: string;
    },
  ) {
    return tx.order.create({
      data: {
        userId: params.userId,
        totalAmount: params.totalAmount,
        shippingFee: this.shippingFee,
        userAddressId: params.userAddressId,
        notes: params.notes,
        orderItems: {
          create: params.products.map((product) => ({
            productId: product.id,
            quantity: params.quantityMap.get(product.id) ?? 1,
            price: product.price,
          })),
        },
        payment: {
          create: {
            paymentAmount: params.totalAmount,
            paymentStatus: 'Unpaid',
          },
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                seller: { select: { id: true, shopName: true } },
              },
            },
          },
        },
        payment: true,
        userAddress: {
          include: {
            address: { include: { barangay: { include: { city: { include: { province: true } } } } } },
          },
        },
      },
    });
  }

  private async decrementStock(
    tx: Prisma.TransactionClient,
    products: Array<{ id: number }>,
    quantityMap: Map<number, number>,
  ): Promise<void> {
    await Promise.all(
      products.map((product) =>
        tx.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: { decrement: quantityMap.get(product.id) ?? 0 },
          },
        }),
      ),
    );
  }

  private async createCommissions(
    tx: Prisma.TransactionClient,
    orderItems: Array<{
      id: number;
      productId: number;
      price: Prisma.Decimal;
      quantity: number;
    }>,
    products: Array<{ id: number; sellerId: number }>,
  ): Promise<void> {
    const sellerMap = new Map(products.map((p) => [p.id, p.sellerId]));
    const commissionData = orderItems
      .filter((item) => sellerMap.has(item.productId))
      .map((item) => ({
        sellerId: sellerMap.get(item.productId)!,
        orderItemId: item.id,
        commissionAmount: new Prisma.Decimal(item.price)
          .mul(item.quantity)
          .mul(this.commissionRate),
      }));
    if (commissionData.length > 0) {
      await tx.commission.createMany({ data: commissionData });
    }
  }

  /** Returns a paginated list of orders for a user, newest first, with total/page metadata. */
  async findUserOrders(
    userId: number,
    page = 1,
    limit = 20,
    status?: OrderStatus,
  ): Promise<PaginatedOrdersResponseDto> {
    const MAX_ORDER_PAGE_SIZE = 50;
    const safeLimit = Math.min(limit, MAX_ORDER_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    const where: Prisma.OrderWhereInput = { userId };
    if (status) where.orderStatus = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  seller: { select: { id: true, shopName: true } },
                },
              },
            },
          },
          payment: true,
          userAddress: {
            include: {
              address: {
                include: {
                  barangay: {
                    include: { city: { include: { province: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { orderDate: 'desc' },
        take: safeLimit,
        skip,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      orders: orders.map((order) => this.mapToOrderSummaryDto(order)),
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Returns a single order with full detail.
   * Scoped to the requesting user — throws `NotFoundException` for unknown or other users' orders.
   */
  async findOrderById(id: number, userId: number): Promise<OrderSummaryDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                seller: { select: { id: true, shopName: true } },
              },
            },
            review: true,
          },
        },
        payment: true,
        userAddress: {
          include: {
            address: { include: { barangay: { include: { city: { include: { province: true } } } } } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    return this.mapToOrderSummaryDto(order);
  }

  /** Resolves userId → sellerId then delegates to `updateOrderItemStatus`. */
  async updateOrderItemStatusForUser(
    orderItemId: number,
    userId: number,
    status: OrderItemStatus,
  ): Promise<OrderItemStatusUpdateResponseDto> {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });
    return this.updateOrderItemStatus(orderItemId, seller.id, status);
  }

  /** Valid forward-only status transitions for order items. */
  private static readonly ALLOWED_TRANSITIONS: Record<
    OrderItemStatus,
    OrderItemStatus[]
  > = {
    Pending: ['InTransit', 'Cancelled'],
    InTransit: ['Completed', 'Cancelled'],
    Completed: ['Disputed'],
    Cancelled: [],
    Disputed: ['RefundRequested', 'Completed'],
    RefundRequested: ['Refunded', 'Completed'],
    Refunded: [],
  };

  /**
   * Allows a seller to update the status of a specific order item they own.
   * Enforces forward-only transitions (Pending→InTransit→Completed).
   * Sets `dateDelivered` automatically when status becomes `Completed`.
   * Throws `ForbiddenException` if the seller does not manage the product.
   */
  async updateOrderItemStatus(
    orderItemId: number,
    sellerId: number,
    status: OrderItemStatus,
  ): Promise<OrderItemStatusUpdateResponseDto> {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: {
        id: true,
        orderItemStatus: true,
        product: { select: { sellerId: true } },
      },
    });

    if (!orderItem) throw new NotFoundException('Order item not found.');
    if (orderItem.product.sellerId !== sellerId) {
      throw new ForbiddenException('You do not manage this order item.');
    }

    const allowed =
      OrdersService.ALLOWED_TRANSITIONS[orderItem.orderItemStatus];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition order item from '${orderItem.orderItemStatus}' to '${status}'.`,
      );
    }

    const data: Prisma.OrderItemUpdateInput = { orderItemStatus: status };
    if (status === 'Completed') data.dateDelivered = new Date();

    return this.prisma.orderItem.update({
      where: { id: orderItemId },
      data,
      select: {
        id: true,
        orderItemStatus: true,
        dateDelivered: true,
        productId: true,
      },
    });
  }

  /**
   * Admin: returns all order items in Disputed or RefundRequested state.
   */
  async findDisputedItems() {
    return this.prisma.orderItem.findMany({
      where: {
        orderItemStatus: { in: ['Disputed', 'RefundRequested'] },
      },
      select: {
        id: true,
        quantity: true,
        price: true,
        orderItemStatus: true,
        dateDelivered: true,
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            seller: { select: { id: true, shopName: true } },
          },
        },
        order: {
          select: {
            id: true,
            userId: true,
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Customer initiates a dispute on a Completed order item.
   * Only items delivered within the last 14 days may be disputed.
   */
  async requestRefund(
    orderItemId: number,
    userId: number,
    reason?: string,
  ): Promise<OrderItemStatusUpdateResponseDto> {
    const orderItem = await this.prisma.orderItem.findFirst({
      where: { id: orderItemId, order: { userId } },
      select: { id: true, orderItemStatus: true, dateDelivered: true },
    });

    if (!orderItem) throw new NotFoundException('Order item not found.');
    if (orderItem.orderItemStatus !== 'Completed') {
      throw new BadRequestException(
        `Only completed items can be disputed. Current: ${orderItem.orderItemStatus}`,
      );
    }

    // Enforce 14-day dispute window
    if (orderItem.dateDelivered) {
      const daysSince =
        (Date.now() - orderItem.dateDelivered.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 14) {
        throw new BadRequestException(
          'Dispute window expired. Items can only be disputed within 14 days of delivery.',
        );
      }
    }

    return this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: { orderItemStatus: 'Disputed' },
      select: { id: true, orderItemStatus: true, dateDelivered: true, productId: true },
    });
  }

  /**
   * Admin resolves a disputed item.
   * Uses an atomic $transaction: if resolution is 'Refunded', the associated
   * commission is voided (deleted) to keep the financial ledger consistent.
   */
  async resolveDispute(
    orderItemId: number,
    resolution: 'Refunded' | 'Completed',
  ): Promise<OrderItemStatusUpdateResponseDto> {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { id: true, orderItemStatus: true },
    });

    if (!orderItem) throw new NotFoundException('Order item not found.');
    if (
      orderItem.orderItemStatus !== 'Disputed' &&
      orderItem.orderItemStatus !== 'RefundRequested'
    ) {
      throw new BadRequestException(
        `Item is not in a disputable state. Current: ${orderItem.orderItemStatus}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // If refunding, void the seller's commission for this item
      if (resolution === 'Refunded') {
        await tx.commission.deleteMany({ where: { orderItemId } });
      }

      return tx.orderItem.update({
        where: { id: orderItemId },
        data: { orderItemStatus: resolution },
        select: { id: true, orderItemStatus: true, dateDelivered: true, productId: true },
      });
    });
  }

  private mapToOrderSummaryDto(
    order: Prisma.OrderGetPayload<{
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true;
                name: true;
                imageUrl: true;
                seller: { select: { id: true; shopName: true } };
              };
            };
          };
        };
        payment: true;
        userAddress: {
          include: {
            address: {
              include: {
                barangay: {
                  include: {
                    city: {
                      include: { province: true };
                    };
                  };
                };
              };
            };
          };
        };
      };
    }>,
  ): OrderSummaryDto {
    return {
      id: order.id,
      orderDate: order.orderDate,
      totalAmount: order.totalAmount.valueOf().toString(),
      shippingFee: order.shippingFee.valueOf().toString(),
      notes: order.notes,
      orderStatus: order.orderStatus,
      orderItems: order.orderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price.valueOf().toString(),
        orderItemStatus: item.orderItemStatus,
        dateDelivered: item.dateDelivered,
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          seller: item.product.seller,
        },
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            paymentAmount: order.payment.paymentAmount.valueOf().toString(),
            paymentStatus: order.payment.paymentStatus,
            paymentDate: order.payment.paymentDate,
          }
        : null,
      userAddress: order.userAddress
        ? {
            id: order.userAddress.id,
            streetLine: order.userAddress.address.street,
            postalCode: order.userAddress.address.barangay.city.postalCode,
            location: {
              cityName: order.userAddress.address.barangay.city.city,
              barangayName: order.userAddress.address.barangay.barangay,
            },
            provinceName:
              order.userAddress.address.barangay.city.province.province,
          }
        : null,
    };
  }
}
