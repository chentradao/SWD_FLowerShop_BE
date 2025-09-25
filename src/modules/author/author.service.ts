import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';

@Injectable()
export class AuthorSevice {
  constructor(private prisma: PrismaService) { }

  async getAllAuthors() {
    return this.prisma.author.findMany({
      select: {
        id: true,
        name: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(authorId: string) {
    const author = await this.prisma.author.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!author) throw new NotFoundException('Author not found');
    return author;
  }

  async create(createAuthorDto: CreateAuthorDto) {
    return this.prisma.author.create({
      data: createAuthorDto,
    });
  }

  async updateById(authorId: string, updateAuthorDto: UpdateAuthorDto) {
    const author = await this.prisma.author.findUnique({ where: { id: authorId } });
    if (!author) throw new NotFoundException('Author not found');
    return this.prisma.author.update({
      where: { id: authorId },
      data: updateAuthorDto,
    });
  }

  async deleteById(authorId: string) {
    const author = await this.prisma.author.findUnique({ where: { id: authorId } });
    if (!author) throw new NotFoundException('Author not found');
    return this.prisma.author.delete({ where: { id: authorId } });
  }

  async getAllBooksByAuthorId(authorId: string) {
    const author = await this.prisma.author.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        books: {
          select: {
            id: true,
            title: true,
           } 
        },
      },
    });

    if (!author) {
      throw new Error("Author not found");
    }

    return {
      id: author.id,
      name: author.name,
      books: author.books,
    };
  }
}
