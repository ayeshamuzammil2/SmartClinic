# SmartClinic — AI Integration Technical Notes

> Reference material for writing the AI Integration Report (Deliverable 4).
> The full prompt templates live in `backend/src/ai/prompts.ts` — they are the
> single source of truth used at runtime. The report itself (rationale,
> iterations, ethics paragraph) must be written by the team.

## Architecture

```
React (no keys, no direct LLM calls)
   │  REST
   ▼
NestJS AI proxy module (backend/src/ai/)
   ├── ai.controller.ts    role-guarded endpoints
   ├── ai.service.ts       feature logic + intake session store
   ├── llm.client.ts       provider-agnostic client (Anthropic / OpenAI via env)
   ├── prompts.ts          all system prompts
   └── no-show.service.ts  rule-based risk scoring (no LLM)
   │  HTTPS (AI_API_KEY from .env, never sent to the frontend)
   ▼
LLM API (AI_PROVIDER=anthropic|openai, AI_MODEL from .env)
```

The mandatory constraint "AI proxy between frontend and LLM" is met by role
guards on `/ai/*` plus the key living only in backend env.

## Feature 1 — Patient Intake Chatbot

- **Endpoints**: `POST /ai/intake/start`, `POST /ai/intake/message`, fallback `POST /ai/intake/manual`, doctor view `GET /ai/triage/:appointmentId`.
- **Eligibility**: server verifies a `scheduled` appointment within 24h before starting a session.
- **Context management**: the full message history is kept server-side in an in-memory `Map` keyed by `sessionId` (1-hour TTL) and replayed to the LLM on every turn. The frontend only ever sends the latest user message — it cannot tamper with history. (Tradeoff to document: sessions do not survive a server restart; a Redis store would fix this.)
- **Structured output**: the system prompt instructs the model to emit the final summary between `<SUMMARY>{json}</SUMMARY>` markers only when all five fields are collected. The backend regex-extracts and JSON-parses it; on success the summary is persisted to `triage_summaries` and the session is deleted.
- **Safety rails in the prompt**: one question per turn, no diagnosis/advice, red-flag escalation wording, no invented data.
- **Graceful degradation** (the mandatory one): if `AI_API_KEY` is unset or the provider errors, the API returns `503 { fallback: true }` and the React widget swaps to a static intake form that posts the same fields to `/ai/intake/manual` (stored with `source: 'manual'`).

## Feature 2 — Smart Appointment Recommender

- **Endpoint**: `POST /ai/recommend` (patient only).
- **Input**: free-text description + up to 3 recent visit assessments from the DB (past history requirement).
- **Output contract**: model must reply with a single JSON object `{specialty, rationale, confidence}`; `extractJson()` tolerates code fences/prose. The specialty is validated against the catalogue — anything unexpected falls back to General Practice. The backend then attaches the top-2 doctors of that specialty from the DB, so doctor suggestions are always real bookable doctors, never hallucinated.
- **Transparency**: `rationale` is displayed to the patient verbatim; patient can always override manually.
- **Degradation**: 503 → the booking wizard skips straight to manual specialty selection.

## Feature 3 — Clinical Note Assistant (SOAP formatter)

- **Endpoint**: `POST /ai/soap-format` (doctor only).
- **Prompt principles**: use only information present in the notes; empty string for absent sections (anti-hallucination); max 3 ICD-10 suggestions ordered by likelihood; the model is framed as a "formatting aid, not a decision maker".
- **Human-in-the-loop**: the response only pre-fills the four editable SOAP fields; the doctor reviews, edits, accepts/dismisses each ICD chip, and saving works entirely without the AI (manual path is independent).
- **Degradation**: 503 → non-blocking toast; manual editing continues.

## Feature 4 — No-Show Risk Predictor (bonus, no LLM)

- **Endpoint**: `GET /ai/no-show-risk?date=` (receptionist/admin).
- Rule-based scoring in `no-show.service.ts`: base 0.10, + up to 0.44 for past no-show rate, +0.08 for new patients, +0.07–0.15 for long booking lead time, +0.07 for edge-of-day slots, +0.05 for Mon/Fri, +0.05 for elective specialty; clamped at 0.95. Each contribution appends a human-readable factor string shown in the calendar tooltip.
- Appointments with `score > 0.65` get the warning badge; the receptionist can fire the mock SMS reminder (`POST /notifications/reminder/:id`).

## Suggested talking points for the report (write in your own words)

1. Why marker-based extraction (`<SUMMARY>…`) is more robust than asking for
   pure JSON for a *conversational* feature, while the two single-shot features
   (recommend, SOAP) use JSON-only replies.
2. Prompt iteration evidence you can reproduce: e.g. without "one question per
   turn" the intake bot asks all five at once; without "use ONLY information
   present" the SOAP formatter invents vitals.
3. Privacy: patient identifiers are *not* sent to the LLM (only the description /
   notes text); still, symptom text is PHI — discuss provider data-retention
   policies, the .env key handling, and why the proxy layer is the enforcement
   point.
