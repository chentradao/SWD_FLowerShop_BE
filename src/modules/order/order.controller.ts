import { Controller, Get, Query, Post, Body, Put, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { paymentMethod } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('get')
  async getOrdersByStatusAndUser(
    @Query('status') status: string,
    @Query('userId') userId: string,
  ) {
    return this.orderService.getOrdersByStatusAndUser(status, userId);
  }

  @Put('confirm-received/:orderId')
  async confirmReceived(@Param('orderId') orderId: string) {
    return this.orderService.confirmReceived(orderId);
  }

  @Post('create')
  async createOrder(
    @Body()
    body: {
      userId: string;
      items: { bookId: string; quantity: number; price: number }[];
      payment: paymentMethod;
      userAddress: any;
    },
  ) {
    return this.orderService.createOrder(
      body.userId,
      body.items,
      body.payment,
      body.userAddress,
    );
  }

  @Put(':orderId/cancel')
  async cancelOrder(@Param('orderId') orderId: string) {
    return this.orderService.cancelOrder(orderId);
  }

  @Get('getAll')
  async getOrders(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    if (!userId) {
      return { message: 'Missing userId' };
    }
    return this.orderService.getOrders(userId, limit ? Number(limit) : undefined);
  }

  @Get()
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get('user-orders/:userId')
    async getOrdersByUserId(@Param('userId') userId: string) {
        return this.orderService.getOrdersByUserId(userId);
    }
}
