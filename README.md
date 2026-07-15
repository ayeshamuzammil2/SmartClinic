# SmartClinic

### AI-Augmented Outpatient Management Platform

**Stack:** Node.js 20 LTS · React 18 · TypeScript · NestJS · PostgreSQL 15 · Docker · Socket.io
**Project type:** Academic capstone project

SmartClinic is a full-stack, production-style outpatient clinic management system built as a course capstone project. It models the real-world workflow of a multi-doctor clinic — patient intake, appointment scheduling, medical record-keeping, insurance pre-authorization, and staff notifications — and augments each of these workflows with optional AI-assisted tooling proxied securely through the backend.

The system is designed to demonstrate production-grade engineering practices: containerized infrastructure, role-based access control, transactional data integrity, real-time communication, and a clean separation between presentation, business logic, and data layers.

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Architecture](#2-architecture)
- [3. Technology Stack](#3-technology-stack)
- [4. Prerequisites](#4-prerequisites)
- [5. Quick Start (Docker — Recommended)](#5-quick-start-docker--recommended)
- [6. Demo Accounts](#6-demo-accounts)
- [7. Repository Layout](#7-repository-layout)
- [8. Core Modules](#8-core-modules)
- [9. AI-Augmented Features](#9-ai-augmented-features)
- [10. Data Model Overview](#10-data-model-overview)
- [11. API Surface](#11-api-surface)
- [12. Real-Time Events (Socket.io)](#12-real-time-events-socketio)
- [13. Authentication & Authorization](#13-authentication--authorization)
- [14. Environment Variables](#14-environment-variables)
- [15. Manual Backend Setup (Without Docker)](#15-manual-backend-setup-without-docker)
- [16. Testing Strategy](#16-testing-strategy)
- [17. Troubleshooting](#17-troubleshooting)
- [18. Academic Integrity Note](#18-academic-integrity-note)

---

## 1. System Overview

SmartClinic addresses the day-to-day operational needs of an outpatient clinic through four cooperating roles:

| Role | Primary Responsibilities |
|---|---|
| **Admin** | User management, clinic-wide analytics, system configuration |
| **Receptionist** | Appointment booking, patient check-in, insurance pre-auth submission, no-show monitoring |
| **Doctor** | Consultation notes (SOAP), lab review, diagnosis coding, schedule management |
| **Patient** | Self-service booking, AI-assisted intake, viewing personal records and appointment history |

The platform is split into three deployable units — a **PostgreSQL** database, a **NestJS** API server, and a **React** single-page application — orchestrated together via Docker Compose for zero-configuration local development.

---

## 2. Architecture

```
+------------------------+                         +------------------------+
|                        |   ---- HTTPS/REST --->  |                        |
|   React 18 + Vite      |                         |    NestJS Backend      |
|   TypeScript SPA       |                         |    (REST + WS + AI)    |
|   (localhost:5173)     |  <--- WebSocket -------  |    (localhost:3000)    |
|                        |       (Socket.io)        |                        |
+------------------------+                         +------------------------+
                                                                 |
                                                                 |  SQL
                                                                 |  (TypeORM/Prisma)
                                                                 v
                                                     +------------------------+
                                                     |     PostgreSQL 15      |
                                                     |    (localhost:5432)    |
                                                     +------------------------+


  NestJS Backend  ---- AI proxy call (server-side) ---->  +----------------------------+
                                                           |   Anthropic Claude /        |
                                                           |   OpenAI-compatible API     |
                                                           +----------------------------+
```

**Design principles:**

- **No secrets on the client.** The frontend never talks to the AI provider, database, or holds any credential — every privileged call is proxied through the authenticated NestJS backend.
- **Transactional correctness.** Appointment booking uses a database transaction combined with a unique constraint on `(doctor_id, slot_start)` to guarantee no double-booking occurs, even under concurrent requests.
- **Graceful degradation.** AI features are additive, not load-bearing — every AI-powered screen has a deterministic fallback so the core clinic workflow (booking, records, notifications) functions with zero external dependencies.
- **Role-based access control (RBAC)** is enforced at the guard/middleware level in the backend, not just hidden in the UI, so the API itself is the source of truth for permissions.

---

## 3. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | SPA, component-driven UI |
| Backend | NestJS (Node.js/TypeScript) | Modular, dependency-injected REST + WebSocket server |
| Database | PostgreSQL 15 | Relational integrity, transactional booking logic |
| Real-time | Socket.io | Per-user and per-role notification rooms |
| Auth | JWT (access + refresh), bcrypt | Stateless auth with rotating refresh tokens |
| AI Layer | Anthropic Claude / OpenAI-compatible proxy | Server-side only, optional |
| Infrastructure | Docker, Docker Compose | One-command local orchestration |
| Testing | Jest, Supertest | Unit + controller-level integration tests |

---

## 4. Prerequisites

Install the following before running the project. Both are free.

| Software | Version | Download Link |
|---|---|---|
| Node.js | 20.x (LTS) | https://nodejs.org |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |

> **Windows users:** Docker Desktop requires **WSL 2**. If you see a "WSL needs updating" error when Docker first opens, run the following in PowerShell **as Administrator**:
> ```powershell
> wsl --update
> ```
> Then restart your computer and reopen Docker Desktop.

Verify both installations:

```bash
node -v
docker -v
```

Both commands should print a version number. **Docker Desktop must be open and running** (Engine running, shown bottom-left of the app) before proceeding.

---

## 5. Quick Start (Docker — Recommended)

Everything except the frontend dev server runs inside Docker containers — there is nothing to configure manually.

### Step 1 — Extract the project

Extract the ZIP file anywhere, e.g. `C:\SmartClinic`.

### Step 2 — Open the project in a terminal

Open the folder in **VS Code**, then open an integrated terminal (`Terminal → New Terminal`, or `` Ctrl + ` ``).

Confirm you're in the right directory:

```bash
dir        # Windows
ls         # macOS/Linux
```

You should see `backend`, `frontend`, `docs`, `docker-compose.yml`, and `README.md`.

### Step 3 — Start the database and backend

```bash
docker compose up -d
```

The first run downloads the PostgreSQL image and builds the backend — this can take a few minutes. On success:

```
✔ Container smartclinic-db    Healthy
✔ Container smartclinic-api   Started
```

This automatically:
- Starts PostgreSQL 15 on port `5432`
- Builds and starts the NestJS backend at **http://localhost:3000** (Swagger docs at `/api`)
- Runs database migrations on startup

### Step 4 — Seed the database

Tables exist after Step 3 but are **empty**. Populate them with demo data:

```bash
docker exec -it smartclinic-api node dist/database/seed.js
```

Expected output:

```
Seed complete.
Users: 1 admin, 1 receptionist, 12 doctors, 8 patients (password: Password1!)
```

> Run this **once**. Re-running is safe but unnecessary if data already exists.

### Step 5 — Start the frontend

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Wait for:

```
Local:   http://localhost:5173/
```

### Step 6 — Open the app

Visit **http://localhost:5173** and log in with a demo account below.

---

## 6. Demo Accounts

Created automatically by the seed script (password `Password1!` for all):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartclinic.test` | `Password1!` |
| Receptionist | `reception@smartclinic.test` | `Password1!` |
| Doctor | `dr.khan@smartclinic.test` | `Password1!` |
| Patient | `patient@smartclinic.test` | `Password1!` |

The seed script additionally generates 12 doctors and 8 patients total, with randomized realistic sample data (appointments, notes, insurance records).

---

## 7. Repository Layout

```
smartclinic/
├── backend/            NestJS API (REST + WebSocket + AI proxy)
│   ├── src/
│   │   ├── auth/            JWT auth, guards, role decorators
│   │   ├── appointments/    Booking, slots, waitlist
│   │   ├── medical-records/ SOAP notes, lab file uploads
│   │   ├── notifications/   Socket.io gateway
│   │   ├── insurance/       Pre-auth workflow
│   │   ├── analytics/       Reporting endpoints
│   │   ├── ai/               AI proxy service
│   │   └── database/        Entities, migrations, seed script
│   └── .env.example
├── frontend/           React 18 + Vite + TypeScript SPA
│   └── src/
│       ├── pages/           Role-specific views
│       ├── components/      Shared UI components
│       └── api/              REST/WS client layer
├── docs/               API contract, ER diagram, AI integration notes
├── docker-compose.yml  Orchestrates PostgreSQL + backend containers
└── README.md
```

---

## 8. Core Modules

### 8.1 Authentication
JWT access + refresh token pair, bcrypt-hashed passwords, and role guards restricting endpoints to `patient`, `doctor`, `receptionist`, or `admin`.

### 8.2 Appointments
Slot search against doctor availability, conflict-safe booking enforced via a database transaction plus a unique constraint, a waitlist for fully booked slots, and drag-to-reschedule in the calendar UI.

### 8.3 Medical Records
Structured SOAP (Subjective, Objective, Assessment, Plan) notes per visit, with lab file upload support (PDF or image, ≤ 5 MB per file).

### 8.4 Notifications
A Socket.io gateway broadcasting to per-user and per-role rooms — used for appointment reminders, booking confirmations, and pre-auth status changes.

### 8.5 Insurance Pre-Authorization
A `Pending → Submitted → Approved / Rejected` state machine. A specialist's consultation note cannot be finalized while pre-auth is unresolved, mirroring real clinical billing constraints.

### 8.6 Analytics
Clinic occupancy, no-show trend analysis, average consultation duration, and insurance approval statistics — surfaced to the admin dashboard.

---

## 9. AI-Augmented Features

All AI calls are proxied through the backend — **no API keys are ever exposed to the frontend.** Every feature below degrades gracefully to a static/rule-based fallback when no `AI_API_KEY` is configured.

| Feature | Input | Output |
|---|---|---|
| **Patient Intake Chatbot** | Free-form conversational triage | Structured JSON summary for the doctor; falls back to a static intake form |
| **Smart Appointment Recommender** | Free-text symptom description | Suggested specialty, 2 recommended doctors, confidence score, rationale |
| **Clinical Note Assistant** | Raw consultation notes | Structured SOAP fields + up to 3 suggested ICD-10 codes |
| **No-Show Risk Predictor** | Historical appointment data | Rule-based risk score; flags appointments with risk > 0.65 in the receptionist calendar |

> AI features are strictly **optional**. The application is fully functional without `AI_API_KEY` — AI-powered screens simply present their deterministic fallback behavior instead of live model output.

---

## 10. Data Model Overview

Core entities and their relationships (see `docs/` for the full ER diagram):

- **User** (1) ── has one role ── (`admin` | `receptionist` | `doctor` | `patient`)
- **DoctorProfile** (1—1) ── User, holds specialty and available slots
- **PatientProfile** (1—1) ── User, holds demographic and insurance info
- **Appointment** (N—1) ── Doctor, (N—1) ── Patient; unique on `(doctor_id, slot_start)`
- **MedicalRecord** (1—1) ── Appointment; holds SOAP note + attached lab files
- **InsurancePreAuth** (1—1) ── Appointment; tracks approval state
- **Notification** (N—1) ── User; delivered via Socket.io and persisted for history

---

## 11. API Surface

The backend exposes a versioned REST API, self-documented via Swagger at:

```
http://localhost:3000/api
```

Representative endpoint groups:

```
POST   /auth/login              /auth/refresh            /auth/logout
GET    /appointments            POST /appointments        PATCH /appointments/:id
GET    /medical-records/:id     POST /medical-records
GET    /insurance/:appointmentId  PATCH /insurance/:id
GET    /analytics/occupancy     GET /analytics/no-show-trend
POST   /ai/intake-chat          POST /ai/recommend-doctor  POST /ai/soap-assist
```

Full request/response contracts are documented in `docs/api-contract.md` and are live-explorable via Swagger.

---

## 12. Real-Time Events (Socket.io)

Clients connect to the WebSocket gateway using their JWT and are automatically joined to:

- A **per-user room** (`user:<id>`) — personal reminders, booking confirmations
- A **per-role room** (`role:doctor`, `role:receptionist`, etc.) — broadcast alerts, e.g. new appointment on a shared calendar

Example events: `appointment.created`, `appointment.rescheduled`, `preauth.statusChanged`, `reminder.upcoming`.

---

## 13. Authentication & Authorization

- Passwords are hashed with **bcrypt** before storage — plaintext passwords never touch the database.
- **JWT access tokens** are short-lived; **refresh tokens** are longer-lived and rotated on use.
- Every protected route is guarded server-side by a `RolesGuard`, so authorization cannot be bypassed by manipulating the frontend alone.
- File uploads (lab results) are validated for type and size (≤ 5 MB, PDF/image only) before being persisted.

---

## 14. Environment Variables

All configuration lives in environment variables — nothing is hardcoded.

**Docker (default, recommended):** core variables are already set in `docker-compose.yml`. To enable AI features, create a `.env` file in the project root (same folder as `docker-compose.yml`):

```
AI_API_KEY=your-key-here
```

Then rebuild:

```bash
docker compose up -d --build
```

**Manual backend setup:** see `backend/.env.example` for the full variable list (database credentials, JWT secrets, AI provider settings, CORS origin, etc.). Copy it to `backend/.env` and fill in values.

---

## 15. Manual Backend Setup (Without Docker)

Only needed for active backend development outside of Docker. Most users should use [Quick Start](#5-quick-start-docker--recommended) instead.

```bash
# Start only the database in Docker
docker compose up -d db

# Backend
cd backend
cp .env.example .env        # fill in DB credentials + AI_API_KEY
npm install
npm run migration:run
npm run seed                 # uses TypeScript source: src/database/seed.ts
npm run start:dev            # http://localhost:3000  (Swagger: /api)

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev                  # http://localhost:5173
```

> **Important:** the seed command differs by environment. Inside the prebuilt Docker container, use the compiled JS version (`node dist/database/seed.js`). When running the backend locally via `npm run start:dev`, use `npm run seed`, which executes the TypeScript source directly.

---

## 16. Testing Strategy

```bash
cd backend
npm test          # unit + controller integration tests (Jest + Supertest)
npm run test:cov  # coverage report
```

Testing covers:
- **Unit tests** — service-layer business logic (e.g. slot-conflict detection, risk scoring)
- **Integration tests** — controller endpoints against an in-memory/test database, verifying auth guards and response contracts

---

## 17. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `docker: command not found` or Docker commands fail | Docker Desktop isn't running. Open it and wait for "Engine running" (bottom-left), then retry. |
| `WSL needs updating` (Windows) | Run `wsl --update` in PowerShell as Administrator, then restart your computer. |
| `role "postgres" does not exist` | The DB username is `smartclinic`, not `postgres`. Connect with `docker exec -it smartclinic-db psql -U smartclinic -d smartclinic` (password: `smartclinic`). |
| `npm run seed` fails with `Cannot find module './seed.ts'` inside Docker | The Docker image only contains compiled JS. Use `docker exec -it smartclinic-api node dist/database/seed.js` instead. |
| Port already in use (3000, 5173, or 5432) | Another process is using the port. Stop it, then retry `docker compose up -d`. |
| Login page loads but login fails | Database likely isn't seeded yet — run [Step 4](#step-4--seed-the-database) of Quick Start. |
| Need to inspect raw table data | Terminal: `docker exec -it smartclinic-db psql -U smartclinic -d smartclinic` then `\dt` or `SELECT * FROM users;`. Or use a free GUI tool like [DBeaver](https://dbeaver.io/download/) with Host `localhost`, Port `5432`, DB `smartclinic`, User `smartclinic`, Password `smartclinic`. |

---

## 18. Academic Integrity Note

The reflection report and system design document must be written by the team in their own words, per the course specification — AI tools may not generate those deliverables. The `docs/` folder contains technical reference material (API contract, ER diagram) to support their creation; it does not replace this requirement.
