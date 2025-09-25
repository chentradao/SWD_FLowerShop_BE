import { Controller, Get, Query } from '@nestjs/common';
import { AdminRevenueService } from './admin-revenue.service';

@Controller('admin/revenue')
export class AdminRevenueController {
  constructor(private readonly revenueService: AdminRevenueService) {}

  @Get('get')
  async getRevenue(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('day') day?: string,
  ) {
    return this.revenueService.getRevenueStats({
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      day: day ? Number(day) : undefined,
    });
  }
}
