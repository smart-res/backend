import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminModule } from '../admins/admin.module';

@Module({
  imports: [
    AdminModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
