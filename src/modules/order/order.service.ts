import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PrismaClient } from '@prisma/client';

// Định nghĩa lại enum tương ứng với schema.prisma
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum paymentMethod {
  Wallet = 'Wallet',
  COD = 'COD',
}
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}
  // order.service.ts
  async getOrdersByStatusAndUser(status: string, userId: string) {
    const whereClause: any = {
      userId,
    };

    // Nếu status tồn tại và hợp lệ, thì thêm vào điều kiện where
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      whereClause.status = status as OrderStatus;
    }

    console.log(whereClause);

    return this.prisma.order.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            book: true,
          },
        },
      },
    });
  }

  async confirmReceived(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' },
    });

    return { status: updatedOrder.status };
  }

  async createOrder(
    userId: string,
    items: { bookId: string; quantity: number; price: number }[],
    payment: paymentMethod,
    userAddress: any,
  ) {
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (payment === paymentMethod.Wallet) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Không tìm thấy ví');
      if (wallet.balance < total)
        throw new BadRequestException('Số dư ví không đủ');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: OrderStatus.PENDING,
          payment,
          userAddress,
          items: {
            create: items.map((item) => ({
              bookId: item.bookId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      if (payment === paymentMethod.Wallet) {
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: total },
            lastUpdated: new Date(),
          },
        });
      }

      for (const item of items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        });
      }

      return order;
    });
  }

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: order.userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (order.payment === paymentMethod.Wallet) {
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + order.total,
          lastUpdated: new Date(),
        },
      });
    }

    return { walletBalance: wallet.balance };
  }

async getOrders(userId: string, limit?: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Sắp xếp mới nhất trước
      take: limit || undefined, // Giới hạn nếu có
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      select: {
        id: true,
        userId: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getOrdersByUserId(userId: string) {
  return this.prisma.order.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: true,
      items: {
        include: {
          book: true,
        },
      },
    },
  });
}




}
