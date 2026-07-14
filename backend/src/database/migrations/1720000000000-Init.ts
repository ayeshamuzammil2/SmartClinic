import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1720000000000 implements MigrationInterface {
  name = 'Init1720000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "passwordHash" varchar NOT NULL,
        "fullName" varchar NOT NULL,
        "phone" varchar,
        "role" varchar NOT NULL,
        "refreshTokenHash" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(`
      CREATE TABLE "rooms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "branch" varchar NOT NULL
      )`);

    await q.query(`
      CREATE TABLE "doctor_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "specialty" varchar NOT NULL,
        "bio" text,
        "roomId" uuid REFERENCES "rooms"("id") ON DELETE SET NULL
      )`);

    await q.query(`
      CREATE TABLE "appointments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "patientId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "doctorId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "startTime" timestamptz NOT NULL,
        "endTime" timestamptz NOT NULL,
        "status" varchar NOT NULL DEFAULT 'scheduled',
        "reason" text,
        "createdById" uuid,
        "checkedInAt" timestamptz,
        "completedAt" timestamptz,
        "reminded24h" boolean NOT NULL DEFAULT false,
        "reminded1h" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(
      `CREATE INDEX "idx_appointments_doctor_start" ON "appointments" ("doctorId", "startTime")`,
    );
    // Database-level double-booking protection: one active appointment per doctor per slot.
    await q.query(`
      CREATE UNIQUE INDEX "uq_appointments_doctor_slot_active"
      ON "appointments" ("doctorId", "startTime")
      WHERE "status" NOT IN ('cancelled', 'no_show')`);

    await q.query(`
      CREATE TABLE "waitlist_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "doctorId" uuid NOT NULL,
        "patientId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "notified" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(`
      CREATE TABLE "visit_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointmentId" uuid NOT NULL UNIQUE REFERENCES "appointments"("id") ON DELETE CASCADE,
        "patientId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "doctorId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subjective" text NOT NULL DEFAULT '',
        "objective" text NOT NULL DEFAULT '',
        "assessment" text NOT NULL DEFAULT '',
        "plan" text NOT NULL DEFAULT '',
        "icdCodes" jsonb NOT NULL DEFAULT '[]',
        "finalized" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(`
      CREATE TABLE "lab_files" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "recordId" uuid NOT NULL REFERENCES "visit_records"("id") ON DELETE CASCADE,
        "filename" varchar NOT NULL,
        "storedPath" varchar NOT NULL,
        "mimetype" varchar NOT NULL,
        "size" int NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(`
      CREATE TABLE "triage_summaries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointmentId" uuid NOT NULL UNIQUE REFERENCES "appointments"("id") ON DELETE CASCADE,
        "patientId" uuid NOT NULL,
        "summary" jsonb NOT NULL,
        "source" varchar NOT NULL DEFAULT 'ai',
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(`
      CREATE TABLE "pre_auths" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "appointmentId" uuid NOT NULL REFERENCES "appointments"("id") ON DELETE CASCADE,
        "provider" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "diagnosisCode" varchar NOT NULL,
        "notes" text,
        "submittedAt" timestamptz,
        "decidedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);

    await q.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" varchar NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}',
        "read" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX "idx_notifications_user" ON "notifications" ("userId")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS "notifications"`);
    await q.query(`DROP TABLE IF EXISTS "pre_auths"`);
    await q.query(`DROP TABLE IF EXISTS "triage_summaries"`);
    await q.query(`DROP TABLE IF EXISTS "lab_files"`);
    await q.query(`DROP TABLE IF EXISTS "visit_records"`);
    await q.query(`DROP TABLE IF EXISTS "waitlist_entries"`);
    await q.query(`DROP TABLE IF EXISTS "appointments"`);
    await q.query(`DROP TABLE IF EXISTS "doctor_profiles"`);
    await q.query(`DROP TABLE IF EXISTS "rooms"`);
    await q.query(`DROP TABLE IF EXISTS "users"`);
  }
}
