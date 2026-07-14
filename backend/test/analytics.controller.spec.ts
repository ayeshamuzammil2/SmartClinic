import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AnalyticsController } from '../src/analytics/analytics.controller';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { Role } from '../src/common/enums';
import { auth, createTestApp } from './test-utils';

describe('AnalyticsController', () => {
  let app: INestApplication;
  const service = {
    occupancy: jest.fn().mockResolvedValue([]),
    noShowTrend: jest.fn().mockResolvedValue([]),
    consultationDuration: jest.fn().mockResolvedValue([]),
    insuranceStats: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    app = await createTestApp([AnalyticsController], [
      { provide: AnalyticsService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  const routes = [
    '/analytics/occupancy',
    '/analytics/no-show-trend',
    '/analytics/consultation-duration',
    '/analytics/insurance',
  ];

  it('is admin-only on every route', async () => {
    for (const route of routes) {
      await request(app.getHttpServer()).get(route).expect(401);
      await request(app.getHttpServer())
        .get(route).set(...auth(Role.RECEPTIONIST)).expect(403);
      await request(app.getHttpServer())
        .get(route).set(...auth(Role.DOCTOR)).expect(403);
      await request(app.getHttpServer())
        .get(route).set(...auth(Role.ADMIN)).expect(200);
    }
  });

  it('passes the occupancy period through', async () => {
    await request(app.getHttpServer())
      .get('/analytics/occupancy?period=weekly')
      .set(...auth(Role.ADMIN))
      .expect(200);
    expect(service.occupancy).toHaveBeenCalledWith('weekly');
  });
});
