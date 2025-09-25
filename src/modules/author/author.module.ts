import { Module } from '@nestjs/common';
import { AuthorSevice } from './author.service';
import { AuthorController } from './author.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AuthorController],
  providers: [AuthorSevice, PrismaService],
  exports: [AuthorSevice],
})
export class AuthorModule {}
