import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiSuccessResponse,
  ApiErrorResponse,
} from '../../common/dto/api-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Prisma, BookStatus } from '@prisma/client';
import { BookFilterDto } from './dto/book-filter.dto';

@ApiTags('Books')
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  // @Post('add')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Add new book' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Add successful',
  //   type: ApiSuccessResponse,
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Invalid credentials',
  //   type: ApiErrorResponse,
  // })
  // create(@Body() createBookDto: CreateBookDto) {
  //   return this.bookService.create(createBookDto);
  // }

  @Get('best-sellers')
  async getBestSellers() {
    const limitNumber = 5;
    return this.bookService.getBestSellers(limitNumber);
  }

  @Get('new-arrivals')
  async getNewArrivals() {
    return this.bookService.getNewArrivals();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by ID' })
  @ApiParam({ name: 'id', required: true })
  getById(@Param('id') id: string) {
    return this.bookService.getById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all books with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BookStatus })
  async getBooks(@Query() query: BookFilterDto) {
    const result = await this.bookService.findAllBooks(query);
    return {
      totalRecords: result.totalRecords,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      books: result.books,
    };
  }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update book by ID' })
  // @ApiParam({ name: 'id', required: true })
  // update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
  //   return this.bookService.update(id, updateBookDto);
  // }
  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable a book by ID (soft delete)' })
  disableBook(@Param('id') id: string) {
    return this.bookService.disableBookById(id);
  }

  @Post('create-book')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload image and create book' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        publishedAt: { type: 'string', format: 'date-time' },
        authorIds: {
          type: 'array',
          items: { type: 'string' },
        },
        categoryIds: {
          type: 'array',
          items: { type: 'string' },
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/books',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadBookImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const imagePath = `/uploads/books/${file.filename}`;
    return this.bookService.createBookWithImage(body, imagePath);
  }

  @Patch(':id/update-book')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update book with optional image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        publishedAt: { type: 'string', format: 'date-time' },
        authorIds: {
          type: 'array',
          items: { type: 'string' },
        },
        categoryIds: {
          type: 'array',
          items: { type: 'string' },
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/books',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async updateBookWithImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const imagePath = file ? `/uploads/books/${file.filename}` : null;
    return this.bookService.updateBookWithImage(id, body, imagePath);
  }
  @Patch(':id/stock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật tồn kho sách' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        stock: { type: 'number', example: 10 },
      },
    },
  })
  async updateStock(@Param('id') id: string, @Body('stock') stock: number) {
    if (isNaN(stock) || stock < 0) {
      throw new BadRequestException('Số lượng tồn kho không hợp lệ');
    }
    return this.bookService.updateStock(id, stock);
  }

   
}
