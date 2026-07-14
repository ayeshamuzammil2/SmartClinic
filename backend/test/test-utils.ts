import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { Role } from '../src/common/enums';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';

export const IDS = {
  patient: '11111111-1111-4111-8111-111111111111',
  doctor: '22222222-2222-4222-8222-222222222222',
  receptionist: '33333333-3333-4333-8333-333333333333',
  admin: '44444444-4444-4444-8444-444444444444',
  appointment: '55555555-5555-4555-8555-555555555555',
  record: '66666666-6666-4666-8666-666666666666',
  preauth: '77777777-7777-4777-8777-777777777777',
  notification: '88888888-8888-4888-8888-888888888888',
};

/**
 * Builds a Nest app with the given controller(s) and mocked providers but the
 * REAL global JWT + roles guards, so role-protected routes are tested end-to-end
 * (401 without a token, 403 with the wrong role).
 */
export async function createTestApp(
  controllers: any[],
  providers: Array<{ provide: any; useValue: any }>,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers,
    providers: [
      ...providers,
      JwtStrategy,
      { provide: APP_GUARD, useClass: JwtAuthGuard },
      { provide: APP_GUARD, useClass: RolesGuard },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

export function tokenFor(role: Role, id?: string): string {
  const sub = id ?? IDS[role as keyof typeof IDS] ?? IDS.patient;
  return new JwtService().sign(
    { sub, email: `${role}@smartclinic.test`, role },
    { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '5m' },
  );
}

export function auth(role: Role, id?: string): [string, string] {
  return ['Authorization', `Bearer ${tokenFor(role, id)}`];
}
