# SmartClinic API Contract (v1)

Base URL: `http://localhost:3000`. All routes except `/auth/*` and `GET /doctors` require `Authorization: Bearer <accessToken>`.
Swagger (auto-generated, authoritative): `http://localhost:3000/api`.

Roles: `patient` | `doctor` | `receptionist` | `admin`.

Common error shape: `{ "statusCode": number, "message": string | string[], "error": string }`.

---

## Auth

### POST /auth/register  (public — patients only)
Req: `{ email, password, fullName, phone }`
Res 201: `{ accessToken, refreshToken, user: UserDto }`

### POST /auth/login  (public)
Req: `{ email, password }`
Res 200: `{ accessToken, refreshToken, user: UserDto }`

### POST /auth/refresh  (public)
Req: `{ refreshToken }`
Res 200: `{ accessToken, refreshToken }`

### GET /auth/me
Res: `UserDto`

`UserDto = { id: string, email: string, fullName: string, phone: string | null, role: 'patient'|'doctor'|'receptionist'|'admin', doctorProfile?: { specialty: string, bio: string | null } }`

---

## Doctors & Admin management

### GET /doctors  (public)
Query: `specialty?`
Res: `Array<{ id, fullName, specialty, bio }>`  (`id` is the doctor's **user id**)

### GET /specialties  (public)
Res: `string[]`  — `["General Practice","Cardiology","Dermatology","Orthopaedics"]`

### POST /admin/doctors  (admin)
Req: `{ email, password, fullName, phone, specialty, bio? }`
Res 201: `UserDto`

### GET /admin/rooms (admin) / POST /admin/rooms (admin)
Room: `{ id, name, branch }`; POST req `{ name, branch }`

### GET /admin/users (admin)
Query: `role?` → `UserDto[]`

---

## Appointments

`AppointmentDto = { id, patientId, doctorId, patient: {id, fullName, phone}, doctor: {id, fullName, specialty}, startTime: ISO, endTime: ISO, status: 'scheduled'|'checked_in'|'in_progress'|'completed'|'cancelled'|'no_show', reason: string | null, noShowRisk?: number }`

### GET /appointments/slots
Query: `doctorId` (required), `date` (YYYY-MM-DD, required)
Res: `Array<{ startTime: ISO, endTime: ISO, available: boolean }>` — 30-min slots 09:00–17:00.

### POST /appointments
Roles: patient (self), receptionist (any patient — pass `patientId`).
Req: `{ doctorId, startTime: ISO, reason?, patientId? }`
Res 201: `AppointmentDto`. Res 409 if slot taken (DB-level protection).

### GET /appointments
Role-scoped: patient → own; doctor → own; receptionist/admin → all.
Query: `date?` (YYYY-MM-DD), `status?`, `doctorId?`
Res: `AppointmentDto[]` (receptionist view includes `noShowRisk` 0..1)

### GET /appointments/:id → `AppointmentDto`

### PATCH /appointments/:id
Req (any subset): `{ startTime? (reschedule — receptionist/patient), status? }`
Allowed status transitions guarded by role: receptionist may set `checked_in`/`no_show`/`cancelled`; doctor may set `in_progress`/`completed`; patient may set `cancelled` (own only).
Cancellation within 2h of start auto-notifies the first waitlist patient (WebSocket + notification row).
Res: `AppointmentDto`

### POST /appointments/waitlist
Roles: patient, receptionist. Req: `{ doctorId, date: YYYY-MM-DD, patientId? }`
Res 201: `{ id, doctorId, date, position: number }`

---

## Medical Records

`VisitRecordDto = { id, appointmentId, patientId, doctorId, subjective, objective, assessment, plan, icdCodes: Array<{code, description}>, finalized: boolean, createdAt, updatedAt, files: Array<{id, filename, size, mimetype}> }`

### GET /records  — patient → own records; doctor → records of own patients. Query: `patientId?` (doctor)
### GET /records/:id
### POST /records  (doctor) — Req: `{ appointmentId, subjective?, objective?, assessment?, plan?, icdCodes? }`
### PATCH /records/:id  (doctor, owner)  — same fields + `{ finalize?: boolean }`.
  - 403 `PREAUTH_NOT_APPROVED` if finalizing a **specialist** (non-GP) visit whose pre-auth is not `approved`.
### POST /records/:id/files  (doctor) — multipart `file`, PDF/PNG/JPEG, ≤ 5 MB. Res: file dto.
### GET /records/:id/files/:fileId  — streams the file (patient owner or doctor).

---

## AI (all proxied; no LLM keys in the frontend)

### POST /ai/recommend  (patient)
Req: `{ description: string }`
Res: `{ specialty, rationale, confidence: 'low'|'medium'|'high', doctors: Array<{ id, fullName, specialty }> }`
Res 503 `{ fallback: true }` if AI unavailable → frontend lets patient pick specialty manually.

### POST /ai/intake/start  (patient — requires an appointment within 24h)
Res: `{ sessionId, message: string }`  (first assistant question)
Res 503 `{ fallback: true }` → frontend shows static intake form.

### POST /ai/intake/message  (patient)
Req: `{ sessionId, message }`
Res: `{ message: string, completed: boolean, summary?: TriageSummary }`
`TriageSummary = { chiefComplaint, symptomDurationDays, severity: 1-10, relevantHistory, currentMedications, redFlags: string[] }`

### POST /ai/intake/manual  (patient — static-form fallback)
Req: `TriageSummary` fields + `{ appointmentId }` → stores summary directly. Res 201.

### GET /ai/triage/:appointmentId  (doctor) → `{ summary: TriageSummary, createdAt } | 404`

### POST /ai/soap-format  (doctor)
Req: `{ rawNotes: string }`
Res: `{ subjective, objective, assessment, plan, icdSuggestions: Array<{ code, description }> }`  (max 3 suggestions)
Res 503 if AI down — doctor keeps editing manually.

### GET /ai/no-show-risk  (receptionist, admin)
Query: `date` (YYYY-MM-DD)
Res: `Array<{ appointmentId, score: number, factors: string[] }>`  — flag when `score > 0.65`.

### POST /notifications/reminder/:appointmentId  (receptionist)
Mock WhatsApp/SMS. Res: `{ sent: true, channel: 'sms', to: string }`

---

## Insurance Pre-Auth

`PreAuthDto = { id, appointmentId, appointment: AppointmentDto, provider: 'MedGulf'|'AXA'|'Bupa', status: 'pending'|'submitted'|'approved'|'rejected', diagnosisCode, notes, createdAt, submittedAt, decidedAt }`

### POST /preauth  (receptionist) — Req: `{ appointmentId, provider, diagnosisCode, notes? }` → status `pending`
### GET /preauth  (receptionist, admin, doctor) — Query: `status?` → `PreAuthDto[]`
### PATCH /preauth/:id/status  (receptionist) — Req: `{ status: 'submitted'|'approved'|'rejected' }` (must follow pending→submitted→approved/rejected)

---

## Notifications

### GET /notifications  — own, newest first: `Array<{ id, type, payload: object, read, createdAt }>`
### PATCH /notifications/:id/read

---

## Analytics (admin)

### GET /analytics/occupancy?period=daily|weekly → `Array<{ doctorId, doctorName, specialty, booked, capacity, rate }>`
### GET /analytics/no-show-trend  → last 30 days: `Array<{ date, total, noShows, rate }>`
### GET /analytics/consultation-duration → `Array<{ specialty, avgMinutes }>`
### GET /analytics/insurance → `Array<{ provider, total, approved, rejected, approvalRate, avgTurnaroundHours }>`

---

## WebSocket (Socket.io, path `/socket.io`, namespace `/`)

Handshake: `io('http://localhost:3000', { auth: { token: accessToken } })`.
Server joins the socket to rooms `user:<id>` and `role:<role>`.

Events (server → client), payload always `{ type, ...data }`:
- `appointment.updated`  — `{ appointment: AppointmentDto }` → to patient, doctor, role:receptionist
- `appointment.checkin`  — `{ appointment }` → role:receptionist, doctor
- `queue.position`       — `{ appointmentId, position }` → patient
- `notification`         — `{ notification }` → target user (confirmations, reminders, waitlist alerts)
