import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CartService } from './cart.service';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add book to cart' })
  addToCart(
    @Body('userId') userId: string,
    @Body('bookId') bookId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.addToCart(userId, bookId, quantity);
  }

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiQuery({ name: 'userId', required: true })
  getCart(@Query('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Patch(':id/quantity')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ApiParam({ name: 'id', required: true })
  updateQuantity(
    @Param('id') cartItemId: string,
    @Body('userId') userId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(userId, cartItemId, quantity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a cart item' })
  @ApiParam({ name: 'id', required: true })
  removeItem(
    @Param('id') cartItemId: string,
    @Body('userId') userId: string,
  ) {
    return this.cartService.removeItem(userId, cartItemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear user cart' })
  @ApiQuery({ name: 'userId', required: true })
  clearCart(@Query('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
