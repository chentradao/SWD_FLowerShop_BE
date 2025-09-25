import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;
}
