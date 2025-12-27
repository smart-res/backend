import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RESTAURANT_ID } from '../../config/restaurant.config';
import { ModifierGroup } from './modifier-group.schema';
import { ModifierOption } from './modifier-option.schema';
import {
  CreateModifierGroupDto,
  CreateModifierOptionDto,
  UpdateModifierGroupDto,
  UpdateModifierOptionDto,
} from './dto/modifiers.dto';
import { dollarsToCents } from '../items/dto/item.dto';

@Injectable()
export class ModifiersService {
  constructor(
    @InjectModel(ModifierGroup.name) private readonly groupModel: Model<ModifierGroup>,
    @InjectModel(ModifierOption.name) private readonly optionModel: Model<ModifierOption>,
  ) {}

  private validateGroupRules(dto: CreateModifierGroupDto | (CreateModifierGroupDto & UpdateModifierGroupDto)) {
    const isRequired = dto.isRequired ?? false;
    const min = dto.minSelections ?? 0;
    const max = dto.maxSelections ?? 0;

    if (dto.selectionType === 'single') {
      return;
    }

    if (isRequired) {
      if (min < 1) throw new BadRequestException('minSelections must be >= 1 when required for multi-select');
      if (max > 0 && max < min) throw new BadRequestException('maxSelections must be >= minSelections');
    }
  }

  async createGroup(dto: CreateModifierGroupDto) {
    this.validateGroupRules(dto);

    try {
      return await this.groupModel.create({
        restaurantId: RESTAURANT_ID,
        name: dto.name.trim(),
        selectionType: dto.selectionType,
        isRequired: dto.isRequired ?? false,
        minSelections: dto.minSelections ?? 0,
        maxSelections: dto.maxSelections ?? 0,
        displayOrder: dto.displayOrder ?? 0,
        status: dto.status ?? 'active',
      });
    } catch (e: any) {
      if (e?.code === 11000) throw new BadRequestException('Modifier group name already exists');
      throw e;
    }
  }

  async listGroups(status: 'active' | 'inactive' | 'all' = 'all') {
    const filter: any = { restaurantId: RESTAURANT_ID };
    if (status !== 'all') filter.status = status;

    return this.groupModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
  }

  async getGroup(id: string) {
    const g = await this.groupModel.findOne({ _id: id, restaurantId: RESTAURANT_ID }).lean();
    if (!g) throw new NotFoundException('Group not found');
    return g;
  }

  async updateGroup(id: string, dto: UpdateModifierGroupDto) {
    const group = await this.groupModel.findOne({ _id: id, restaurantId: RESTAURANT_ID });
    if (!group) throw new NotFoundException('Group not found');

    const merged = { ...group.toObject(), ...dto } as any;
    this.validateGroupRules(merged);

    if (dto.name !== undefined) group.name = dto.name.trim();
    if (dto.selectionType !== undefined) group.selectionType = dto.selectionType;
    if (dto.isRequired !== undefined) group.isRequired = dto.isRequired;
    if (dto.minSelections !== undefined) group.minSelections = dto.minSelections;
    if (dto.maxSelections !== undefined) group.maxSelections = dto.maxSelections;
    if (dto.displayOrder !== undefined) group.displayOrder = dto.displayOrder;
    if (dto.status !== undefined) group.status = dto.status;

    try {
      await group.save();
      return group;
    } catch (e: any) {
      if (e?.code === 11000) throw new BadRequestException('Modifier group name already exists');
      throw e;
    }
  }

  async deleteGroup(id: string) {
    const group = await this.groupModel.findOne({ _id: id, restaurantId: RESTAURANT_ID });
    if (!group) throw new NotFoundException('Group not found');

    await this.optionModel.deleteMany({ groupId: new Types.ObjectId(id) });
    await this.groupModel.deleteOne({ _id: id, restaurantId: RESTAURANT_ID });

    return { deleted: true };
  }

  async listOptions(groupId: string, status: 'active' | 'inactive' | 'all' = 'all') {
    const group = await this.groupModel.findOne({ _id: groupId, restaurantId: RESTAURANT_ID }).lean();
    if (!group) throw new NotFoundException('Group not found');

    const filter: any = { groupId: new Types.ObjectId(groupId) };
    if (status !== 'all') filter.status = status;

    const options = await this.optionModel
      .find(filter)
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return options.map((o: any) => ({
      ...o,
      priceAdjustment: (o.priceAdjustmentCents ?? 0) / 100,
    }));
  }

  async createOption(dto: CreateModifierOptionDto) {
    const group = await this.groupModel.findOne({ _id: dto.groupId, restaurantId: RESTAURANT_ID });
    if (!group) throw new NotFoundException('Group not found');

    const cents = dto.priceAdjustment === undefined ? 0 : dollarsToCents(dto.priceAdjustment);
    if (cents < 0) throw new BadRequestException('priceAdjustment must be >= 0');

    let displayOrder = dto.displayOrder ?? 0;
    if (dto.displayOrder === undefined) {
      const last = await this.optionModel
        .find({ groupId: new Types.ObjectId(dto.groupId) })
        .sort({ displayOrder: -1 })
        .limit(1)
        .lean();
      displayOrder = last.length ? (last[0] as any).displayOrder + 1 : 0;
    }

    try {
      return await this.optionModel.create({
        groupId: new Types.ObjectId(dto.groupId),
        name: dto.name.trim(),
        priceAdjustmentCents: cents,
        displayOrder,
        status: 'active',
      });
    } catch (e: any) {
      if (e?.code === 11000) throw new BadRequestException('Option name already exists in this group');
      throw e;
    }
  }

  async updateOption(id: string, dto: UpdateModifierOptionDto) {
    const opt = await this.optionModel.findOne({ _id: id });
    if (!opt) throw new NotFoundException('Option not found');

    if (dto.name !== undefined) opt.name = dto.name.trim();
    if (dto.status !== undefined) opt.status = dto.status;

    if (dto.priceAdjustment !== undefined) {
      const cents = dollarsToCents(dto.priceAdjustment);
      if (cents < 0) throw new BadRequestException('priceAdjustment must be >= 0');
      opt.priceAdjustmentCents = cents;
    }

    if (dto.displayOrder !== undefined) opt.displayOrder = dto.displayOrder;

    try {
      await opt.save();
      return opt;
    } catch (e: any) {
      if (e?.code === 11000) throw new BadRequestException('Option name already exists in this group');
      throw e;
    }
  }

  async deleteOption(id: string) {
    const opt = await this.optionModel.findOne({ _id: id });
    if (!opt) throw new NotFoundException('Option not found');

    await this.optionModel.deleteOne({ _id: id });
    return { deleted: true };
  }

  async getGroupsWithOptions(groupIds: Types.ObjectId[]) {
    if (!groupIds?.length) return [];

    const groups = await this.groupModel
      .find({ _id: { $in: groupIds }, restaurantId: RESTAURANT_ID, status: 'active' })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const options = await this.optionModel
      .find({ groupId: { $in: groupIds }, status: 'active' })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    const map = new Map<string, any[]>();
    for (const o of options) {
      const key = String(o.groupId);
      const arr = map.get(key) ?? [];
      arr.push({
        ...o,
        priceAdjustment: (o as any).priceAdjustmentCents / 100,
      });
      map.set(key, arr);
    }

    return groups.map((g) => ({
      ...g,
      options: map.get(String(g._id)) ?? [],
    }));
  }
}
