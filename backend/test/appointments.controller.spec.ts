import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppointmentsController } from '../src/appointments/appointments.controller';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { Role } from '../src/common/enums';
import { auth, createTestApp, IDS } from './test-utils';

describe('AppointmentsController', () => {
  let app: INestApplication;
  const service = {
    getSlots: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: IDS.appointment }),
    list: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue({ id: IDS.appointment }),
    update: jest.fn().mockResolvedValue({ id: IDS.appointment }),
    joinWaitlist: jest.fn().mockResolvedValue({ position: 1 }),
  };

  beforeAll(async () => {
    app = await createTestApp([AppointmentsController], [
      { provide: AppointmentsService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/appointments').expect(401);
    await request(app.getHttpServer()).post('/appointments').send({}).expect(401);
  });

  it('GET /appointments/slots validates the query', async () => {
    await request(app.getHttpServer())
      .get('/appointments/slots')
      .set(...auth(Role.PATIENT))
      .expect(400); // missing doctorId/date

    await request(app.getHttpServer())
      .get(`/appointments/slots?doctorId=${IDS.doctor}&date=2026-07-15`)
      .set(...auth(Role.PATIENT))
      .expect(200);
    expect(service.getSlots).toHaveBeenCalledWith(IDS.doctor, '2026-07-15');
  });

  it('POST /appointments allows patients and receptionists but not doctors', async () => {
    const body = { doctorId: IDS.doctor, startTime: '2026-07-15T09:30:00.000Z' };
    await request(app.getHttpServer())
      .post('/appointments').set(...auth(Role.DOCTOR)).send(body).expect(403);
    await request(app.getHttpServer())
      .post('/appointments').set(...auth(Role.PATIENT)).send(body).expect(201);
    await request(app.getHttpServer())
      .post('/appointments').set(...auth(Role.RECEPTIONIST))
      .send({ ...body, patientId: IDS.patient }).expect(201);
  });

  it('GET /appointments is role-scoped through the service', async () => {
    await request(app.getHttpServer())
      .get('/appointments?date=2026-07-15')
      .set(...auth(Role.RECEPTIONIST))
      .expect(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ role: Role.RECEPTIONIST }),
      expect.objectContaining({ date: '2026-07-15' }),
    );
  });

  it('PATCH /appointments/:id forwards status changes', async () => {
    await request(app.getHttpServer())
      .patch(`/appointments/${IDS.appointment}`)
      .set(...auth(Role.RECEPTIONIST))
      .send({ status: 'checked_in' })
      .expect(200);
    expect(service.update).toHaveBeenCalled();
  });

  it('POST /appointments/waitlist works for patients', async () => {
    await request(app.getHttpServer())
      .post('/appointments/waitlist')
      .set(...auth(Role.PATIENT))
      .send({ doctorId: IDS.doctor, date: '2026-07-15' })
      .expect(201);
    expect(service.joinWaitlist).toHaveBeenCalled();
  });
});
