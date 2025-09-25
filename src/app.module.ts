import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/user/user.module';
import { BookModule } from './modules/book/book.module';
import { AuthorModule } from './modules/author/author.module';
import { CategoryModule } from './modules/category/category.module';
import { OrderModule} from './modules/order/order.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletModule } from './modules/wallet/wallet.module';
import { AdminOrderModule } from './modules/admin-order/admin-order.module';
import { AdminRevenueModule } from './modules/admin-revenue/admin-revenue.module';
import { CartModule } from './modules/cart/cart.module';
import { ProvincesModule } from './modules/province/provinces.module';

@Module({
  imports: [ScheduleModule.forRoot(),
  ConfigModule.forRoot({
    isGlobal: true,
  }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BookModule,
    AuthorModule,
    CategoryModule,
    WalletModule,
    OrderModule,
    AdminOrderModule,
    AdminRevenueModule,
    CartModule,
    ProvincesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
