import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  image: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsOptional()
  publishedAt?: Date;

  @IsArray()
  authorIds: string[] | string; // danh sách ID tác giả

  @IsArray()
  categoryIds: string[] | string; // danh sách ID thể loại
}
