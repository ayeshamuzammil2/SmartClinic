import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RecordsController } from '../src/records/records.controller';
import { RecordsService } from '../src/records/records.service';
import { Role } from '../src/common/enums';
import { auth, createTestApp, IDS } from './test-utils';

describe('RecordsController', () => {
  let app: INestApplication;
  const service = {
    list: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue({ id: IDS.record }),
    create: jest.fn().mockResolvedValue({ id: IDS.record }),
    update: jest.fn().mockResolvedValue({ id: IDS.record, finalized: true }),
    attachFile: jest.fn(),
    getFile: jest.fn(),
  };

  beforeAll(async () => {
    app = await createTestApp([RecordsController], [
      { provide: RecordsService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('blocks unauthenticated and wrong-role access', async () => {
    await request(app.getHttpServer()).get('/records').expect(401);
    await request(app.getHttpServer())
      .get('/records').set(...auth(Role.RECEPTIONIST)).expect(403);
    await request(app.getHttpServer())
      .get('/records').set(...auth(Role.ADMIN)).expect(403);
  });

  it('GET /records works for patients and doctors', async () => {
    await request(app.getHttpServer())
      .get('/records').set(...auth(Role.PATIENT)).expect(200);
    await request(app.getHttpServer())
      .get(`/records?patientId=${IDS.patient}`)
      .set(...auth(Role.DOCTOR))
      .expect(200);
    expect(service.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: Role.DOCTOR }),
      IDS.patient,
    );
  });

  it('POST /records is doctor-only', async () => {
    const body = { appointmentId: IDS.appointment, subjective: 'Test' };
    await request(app.getHttpServer())
      .post('/records').set(...auth(Role.PATIENT)).send(body).expect(403);
    await request(app.getHttpServer())
      .post('/records').set(...auth(Role.DOCTOR)).send(body).expect(201);
    expect(service.create).toHaveBeenCalled();
  });

  it('PATCH /records/:id forwards finalize flag', async () => {
    await request(app.getHttpServer())
      .patch(`/records/${IDS.record}`)
      .set(...auth(Role.DOCTOR))
      .send({ assessment: 'Improved', finalize: true })
      .expect(200);
    expect(service.update).toHaveBeenCalledWith(
      expect.anything(),
      IDS.record,
      expect.objectContaining({ finalize: true }),
    );
  });

  it('validates icdCodes shape', async () => {
    await request(app.getHttpServer())
      .patch(`/records/${IDS.record}`)
      .set(...auth(Role.DOCTOR))
      .send({ icdCodes: [{ code: 'M54.5' }] }) // missing description
      .expect(400);
  });
});
