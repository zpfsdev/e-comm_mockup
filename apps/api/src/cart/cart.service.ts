import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CartItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
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

    if (!cart) throw new NotFoundException('Cart not found.');

    const items: CartItemDto[] = cart.cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price.toString(),
        imageUrl: item.product.imageUrl,
        stock: item.product.stockQuantity,
      },
    }));

    return { items };
  }

  /**
   * Adds a product to the cart or increments its quantity if already present.
   * Validates that the product is available and stock is sufficient.
   */
  async addItem(userId: number, dto: AddToCartDto): Promise<CartItem> {
    return this.prisma.$transaction(async (tx): Promise<CartItem> => {
      const cart = await tx.cart.findUniqueOrThrow({
        where: { userId },
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

      return tx.cartItem.upsert({
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
    });
  }

  /**
   * Sets an item's quantity directly.
   * Passing `quantity: 0` removes the item entirely.
   */
  async updateItem(
    userId: number,
    productId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartItem | void> {
    return this.prisma.$transaction(async (tx): Promise<CartItem | void> => {
      const cart = await tx.cart.findUniqueOrThrow({
        where: { userId },
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
        return;
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

      return tx.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity: dto.quantity },
      });
    });
  }

  /** Deletes a single item from the cart. */
  async removeItem(userId: number, productId: number): Promise<void> {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { userId },
    });
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      select: { id: true },
    });
    if (!existingItem) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
  }

  /** Removes all items from the cart (called after a successful order placement). */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { userId },
    });
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}
