import { Controller, Get, Query, Put, Param, BadRequestException } from '@nestjs/common';
import { AdminOrderService } from './admin-order.service';
import { OrderStatus } from '../order/order.service';

@Controller('admin/order')
export class AdminOrderController {
  constructor(private readonly adminOrderService: AdminOrderService) { }

  @Get('get')
  async getOrders(
    @Query('status') status?: string
  ) {
    return this.adminOrderService.getOrders(status);
  }

  @Put(':orderId/approve')
  async approveOrder(@Param('orderId') orderId: string) {
    return this.adminOrderService.approveOrder(orderId);
  }

  @Put(':orderId/assign')
  async assignOrder(@Param('orderId') orderId: string) {
    return this.adminOrderService.assignOrder(orderId);
  }

  @Get('detail/:orderId')
  async getOrderDetail(@Param('orderId') orderId: string) {
    return this.adminOrderService.getOrderDetail(orderId);
  }


}
