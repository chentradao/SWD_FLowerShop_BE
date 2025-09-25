import { Module } from '@nestjs/common';
import { ProvincesController } from './provinces.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ProvincesController],
  providers: [ PrismaService],
  exports: [],
})
export class ProvincesModule {}
