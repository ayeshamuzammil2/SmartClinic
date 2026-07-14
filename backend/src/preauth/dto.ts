import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { INSURANCE_PROVIDERS, PreAuthStatus } from '../common/enums';

export class CreatePreAuthDto {
  @ApiProperty()
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ enum: INSURANCE_PROVIDERS })
  @IsIn([...INSURANCE_PROVIDERS])
  provider: string;

  @ApiProperty({ example: 'I10' })
  @IsString()
  @IsNotEmpty()
  diagnosisCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePreAuthStatusDto {
  @ApiProperty({ enum: [PreAuthStatus.SUBMITTED, PreAuthStatus.APPROVED, PreAuthStatus.REJECTED] })
  @IsIn([PreAuthStatus.SUBMITTED, PreAuthStatus.APPROVED, PreAuthStatus.REJECTED])
  status: PreAuthStatus;
}
