import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Prisma } from '@prisma/client';
import { BookStatus } from '../order/order.service';
import { BookFilterDto } from './dto/book-filter.dto';

@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) { }

  // async create(createBookDto: CreateBookDto) {
  //   const {
  //     title,
  //     image,
  //     description,
  //     price,
  //     publishedAt,
  //     authorIds,
  //     categoryIds,
  //   } = createBookDto;

  //   return this.prisma.book.create({
  //     data: {
  //       title,
  //       image,
  //       description,
  //       price,
  //       publishedAt: publishedAt || new Date(),
  //       authors: {
  //         connect: authorIds.map((id) => ({ id })),
  //       },
  //       categories: {
  //         connect: categoryIds.map((id) => ({ id })),
  //       },
  //     },
  //     include: {
  //       authors: true,
  //       categories: true,
  //     },
  //   });
  // }

  // async createBookWithImage(body: any, imagePath: string) {
  //   const { title, description, price, publishedAt, authorIds, categoryIds } =
  //     body;

  //   const normalizedAuthorIds = Array.isArray(authorIds)
  //     ? authorIds
  //     : typeof authorIds === 'string'
  //       ? [authorIds]
  //       : [];

  //   const normalizedCategoryIds = Array.isArray(categoryIds)
  //     ? categoryIds
  //     : typeof categoryIds === 'string'
  //       ? [categoryIds]
  //       : [];

  //   return this.prisma.book.create({
  //     data: {
  //       title,
  //       image: imagePath,
  //       description,
  //       price: Number(price),
  //       publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
  //       authors: {
  //         connect: normalizedAuthorIds.map((id: string) => ({ id })),
  //       },
  //       categories: {
  //         connect: normalizedCategoryIds.map((id: string) => ({ id })),
  //       },
  //     },
  //     include: {
  //       authors: true,
  //       categories: true,
  //     },
  //   });
  // }
  async createBookWithImage(body: any, imagePath: string) {
    const { title, description, price, publishedAt, authorIds, categoryIds } =
      body;

    const normalizedAuthorIds = Array.isArray(authorIds)
      ? authorIds
      : typeof authorIds === 'string'
        ? [authorIds]
        : [];

    const normalizedCategoryIds = Array.isArray(categoryIds)
      ? categoryIds
      : typeof categoryIds === 'string'
        ? [categoryIds]
        : [];

    console.log('Normalized Category IDs:', normalizedCategoryIds); // debug

    return this.prisma.book.create({
      data: {
        title,
        image: imagePath,
        description,
        price: Number(price),
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        authors: {
          connect: normalizedAuthorIds.map((id: string) => ({ id })),
        },
        categories: {
          connect: normalizedCategoryIds.map((id: string) => ({ id })),
        },
      },
      include: {
        authors: true,
        categories: true,
      },
    });
  }

  async disableBookById(bookId: string) {
    return this.prisma.book.update({
      where: { id: bookId },
      data: { status: 'DISABLE' },
    });
  }
  async getById(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        authors: true,
        categories: true,
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async updateBookWithImage(id: string, body: any, imagePath: string | null) {
    const existingBook = await this.prisma.book.findUnique({ where: { id } });
    if (!existingBook) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    const { title, description, price, publishedAt, authorIds, categoryIds } =
      body;

    const normalizedAuthorIds = Array.isArray(authorIds)
      ? authorIds
      : typeof authorIds === 'string'
        ? [authorIds]
        : [];

    const normalizedCategoryIds = Array.isArray(categoryIds)
      ? categoryIds
      : typeof categoryIds === 'string'
        ? [categoryIds]
        : [];

    return this.prisma.book.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: Number(price) }),
        ...(publishedAt && { publishedAt: new Date(publishedAt) }),
        ...(imagePath && { image: imagePath }),
        ...(normalizedAuthorIds.length && {
          authors: {
            set: normalizedAuthorIds.map((id: string) => ({ id })),
          },
        }),
        ...(normalizedCategoryIds.length && {
          categories: {
            set: normalizedCategoryIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        authors: true,
        categories: true,
      },
    });
  }

  async findAllBooks(query: BookFilterDto) {
    const { page = 1, limit = 10, authorId, categoryId, status } = query;

    // Tính tổng số bản ghi
    const totalRecords = await this.prisma.book.count({
      where: {
        ...(status && { status }),
        ...(authorId && {
          authors: {
            some: { id: authorId },
          },
        }),
        ...(categoryId && {
          categories: {
            some: { id: categoryId },
          },
        }),
      },
    });

    // Lấy danh sách sách với phân trang
    const books = await this.prisma.book.findMany({
      where: {
        ...(status && { status }),
        ...(authorId && {
          authors: {
            some: { id: authorId },
          },
        }),
        ...(categoryId && {
          categories: {
            some: { id: categoryId },
          },
        }),
      },
      include: {
        authors: true,
        categories: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Tính tổng số trang
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      totalRecords,
      totalPages,
      currentPage: page,
      books,
    };
  }
  async updateStock(id: string, stock: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException('Không tìm thấy sách');
    }

    return this.prisma.book.update({
      where: { id },
      data: { stock },
    });
  }
  async getBestSellers(limit: number = 5) {
    return this.prisma.book.findMany({
      where: {
        status: 'AVAILABLE',
      },
      orderBy: {
        sold: 'desc',
      },
      take: limit,
    });
  }

  async getNewArrivals() {
    return this.prisma.book.findMany({
      where: {
        status: 'AVAILABLE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  }


}
