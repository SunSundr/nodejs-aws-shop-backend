import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CreateOrderPayload } from '../type';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async getAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  async findById(orderId: string): Promise<Order | undefined> {
    return this.orderRepository.findOne({ where: { id: orderId } });
  }

  async create(data: CreateOrderPayload): Promise<Order> {
    try {
      const order = this.orderRepository.create({
        userId: data.userId,
        ...data,
      });
      return await this.orderRepository.save(order);
    } catch (error) {
      throw new BadRequestException(`Failed: ${error.message}`);
    }
  }

  async update(orderId: string, data: Partial<Order>): Promise<Order> {
    const order = await this.findById(orderId);
    if (!order) {
      throw new Error('Order does not exist.');
    }

    await this.orderRepository.update(orderId, data);
    return this.orderRepository.findOne({ where: { id: orderId } });
  }
}
