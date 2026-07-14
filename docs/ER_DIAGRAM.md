# SmartClinic — Entity-Relationship Diagram

> Reference material generated from the implemented schema
> (`backend/src/entities/`, migration `1720000000000-Init.ts`). Use it to draw /
> verify your own diagram for the System Design Document — per the course spec,
> that document must present your own reasoning.

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar passwordHash
        varchar fullName
        varchar phone
        varchar role "patient|doctor|receptionist|admin"
        varchar refreshTokenHash
        timestamptz createdAt
    }
    DOCTOR_PROFILES {
        uuid id PK
        uuid userId FK,UK
        varchar specialty
        text bio
        uuid roomId FK
    }
    ROOMS {
        uuid id PK
        varchar name
        varchar branch
    }
    APPOINTMENTS {
        uuid id PK
        uuid patientId FK
        uuid doctorId FK
        timestamptz startTime "unique with doctorId while active"
        timestamptz endTime
        varchar status "scheduled|checked_in|in_progress|completed|cancelled|no_show"
        text reason
        uuid createdById
        timestamptz checkedInAt
        timestamptz completedAt
        boolean reminded24h
        boolean reminded1h
        timestamptz createdAt
    }
    WAITLIST_ENTRIES {
        uuid id PK
        uuid doctorId
        uuid patientId FK
        date date
        boolean notified
        timestamptz createdAt
    }
    VISIT_RECORDS {
        uuid id PK
        uuid appointmentId FK,UK
        uuid patientId FK
        uuid doctorId FK
        text subjective
        text objective
        text assessment
        text plan
        jsonb icdCodes
        boolean finalized
        timestamptz createdAt
        timestamptz updatedAt
    }
    LAB_FILES {
        uuid id PK
        uuid recordId FK
        varchar filename
        varchar storedPath
        varchar mimetype
        int size
        timestamptz createdAt
    }
    TRIAGE_SUMMARIES {
        uuid id PK
        uuid appointmentId FK,UK
        uuid patientId
        jsonb summary
        varchar source "ai|manual"
        timestamptz createdAt
    }
    PRE_AUTHS {
        uuid id PK
        uuid appointmentId FK
        varchar provider "MedGulf|AXA|Bupa"
        varchar status "pending|submitted|approved|rejected"
        varchar diagnosisCode
        text notes
        timestamptz submittedAt
        timestamptz decidedAt
        timestamptz createdAt
    }
    NOTIFICATIONS {
        uuid id PK
        uuid userId
        varchar type
        jsonb payload
        boolean read
        timestamptz createdAt
    }

    USERS ||--o| DOCTOR_PROFILES : "has (doctors only)"
    ROOMS ||--o{ DOCTOR_PROFILES : "assigned to"
    USERS ||--o{ APPOINTMENTS : "books (as patient)"
    USERS ||--o{ APPOINTMENTS : "hosts (as doctor)"
    USERS ||--o{ WAITLIST_ENTRIES : "waits (as patient)"
    APPOINTMENTS ||--o| VISIT_RECORDS : "generates"
    APPOINTMENTS ||--o| TRIAGE_SUMMARIES : "has intake"
    APPOINTMENTS ||--o{ PRE_AUTHS : "requires (specialist)"
    VISIT_RECORDS ||--o{ LAB_FILES : "attaches"
    USERS ||--o{ NOTIFICATIONS : "receives"
```

## Integrity notes

- **Double-booking protection** is at the database level: partial unique index
  `uq_appointments_doctor_slot_active` on `(doctorId, startTime)` where status is
  not `cancelled`/`no_show`, plus a pessimistic-lock transaction in
  `AppointmentsService.create`. A losing concurrent insert receives Postgres
  error 23505 which the API maps to HTTP 409.
- **One visit record / one triage summary per appointment** via unique FKs.
- **Cascade rules**: deleting a user cascades to their appointments and records;
  deleting a room only nulls `doctor_profiles.roomId`.
- **Pre-auth gate**: `VisitRecord.finalized` can only become true for a
  specialist (non-GP) appointment when an `approved` pre_auth row exists —
  enforced in `RecordsService.update`.
