import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItem } from '../items/item.schema';
import { MenuItemPhoto } from './photo.schema';
import { RESTAURANT_ID } from '../../config/restaurant.config';

@Injectable()
export class PhotosService {
  constructor(
    @InjectModel(MenuItem.name) private readonly itemModel: Model<MenuItem>,
    @InjectModel(MenuItemPhoto.name) private readonly photoModel: Model<MenuItemPhoto>,
  ) {}

  private oid(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  private async ensureItem(itemId: string) {
    const item = await this.itemModel.findOne({
      _id: this.oid(itemId),
      restaurantId: RESTAURANT_ID,
      isDeleted: false,
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async list(itemId: string) {
    await this.ensureItem(itemId);
    return this.photoModel
      .find({ menuItemId: this.oid(itemId) })
      .sort({ isPrimary: -1, createdAt: -1 })
      .lean();
  }

  async addPhotos(itemId: string, urls: string[]) {
    await this.ensureItem(itemId);

    const itemOid = this.oid(itemId);
    const hasPrimary = await this.photoModel.exists({
      menuItemId: itemOid,
      isPrimary: true,
    });

    const docs = urls.map((url, idx) => ({
      menuItemId: itemOid,
      url,
      isPrimary: !hasPrimary && idx === 0,
    }));

    await this.photoModel.insertMany(docs);

    return this.photoModel
      .find({ menuItemId: itemOid })
      .sort({ isPrimary: -1, createdAt: -1 })
      .lean();
  }

  async removePhoto(itemId: string, photoId: string) {
    await this.ensureItem(itemId);

    const itemOid = this.oid(itemId);
    const photo = await this.photoModel.findOne({
      _id: this.oid(photoId),
      menuItemId: itemOid,
    });
    if (!photo) throw new NotFoundException('Photo not found');

    const wasPrimary = photo.isPrimary;
    await photo.deleteOne();

    if (wasPrimary) {
      const next = await this.photoModel
        .findOne({ menuItemId: itemOid })
        .sort({ createdAt: -1 });
      if (next) {
        await this.photoModel.updateOne({ _id: next._id }, { $set: { isPrimary: true } });
      }
    }

    return { success: true };
  }

  async setPrimary(itemId: string, photoId: string) {
    await this.ensureItem(itemId);

    const itemOid = this.oid(itemId);
    const photo = await this.photoModel.findOne({
      _id: this.oid(photoId),
      menuItemId: itemOid,
    });
    if (!photo) throw new NotFoundException('Photo not found');

    await this.photoModel.updateMany({ menuItemId: itemOid }, { $set: { isPrimary: false } });
    await this.photoModel.updateOne({ _id: photo._id }, { $set: { isPrimary: true } });

    return { success: true };
  }
}
