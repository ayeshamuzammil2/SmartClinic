import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment, PreAuth } from '../entities';
import { PreAuthController } from './preauth.controller';
import { PreAuthService } from './preauth.service';

@Module({
  imports: [TypeOrmModule.forFeature([PreAuth, Appointment])],
  controllers: [PreAuthController],
  providers: [PreAuthService],
})
export class PreAuthModule {}
