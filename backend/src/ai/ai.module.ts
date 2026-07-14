import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Appointment, DoctorProfile, TriageSummary, VisitRecord,
} from '../entities';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LlmClient } from './llm.client';
import { NoShowService } from './no-show.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, TriageSummary, VisitRecord, DoctorProfile]),
  ],
  controllers: [AiController],
  providers: [AiService, LlmClient, NoShowService],
})
export class AiModule {}
