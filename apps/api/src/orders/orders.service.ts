import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type {
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
   * Places a new order in a single transaction:
   * 1. Validates product availability and stock — inside the transaction to prevent TOCTOU races.
   * 2. Optionally validates that userAddressId belongs to the requesting user (IDOR guard).
   * 3. Creates the `Order`, `OrderItem` rows, and an `Unpaid` payment record.
   * 4. Decrements stock for each product.
   * 5. Creates `Commission` records (5%) for the seller of each item.
   * 6. Clears the user's cart.
   *
   * Rollback: If any step throws (e.g. BadRequestException, DB error), Prisma aborts the
   * transaction and rolls back all writes. No partial orders or stock updates are committed.
   */
  async createOrder(
    userId: number,
    dto: CreateOrderDto,
  ): Promise<OrderSummaryDto> {
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

    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException(
        'Duplicate product entries in order items are not allowed.',
      );
    }

    if (dto.userAddressId) {
      const userAddress = await this.prisma.userAddress.findFirst({
        where: { id: dto.userAddressId, userId },
      });
      if (!userAddress) {
        throw new ForbiddenException(
          'The specified address does not belong to your account.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, status: 'Available' },
        select: { id: true, price: true, stockQuantity: true, sellerId: true },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('One or more products are unavailable.');
      }

      const quantityMap = new Map(
        dto.items.map((i) => [i.productId, i.quantity]),
      );

      for (const product of products) {
        const qty = quantityMap.get(product.id) ?? 0;
        if (product.stockQuantity < qty) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.id}.`,
          );
        }
      }

      const itemTotal = products.reduce((sum, product) => {
        const qty = quantityMap.get(product.id) ?? 0;
        const priceDecimal = new Prisma.Decimal(product.price);
        return sum.plus(priceDecimal.mul(qty));
      }, new Prisma.Decimal(0));

      const totalAmountDecimal = itemTotal.plus(this.shippingFee);

      const deliveryNotes = dto.deliveryAddress
        ? [
            dto.deliveryAddress.streetLine,
            dto.deliveryAddress.barangay,
            dto.deliveryAddress.city,
          ]
            .filter(Boolean)
            .join(', ')
        : undefined;

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount: totalAmountDecimal,
          shippingFee: this.shippingFee,
          userAddressId: dto.userAddressId,
          notes: dto.notes ?? deliveryNotes,
          orderItems: {
            create: products.map((product) => ({
              productId: product.id,
              quantity: quantityMap.get(product.id) ?? 1,
              price: product.price,
            })),
          },
          payment: {
            create: {
              paymentAmount: totalAmountDecimal,
              paymentStatus: 'Unpaid',
            },
          },
        },
        include: {
          orderItems: {
            include: {
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
          payment: true,
          userAddress: {
            include: {
              address: { include: { barangay: { include: { city: true } } } },
            },
          },
        },
      });

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

      await Promise.all(
        order.orderItems.map((orderItem) => {
          const product = products.find((p) => p.id === orderItem.productId)!;
          return tx.commission.create({
            data: {
              sellerId: product.sellerId,
              orderItemId: orderItem.id,
              commissionAmount: new Prisma.Decimal(orderItem.price)
                .mul(orderItem.quantity)
                .mul(this.commissionRate),
            },
          });
        }),
      );

      await tx.cartItem.deleteMany({ where: { cart: { userId } } });

      return this.mapToOrderSummaryDto(order);
    });
  }

  /** Returns a paginated list of orders for a user, newest first, with total/page metadata. */
  async findUserOrders(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<PaginatedOrdersResponseDto> {
    const MAX_ORDER_PAGE_SIZE = 50;
    const safeLimit = Math.min(limit, MAX_ORDER_PAGE_SIZE);
    const skip = (page - 1) * safeLimit;
    const where = { userId };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
          payment: true,
          userAddress: {
            include: {
              address: { include: { barangay: { include: { city: true } } } },
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
                seller: { select: { shopName: true } },
              },
            },
            review: true,
          },
        },
        payment: true,
        userAddress: {
          include: {
            address: { include: { barangay: { include: { city: true } } } },
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
  ) {
    const seller = await this.prisma.seller.findUniqueOrThrow({
      where: { userId },
    });
    return this.updateOrderItemStatus(orderItemId, seller.id, status);
  }

  /**
   * Allows a seller to update the status of a specific order item they own.
   * Sets `dateDelivered` automatically when status becomes `Completed`.
   * Throws `BadRequestException` if the seller does not manage the product.
   */
  async updateOrderItemStatus(
    orderItemId: number,
    sellerId: number,
    status: OrderItemStatus,
  ) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { product: { select: { sellerId: true } }, order: true },
    });

    if (!orderItem) throw new NotFoundException('Order item not found.');
    if (orderItem.product.sellerId !== sellerId) {
      throw new ForbiddenException('You do not manage this order item.');
    }

    const data: Prisma.OrderItemUpdateInput = { orderItemStatus: status };
    if (status === 'Completed') data.dateDelivered = new Date();

    return this.prisma.orderItem.update({ where: { id: orderItemId }, data });
  }

  private mapToOrderSummaryDto(
    order: Prisma.OrderGetPayload<{
      include: {
        orderItems: {
          include: {
            product: { select: { id: true; name: true; imageUrl: true } };
          };
        };
        payment: true;
        userAddress: {
          include: {
            address: {
              include: {
                barangay: {
                  include: {
                    city: true;
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
      totalAmount: order.totalAmount.toString(),
      shippingFee: order.shippingFee.toString(),
      notes: order.notes,
      orderItems: order.orderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price.toString(),
        orderItemStatus: item.orderItemStatus,
        dateDelivered: item.dateDelivered,
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
        },
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            paymentAmount: order.payment.paymentAmount.toString(),
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
          }
        : null,
    };
  }
}
