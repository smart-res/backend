import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminsService } from './admins.service';
import { Admin, AdminSchema } from './admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminModule {}
