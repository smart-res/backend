import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['active', 'inactive'])
  status: 'active' | 'inactive';
}
