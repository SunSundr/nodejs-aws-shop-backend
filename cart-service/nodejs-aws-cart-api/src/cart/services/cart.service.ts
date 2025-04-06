import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PutCartPayload } from 'src/order/type';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { CartStatuses } from '../models';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
  ) {}

  async findByUserId(userId: string): Promise<Cart | undefined> {
    return this.cartRepository.findOne({
      //where: { userId },
      where: { user: { id: userId } },
      relations: ['items'],
    });
  }

  async createByUserId(userId: string): Promise<Cart> {
    const cart = new Cart();
    cart.userId = userId;
    cart.status = CartStatuses.OPEN;
    cart.items = [];
    return this.cartRepository.save(cart);
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      cart = await this.createByUserId(userId);
    }
    return cart;
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    console.log('updateByUserId', payload);
    const cart = await this.findOrCreateByUserId(userId);
    const itemIndex = cart.items.findIndex(
      (item) => item.productId === payload.product.id,
    );

    try {
      if (itemIndex === -1) {
        const newItem = new CartItem();
        newItem.cartId = cart.id;
        newItem.productId = payload.product.id;
        newItem.count = payload.count;
        cart.items.push(await this.cartItemRepository.save(newItem));
      } else if (payload.count === 0) {
        await this.cartItemRepository.delete({
          cartId: cart.id,
          productId: payload.product.id,
        });
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].count = payload.count;
        await this.cartItemRepository.save(cart.items[itemIndex]);
      }

      cart.updatedAt = new Date();
      return this.cartRepository.save(cart);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
    }
  }

  async removeByUserId(userId: string): Promise<void> {
    const cart = await this.findByUserId(userId);
    if (cart) {
      try {
        await this.cartRepository.remove(cart);
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
      }
    }
  }
}
