import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { BasicAuthGuard } from '../auth';
import { OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';
// import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { CreateOrderDto, OrderStatus, PutCartPayload } from 'src/order/type';
import { DataSource } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Order } from '../order/entities/order.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { CartStatuses } from './models';
import { Cart } from './entities/cart.entity';

type CartItemFrontend = {
  cartId: string;
  count: number;
  product: {
    id: string;
  };
};

function items2frontend(items: CartItem[]) {
  return items.map((item) => ({
    cartId: item.cartId,
    count: item.count,
    product: { id: item.productId },
  }));
}

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(
    @Req() req: AppRequest,
  ): Promise<CartItemFrontend[] | CartItem[]> {
    const cart = await this.cartService.findOrCreateByUserId(
      getUserIdFromRequest(req),
    );
    return items2frontend(cart.items);
    // return cart.items;
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(
    @Req() req: AppRequest,
    @Body() body: PutCartPayload,
  ): Promise<CartItemFrontend[] | CartItem[]> {
    // TODO: validate body payload...
    const cart = await this.cartService.updateByUserId(
      getUserIdFromRequest(req),
      body,
    );

    return items2frontend(cart.items);
    // return cart.items;
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  clearUserCart(@Req() req: AppRequest) {
    this.cartService.removeByUserId(getUserIdFromRequest(req));
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Put('order')
  async checkout(@Req() req: AppRequest, @Body() body: CreateOrderDto) {
    // Start a new transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userId = getUserIdFromRequest(req);

      // Get opened cart for user to use transaction
      const cart = await queryRunner.manager.getRepository(Cart).findOne({
        where: { user: { id: userId }, status: CartStatuses.OPEN },
        relations: ['items'],
      });

      if (!cart) {
        throw new BadRequestException('Cart not found');
      }

      // Get items for current cart
      const items = cart
        ? await queryRunner.manager.getRepository(CartItem).find({
            where: {
              cartId: cart.id,
            },
          })
        : [];

      if (!items.length) {
        throw new BadRequestException(`Cart is empty ${cart}`);
      }

      const order = await queryRunner.manager.getRepository(Order).save({
        user: { id: userId },
        cart: { id: cart.id },
        payment: {
          amount: body.payment.amount,
          method: body.payment.method,
          card_last4: body.payment.card_last4,
        },
        delivery: {
          zip: body.delivery.zip,
          city: body.delivery.city,
          address: body.delivery.address,
        },
        comments: body.comments,
        status: OrderStatus.Open,
        total: body.total,
        items: undefined,
      });

      // Update cart status to ORDERED
      await queryRunner.manager.getRepository(Cart).update(
        { id: cart.id },
        {
          status: CartStatuses.ORDERED,
          updatedAt: new Date(),
        },
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { order };
    } catch (err) {
      // Rollback in case of error
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  @UseGuards(BasicAuthGuard)
  @Get('order')
  async getOrder(): Promise<Order[]> {
    return await this.orderService.getAll();
  }
}
