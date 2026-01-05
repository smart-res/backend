import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ModifiersService } from './modifiers.service';
import {
  CreateModifierGroupDto,
  CreateModifierOptionDto,
  UpdateModifierGroupDto,
  UpdateModifierOptionDto,
  ListGroupsQueryDto,
} from './dto/modifiers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('/api/admin/menu')
export class ModifiersController {
  constructor(private readonly service: ModifiersService) {}

  @Post('modifier-groups')
  createGroup(@Body() dto: CreateModifierGroupDto) {
    return this.service.createGroup(dto);
  }

  @Get('modifier-groups')
  listGroups(@Query() q: ListGroupsQueryDto) {
    return this.service.listGroups(q.status ?? 'all');
  }

  @Get('modifier-groups/:id')
  getGroup(@Param('id') id: string) {
    return this.service.getGroup(id);
  }

  @Put('modifier-groups/:id')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.service.updateGroup(id, dto);
  }

  @Delete('modifier-groups/:id')
  deleteGroup(@Param('id') id: string) {
    return this.service.deleteGroup(id);
  }

  @Get('modifier-groups/:id/options')
  listOptions(@Param('id') groupId: string, @Query('status') status?: 'active' | 'inactive' | 'all') {
    return this.service.listOptions(groupId, status ?? 'all');
  }

  @Post('modifier-groups/:id/options')
  createOption(@Param('id') groupId: string, @Body() dto: Omit<CreateModifierOptionDto, 'groupId'>) {
    return this.service.createOption({ ...dto, groupId });
  }

  @Put('modifier-options/:id')
  updateOption(@Param('id') id: string, @Body() dto: UpdateModifierOptionDto) {
    return this.service.updateOption(id, dto);
  }

  @Delete('modifier-options/:id')
  deleteOption(@Param('id') id: string) {
    return this.service.deleteOption(id);
  }
}
