import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @IsInt()
  @Min(1)
  @Max(20)
  capacity: number;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
