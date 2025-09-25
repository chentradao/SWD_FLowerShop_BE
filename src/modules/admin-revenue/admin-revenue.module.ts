import { Module } from '@nestjs/common';
import { AdminRevenueController } from './admin-revenue.controller';
import { AdminRevenueService } from './admin-revenue.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AdminRevenueController],
  providers: [AdminRevenueService, PrismaService],
})
export class AdminRevenueModule {}
