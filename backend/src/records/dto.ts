import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested,
} from 'class-validator';

export class IcdCodeDto {
  @ApiProperty({ example: 'M54.5' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Low back pain' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateRecordDto {
  @ApiProperty()
  @IsUUID()
  appointmentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiProperty({ required: false, type: [IcdCodeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IcdCodeDto)
  icdCodes?: IcdCodeDto[];
}

export class UpdateRecordDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiProperty({ required: false, type: [IcdCodeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IcdCodeDto)
  icdCodes?: IcdCodeDto[];

  @ApiProperty({ required: false, description: 'Finalize the note (blocked for specialist visits without approved pre-auth)' })
  @IsOptional()
  @IsBoolean()
  finalize?: boolean;
}
