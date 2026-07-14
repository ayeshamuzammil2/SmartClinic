import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment, LabFile, PreAuth, VisitRecord } from '../entities';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  imports: [TypeOrmModule.forFeature([VisitRecord, Appointment, PreAuth, LabFile])],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
