import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PreAuthController } from '../src/preauth/preauth.controller';
import { PreAuthService } from '../src/preauth/preauth.service';
import { PreAuthStatus, Role } from '../src/common/enums';
import { auth, createTestApp, IDS } from './test-utils';

describe('PreAuthController', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn().mockResolvedValue({ id: IDS.preauth, status: 'pending' }),
    list: jest.fn().mockResolvedValue([]),
    updateStatus: jest.fn().mockResolvedValue({ id: IDS.preauth, status: 'submitted' }),
  };

  beforeAll(async () => {
    app = await createTestApp([PreAuthController], [
      { provide: PreAuthService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /preauth is receptionist-only', async () => {
    const body = { appointmentId: IDS.appointment, provider: 'AXA', diagnosisCode: 'I10' };
    await request(app.getHttpServer())
      .post('/preauth').send(body).expect(401);
    await request(app.getHttpServer())
      .post('/preauth').set(...auth(Role.PATIENT)).send(body).expect(403);
    await request(app.getHttpServer())
      .post('/preauth').set(...auth(Role.DOCTOR)).send(body).expect(403);
    await request(app.getHttpServer())
      .post('/preauth').set(...auth(Role.RECEPTIONIST)).send(body).expect(201);
  });

  it('rejects unknown insurance providers', async () => {
    await request(app.getHttpServer())
      .post('/preauth')
      .set(...auth(Role.RECEPTIONIST))
      .send({ appointmentId: IDS.appointment, provider: 'Unknown', diagnosisCode: 'I10' })
      .expect(400);
  });

  it('GET /preauth allows receptionist, admin and doctor with status filter', async () => {
    await request(app.getHttpServer())
      .get('/preauth?status=pending').set(...auth(Role.ADMIN)).expect(200);
    await request(app.getHttpServer())
      .get('/preauth').set(...auth(Role.DOCTOR)).expect(200);
    await request(app.getHttpServer())
      .get('/preauth').set(...auth(Role.PATIENT)).expect(403);
    expect(service.list).toHaveBeenCalledWith(PreAuthStatus.PENDING);
  });

  it('PATCH /preauth/:id/status validates the target status', async () => {
    await request(app.getHttpServer())
      .patch(`/preauth/${IDS.preauth}/status`)
      .set(...auth(Role.RECEPTIONIST))
      .send({ status: 'pending' }) // cannot go back to pending
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/preauth/${IDS.preauth}/status`)
      .set(...auth(Role.RECEPTIONIST))
      .send({ status: 'submitted' })
      .expect(200);
  });
});
