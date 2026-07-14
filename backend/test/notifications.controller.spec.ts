import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { NotificationsService } from '../src/notifications/notifications.service';
import { Role } from '../src/common/enums';
import { auth, createTestApp, IDS } from './test-utils';

describe('NotificationsController', () => {
  let app: INestApplication;
  const service = {
    listForUser: jest.fn().mockResolvedValue([]),
    markRead: jest.fn().mockResolvedValue({ id: IDS.notification, read: true }),
    sendMockReminder: jest.fn().mockResolvedValue({ sent: true, channel: 'sms', to: 'x' }),
  };

  beforeAll(async () => {
    app = await createTestApp([NotificationsController], [
      { provide: NotificationsService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('GET /notifications returns own notifications for any role', async () => {
    await request(app.getHttpServer()).get('/notifications').expect(401);
    await request(app.getHttpServer())
      .get('/notifications').set(...auth(Role.PATIENT)).expect(200);
    expect(service.listForUser).toHaveBeenCalledWith(IDS.patient);
  });

  it('PATCH /notifications/:id/read scopes to the current user', async () => {
    await request(app.getHttpServer())
      .patch(`/notifications/${IDS.notification}/read`)
      .set(...auth(Role.DOCTOR))
      .expect(200);
    expect(service.markRead).toHaveBeenCalledWith(IDS.notification, IDS.doctor);
  });

  it('POST /notifications/reminder/:id is receptionist-only (mock SMS)', async () => {
    await request(app.getHttpServer())
      .post(`/notifications/reminder/${IDS.appointment}`)
      .set(...auth(Role.PATIENT))
      .expect(403);
    const res = await request(app.getHttpServer())
      .post(`/notifications/reminder/${IDS.appointment}`)
      .set(...auth(Role.RECEPTIONIST))
      .expect(201);
    expect(res.body.sent).toBe(true);
  });
});
