import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DepositRequestDTO } from '../auth/dto/deposit-request.dto';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async findWalletByUserId(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) throw new Error('Wallet not found');

    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });

    return { ...wallet, transactions };
  }
  async createTransaction(
    userId: string,
    amount: number,
    transactionCode: string,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) throw new Error('Wallet not found');

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        transactionCode,
        status: 'PENDING',
      },
    });
  }

  @Cron('*/30 * * * * *') // Nếu muốn 5 phút: '*/300 * * * * *'
  async checkPendingTransactions() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const pendingTransactions = await this.prisma.walletTransaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: new Date() },
      },
    });

    for (const t of pendingTransactions) {
      const matched = await this.checkWithSepayAPI(t.transactionCode, t.amount);
      if (matched) {
        // Cập nhật transaction
        await this.prisma.walletTransaction.update({
          where: { id: t.id },
          data: {
            status: 'DONE',
            confirmedAt: new Date(),
          },
        });

        // Cộng tiền vào ví
        const wallet = await this.prisma.wallet.findUnique({
          where: { id: t.walletId },
        });

        if (wallet) {
          await this.prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: wallet.balance + t.amount,
              lastUpdated: new Date(),
            },
          });
        }
      } else {
        // Nếu quá 10 phút thì xóa
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (t.createdAt < tenMinutesAgo) {
          console.log('🗑️ Xóa giao dịch quá hạn:', t.id);
          await this.prisma.walletTransaction.delete({
            where: { id: t.id },
          });
        }
      }
    }
  }

  async checkWithSepayAPI(
    transactionCode: string,
    amount: number,
  ): Promise<boolean> {
    const url = 'https://my.sepay.vn/userapi/transactions/list';

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer GSA6INY97MR4URKVRAVHR3VOQGQAL20CS1BBG5PQI4KKFFECCB9NFYT3Z27ZXXNU`,
        },
      });

      const data = response.data;

      if (Array.isArray(data.transactions)) {
        for (const txn of data.transactions) {
          const content = txn.transaction_content;
          const amountInStr = txn.amount_in;
          const sanitizedTransactionCode = transactionCode.replace(/_/g, '');
          if (content && content.includes(sanitizedTransactionCode)) {
            const parsedAmount = parseFloat(amountInStr);
            if (Math.round(parsedAmount) === amount) {
              return true;
            }
          }
        }
      }
    } catch (e) {
      console.error('❌ Lỗi khi gọi Sepay API:', e.response?.data || e.message);
    }

    return false;
  }
}
