import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController, UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { Role } from '../src/common/enums';
import { auth, createTestApp } from './test-utils';

describe('UsersController / AdminController', () => {
  let app: INestApplication;
  const service = {
    listDoctors: jest.fn().mockResolvedValue([]),
    specialties: jest.fn().mockReturnValue(['General Practice']),
    createDoctor: jest.fn().mockResolvedValue({ id: 'x', role: Role.DOCTOR }),
    listUsers: jest.fn().mockResolvedValue([]),
    listRooms: jest.fn().mockResolvedValue([]),
    createRoom: jest.fn().mockResolvedValue({ id: 'r' }),
  };

  beforeAll(async () => {
    app = await createTestApp([UsersController, AdminController], [
      { provide: UsersService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('GET /doctors and /specialties are public', async () => {
    await request(app.getHttpServer()).get('/doctors?specialty=Cardiology').expect(200);
    await request(app.getHttpServer()).get('/specialties').expect(200);
    expect(service.listDoctors).toHaveBeenCalledWith('Cardiology');
  });

  it('admin routes reject other roles', async () => {
    await request(app.getHttpServer()).get('/admin/users').expect(401);
    for (const role of [Role.PATIENT, Role.DOCTOR, Role.RECEPTIONIST]) {
      await request(app.getHttpServer())
        .get('/admin/users').set(...auth(role)).expect(403);
    }
    await request(app.getHttpServer())
      .get('/admin/users?role=patient').set(...auth(Role.ADMIN)).expect(200);
  });

  it('POST /admin/doctors validates specialty against the catalogue', async () => {
    await request(app.getHttpServer())
      .post('/admin/doctors')
      .set(...auth(Role.ADMIN))
      .send({
        email: 'dr.new@test.com', password: 'Password1!',
        fullName: 'Dr. New', specialty: 'Neurology', // not offered
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/admin/doctors')
      .set(...auth(Role.ADMIN))
      .send({
        email: 'dr.new@test.com', password: 'Password1!',
        fullName: 'Dr. New', specialty: 'Cardiology',
      })
      .expect(201);
  });

  it('rooms CRUD is admin-only', async () => {
    await request(app.getHttpServer())
      .post('/admin/rooms').set(...auth(Role.RECEPTIONIST))
      .send({ name: 'Room 1', branch: 'Downtown' }).expect(403);
    await request(app.getHttpServer())
      .post('/admin/rooms').set(...auth(Role.ADMIN))
      .send({ name: 'Room 1', branch: 'Downtown' }).expect(201);
    await request(app.getHttpServer())
      .get('/admin/rooms').set(...auth(Role.ADMIN)).expect(200);
  });
});
