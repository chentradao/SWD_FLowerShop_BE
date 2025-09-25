// admin-revenue.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminRevenueService {
    constructor(private prisma: PrismaService) { }

    async getRevenueStats(filter: { year?: number; month?: number; day?: number }) {
    const { year, month, day } = filter;

    // Điều kiện where cơ bản
    const where: any = {
        status: 'DELIVERED',
    };

    let needExtraFilter = false; // Cờ để lọc thêm bằng JS

    if (year && month && day) {
        // Năm + tháng + ngày
        where.createdAt = {
            gte: new Date(year, month - 1, day),
            lt: new Date(year, month - 1, day + 1)
        };
    }
    else if (year && month) {
        // Năm + tháng
        where.createdAt = {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1)
        };
    }
    else if (year) {
        // Chỉ năm
        where.createdAt = {
            gte: new Date(year, 0, 1),
            lt: new Date(year + 1, 0, 1)
        };
    }
    else if (month && day) {
        // Chỉ tháng + ngày (tất cả các năm)
        needExtraFilter = true;
    }
    else if (month) {
        // Chỉ tháng (tất cả các năm)
        needExtraFilter = true;
    }
    else if (day) {
        // Chỉ ngày (tất cả tháng và năm)
        needExtraFilter = true;
    }

    // Nếu cần lọc thêm (month/day không đủ năm)
    let orders: any[] = [];
    if (needExtraFilter) {
        orders = await this.prisma.order.findMany({
            where,
            select: { total: true, createdAt: true }
        });

        if (month) {
            orders = orders.filter(o => o.createdAt.getMonth() + 1 === Number(month));
        }
        if (day) {
            orders = orders.filter(o => o.createdAt.getDate() === Number(day));
        }
    } else {
        orders = await this.prisma.order.findMany({
            where,
            select: { total: true, createdAt: true }
        });
    }

    // Tính tổng
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    // Gom nhóm theo ngày
    const dailyMap: Record<string, number> = {};
    orders.forEach(o => {
        const dateKey = o.createdAt.toISOString().split('T')[0];
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + o.total;
    });

    const dailyRevenue = Object.entries(dailyMap).map(([orderDay, totalRevenue]) => ({
        orderDay,
        totalRevenue
    }));

    return { totalRevenue, dailyRevenue };
}

}
