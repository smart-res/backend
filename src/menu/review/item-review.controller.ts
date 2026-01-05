import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ItemReviewsService } from './item-review.service';
import { CreateItemReviewDto, ListItemReviewsQuery } from './dto/item-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('/api')
export class ItemReviewsController {
  constructor(private readonly service: ItemReviewsService) {}

  // CUSTOMER: create review
  @Post('/customer/item-reviews')
  async create(@Body() dto: CreateItemReviewDto) {
    return this.service.create(dto /*, userId*/);
  }

  // CUSTOMER: list reviews by item
  @Get('/customer/menu/:id/reviews')
  async listByItem(@Param('id') itemId: string, @Query() q: ListItemReviewsQuery) {
    return this.service.listByItem(itemId, q);
  }

  // CUSTOMER: delete own review (soft delete)
  @Delete('/customer/item-reviews/:reviewId')
  async remove(@Param('reviewId') reviewId: string) {
    return this.service.remove(reviewId /*, userId*/);
  }
}
