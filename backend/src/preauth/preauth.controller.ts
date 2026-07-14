import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PreAuthService } from './preauth.service';
import { CreatePreAuthDto, UpdatePreAuthStatusDto } from './dto';
import { Roles } from '../common/decorators';
import { PreAuthStatus, Role } from '../common/enums';

@ApiTags('preauth')
@ApiBearerAuth()
@Controller('preauth')
export class PreAuthController {
  constructor(private preauth: PreAuthService) {}

  @Post()
  @Roles(Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Submit a pre-auth request for a specialist appointment' })
  create(@Body() dto: CreatePreAuthDto) {
    return this.preauth.create(dto);
  }

  @Get()
  @Roles(Role.RECEPTIONIST, Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'List pre-auth requests' })
  @ApiQuery({ name: 'status', required: false, enum: PreAuthStatus })
  list(@Query('status') status?: PreAuthStatus) {
    return this.preauth.list(status);
  }

  @Patch(':id/status')
  @Roles(Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Advance pre-auth status (pending → submitted → approved/rejected)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePreAuthStatusDto,
  ) {
    return this.preauth.updateStatus(id, dto);
  }
}
