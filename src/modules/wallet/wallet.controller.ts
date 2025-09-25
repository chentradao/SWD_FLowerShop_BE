import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { DepositRequestDTO } from '../auth/dto/deposit-request.dto';
import { PrismaService } from '../../database/prisma.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('get')
  async getWallet(@Query('userId') userId: string) {
    console.log('hihi:', userId);
    const wallet = await this.walletService.findWalletByUserId(userId);
    return wallet;
  }

  @Post('handle')
  async createDepositRequest(@Body() body: any) {
    console.log('Received body:', body);
    return this.walletService.createTransaction(
    body.userId,
    body.amount,
    body.transactionCode,
  );
  }

  @Get('user/:userId')
  async getUserTransactions(@Param('userId') userId: string) {
    console.log(userId);
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });

    return transactions;
  }
}
