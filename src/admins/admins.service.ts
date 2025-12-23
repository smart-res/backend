import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin } from './admin.schema';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
  ) {}

  findByUsername(username: string) {
    return this.adminModel.findOne({ username });
  }

  create(data: Partial<Admin>) {
    return this.adminModel.create(data);
  }
}
