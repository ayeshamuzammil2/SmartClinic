import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { Role } from '../src/common/enums';
import { auth, createTestApp, IDS } from './test-utils';

describe('AuthController', () => {
  let app: INestApplication;
  const service = {
    register: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: {} }),
    login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: {} }),
    refresh: jest.fn().mockResolvedValue({ accessToken: 'a2', refreshToken: 'r2' }),
    me: jest.fn().mockResolvedValue({ id: IDS.patient, role: Role.PATIENT }),
  };

  beforeAll(async () => {
    app = await createTestApp([AuthController], [
      { provide: AuthService, useValue: service },
    ]);
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /auth/register is public and validates the body', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short', fullName: '' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'new@test.com', password: 'Password1!', fullName: 'New User' })
      .expect(201);
    expect(service.register).toHaveBeenCalled();
  });

  it('POST /auth/login returns a token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'patient@smartclinic.test', password: 'Password1!' })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('POST /auth/refresh rotates tokens', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'some-token' })
      .expect(200);
    expect(service.refresh).toHaveBeenCalledWith('some-token');
  });

  it('GET /auth/me requires a valid JWT', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set(...auth(Role.PATIENT))
      .expect(200);
    expect(service.me).toHaveBeenCalledWith(IDS.patient);
  });
});
