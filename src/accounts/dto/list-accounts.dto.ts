import { IsIn, IsOptional, IsString } from 'class-validator';
import { ROLES, STATUSES } from '../../common/constants/roles';

export class ListAccountsDto {
  @IsOptional()
  @IsIn(ROLES as unknown as string[])
  role?: string;

  @IsOptional()
  @IsIn(STATUSES as unknown as string[])
  status?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
