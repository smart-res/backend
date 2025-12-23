import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Admin extends Document {
  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'ADMIN' })
  role: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);