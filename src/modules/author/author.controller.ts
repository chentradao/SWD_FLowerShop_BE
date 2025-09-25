import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AuthorSevice } from './author.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';

@Controller('authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorSevice) {}

  @Get()
  async getAll() {
    return this.authorService.getAllAuthors();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.authorService.findById(id);
  }

  @Post()
  async create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorService.create(createAuthorDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAuthorDto: UpdateAuthorDto) {
    return this.authorService.updateById(id, updateAuthorDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.authorService.deleteById(id);
  }

  @Get(':id/books')
  async getAllBooksByAuthorId(@Param('id') id: string) {
    return this.authorService.getAllBooksByAuthorId(id);
  }
}
