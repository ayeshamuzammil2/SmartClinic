import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('analytics')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('occupancy')
  @ApiOperation({ summary: 'Appointment occupancy per doctor (admin)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly'] })
  occupancy(@Query('period') period: 'daily' | 'weekly' = 'daily') {
    return this.analytics.occupancy(period === 'weekly' ? 'weekly' : 'daily');
  }

  @Get('no-show-trend')
  @ApiOperation({ summary: '30-day no-show rate trend (admin)' })
  noShowTrend() {
    return this.analytics.noShowTrend();
  }

  @Get('consultation-duration')
  @ApiOperation({ summary: 'Average consultation duration by specialty (admin)' })
  consultationDuration() {
    return this.analytics.consultationDuration();
  }

  @Get('insurance')
  @ApiOperation({ summary: 'Insurance approval rate + turnaround per provider (admin)' })
  insurance() {
    return this.analytics.insuranceStats();
  }
}
