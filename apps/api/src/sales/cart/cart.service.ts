import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import type { CartDto, CartItemDto } from './models/cart.dto';

/** Manages a user's shopping cart — add, update, remove, and clear operations. */
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the full cart for a user, mapped to a simple DTO shape.
   * Throws `NotFoundException` if no cart exists (carts are created on registration).
   */
  async getCart(userId: number): Promise<CartDto> {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        cartItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                status: true,
                stockQuantity: true,
                seller: { select: { id: true, shopName: true } },
              },
            },
          },
          orderBy: { dateAdded: 'asc' },
        },
      },
    });

    const items: CartItemDto[] = cart.cartItems?.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price.toString(),
        imageUrl: item.product.imageUrl,
        stock: item.product.stockQuantity,
        seller: item.product.seller ? {
          id: item.product.seller.id,
          shopName: item.product.seller.shopName
        } : undefined,
      },
    }));

    return { items };
  }

  /**
   * Adds a product to the cart or increments its quantity if already present.
   * Validates that the product is available and stock is sufficient.
   */
  async addItem(userId: number, dto: AddToCartDto): Promise<CartItemDto> {
    return this.prisma.$transaction(async (tx): Promise<CartItemDto> => {
      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      const [product, existingItem] = await Promise.all([
        tx.product.findUnique({ where: { id: dto.productId } }),
        tx.cartItem.findUnique({
          where: {
            cartId_productId: { cartId: cart.id, productId: dto.productId },
          },
          select: { quantity: true },
        }),
      ]);

      if (!product || product.status === 'Unavailable') {
        throw new BadRequestException('Product is not available.');
      }

      const alreadyInCart = existingItem?.quantity ?? 0;
      if (product.stockQuantity < alreadyInCart + dto.quantity) {
        throw new BadRequestException('Insufficient stock.');
      }

      const upserted = await tx.cartItem.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId: dto.productId },
        },
        update: { quantity: { increment: dto.quantity } },
        create: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });

      return this.mapToCartItemDto(upserted.id, upserted.quantity, product);
    });
  }

  /**
   * Sets an item's quantity directly.
   * Passing `quantity: 0` removes the item entirely and returns `undefined`
   * (the controller sends 204 No Content for that path).
   */
  async updateItem(
    userId: number,
    productId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartItemDto | undefined> {
    return this.prisma.$transaction(
      async (tx): Promise<CartItemDto | undefined> => {
        const cart = await tx.cart.upsert({
          where: { userId },
          create: { userId },
          update: {},
        });

        if (dto.quantity === 0) {
          const existingForDelete = await tx.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
            select: { id: true },
          });
          if (!existingForDelete) {
            throw new NotFoundException('Cart item not found.');
          }
          await tx.cartItem.delete({
            where: { cartId_productId: { cartId: cart.id, productId } },
          });
          return undefined;
        }

        const product = await tx.product.findUnique({
          where: { id: productId },
        });
        if (!product || product.status === 'Unavailable') {
          throw new BadRequestException('Product is not available.');
        }

        if (product.stockQuantity < dto.quantity) {
          throw new BadRequestException('Insufficient stock.');
        }

        const existingItem = await tx.cartItem.findUnique({
          where: { cartId_productId: { cartId: cart.id, productId } },
          select: { id: true },
        });
        if (!existingItem) {
          throw new NotFoundException('Cart item not found.');
        }

        const updated = await tx.cartItem.update({
          where: { cartId_productId: { cartId: cart.id, productId } },
          data: { quantity: dto.quantity },
        });

        return this.mapToCartItemDto(updated.id, updated.quantity, product);
      },
    );
  }

  /** Deletes a single item from the cart. Uses a transaction so findUniqueOrThrow and delete are atomic. */
  async removeItem(userId: number, productId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
      const deleted = await tx.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
      if (deleted.count === 0) {
        throw new NotFoundException('Cart item not found.');
      }
    });
  }

  /** Removes all items from the cart (called after a successful order placement). */
  async clearCart(userId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    });
  }

  private mapToCartItemDto(
    id: number,
    quantity: number,
    product: {
      id: number;
      name: string;
      imageUrl: string | null;
      price: { toString(): string };
      stockQuantity: number;
    },
  ): CartItemDto {
    return {
      id,
      quantity,
      product: {
        id: product.id,
        name: product.name,
        price: product.price.toString(),
        imageUrl: product.imageUrl ?? '',
        stock: product.stockQuantity,
        seller: (product as any).seller ? {
          id: (product as any).seller.id,
          shopName: (product as any).seller.shopName
        } : undefined,
      },
    };
  }
}
