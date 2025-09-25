import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(userId: string, bookId: string, quantity: number = 1) {
    // Kiểm tra sách có tồn tại không
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }
    if (book.status !== 'AVAILABLE') {
      throw new BadRequestException('Book is not available for sale');
    }

    // Kiểm tra nếu đã có trong giỏ thì tăng số lượng
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { userId, bookId },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { book: true },
      });
    }

    // Nếu chưa có thì tạo mới
    return this.prisma.cartItem.create({
      data: {
        userId,
        bookId,
        quantity,
      },
      include: { book: true },
    });
  }

  // Lấy giỏ hàng của user
  async getCart(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { addedAt: 'desc' },
    });
  }

  // Cập nhật số lượng sản phẩm
  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { book: true },
    });
  }

  // Xóa 1 sản phẩm khỏi giỏ
  async removeItem(userId: string, cartItemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: cartItemId } });
    return { message: 'Item removed successfully' };
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return { message: 'Cart cleared successfully' };
  }
}
