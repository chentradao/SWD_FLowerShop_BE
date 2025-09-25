import { Module } from '@nestjs/common';
import { AdminOrderController } from './admin-order.controller';
import { AdminOrderService } from './admin-order.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AdminOrderController],
  providers: [AdminOrderService, PrismaService],
})
export class AdminOrderModule {}
