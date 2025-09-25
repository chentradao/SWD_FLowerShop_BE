import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class UpdateBookDto extends PartialType(CreateBookDto) {
  @ApiProperty({ example: 'New Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'New Image', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 250000, required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  publishedAt?: Date;

  @ApiProperty({ example: ['1', '2'], required: false })
  @IsOptional()
  @IsArray()
  authorIds?: string[];

  @ApiProperty({ example: ['3'], required: false })
  @IsOptional()
  @IsArray()
  categoryIds?: string[];
}
