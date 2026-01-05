import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GuestMenuService } from './guest.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('/api/menu')
export class GuestMenuController {
  constructor(private readonly service: GuestMenuService) {}

  @Get()
  load(@Query() q: any) {
    return this.service.load(q);
  }
}
