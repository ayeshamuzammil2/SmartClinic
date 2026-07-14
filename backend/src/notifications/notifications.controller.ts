import { Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser, JwtUser, Roles } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List own notifications (newest first)' })
  list(@CurrentUser() user: JwtUser) {
    return this.notifications.listForUser(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.notifications.markRead(id, user.id);
  }

  @Post('reminder/:appointmentId')
  @Roles(Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Send mock WhatsApp/SMS reminder (receptionist)' })
  sendReminder(@Param('appointmentId', ParseUUIDPipe) appointmentId: string) {
    return this.notifications.sendMockReminder(appointmentId);
  }
}
