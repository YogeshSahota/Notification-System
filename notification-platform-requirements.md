# Notification Platform — Project Requirements

## Project Context

A production-grade **Notification Platform** backend built as a personal project for an SDE-2 resume.
Target audience: 3 years of experience, backend-focused, limited time (~3–4 weeks part-time).
Goal: Demonstrate distributed systems maturity, event-driven architecture, and reliability engineering — not UI or frontend work.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | NodeJS |
| Primary DB | PostgreSQL |
| Cache / Queue Store | Redis |
| Message Broker | Kafka |
| Email Channel | AWS SES or SendGrid |
| SMS Channel | AWS SNS or Twilio |
| Containerization | Docker + Docker Compose |

---

## Functional Requirements

### FR-1 — Multi-Channel Delivery (Must)

- Support **Email** and **SMS** as delivery channels.
- Email via AWS SES or SendGrid.
- SMS via AWS SNS or Twilio.
- Each notification targets exactly one channel per request.
- Channel is specified by the caller at trigger time.

---

### FR-2 — Notification Triggering (Must)

- Expose a REST API endpoint: `POST /notifications`
- Request payload must include:
  - `recipient_id` — the target user
  - `channel` — `email` or `sms`
  - `template_id` — ID of a pre-created template
  - `variables` — key-value map of dynamic values to inject into the template (e.g. `{ "name": "Rahul", "otp": "482910" }`)
  - `send_at` *(optional)* — ISO 8601 timestamp for scheduled delivery; if omitted, deliver immediately
- API must respond synchronously with a `notification_id` and `status: PENDING`.
- Actual delivery is **asynchronous** — handled by background workers via Kafka.

---

### FR-3 — Template Management (Must)

- CRUD REST APIs for notification templates:
  - `POST /templates` — create template
  - `GET /templates/:id` — fetch template
  - `PUT /templates/:id` — update template
  - `DELETE /templates/:id` — delete template
- Templates must support dynamic variable placeholders using `{{variable_name}}` syntax.
  - Example: `"Hello {{name}}, your OTP is {{otp}}. It expires in 10 minutes."`
- Templates are stored in PostgreSQL.
- Each template is associated with a specific channel (`email` or `sms`).
- Email templates must support both a `subject` and a `body` field.

---

### FR-4 — Scheduled Notifications (Must)

- If `send_at` is provided in the trigger request, the notification must not be delivered immediately.
- The system must enqueue the notification and hold delivery until the scheduled time.
- Scheduled notifications must also go through the same retry and DLQ flow as immediate ones.

---

### FR-5 — Retry with Exponential Backoff (Must)

- If a delivery attempt fails (provider error, timeout, etc.), the system must retry automatically.
- Retry policy:
  - Maximum **3 retry attempts**.
  - Delay between retries follows **exponential backoff**: 30s → 2m → 10m.
- After all retries are exhausted, move the notification to a **Dead Letter Queue (DLQ)**.
- DLQ entries must be persisted in PostgreSQL with failure reason and timestamp.
- No automatic reprocessing of DLQ — manual intervention or a separate admin API trigger.

---

### FR-6 — Delivery Status Tracking (Must)

- Every notification must have a trackable lifecycle:
  - `PENDING` → `PROCESSING` → `DELIVERED` or `FAILED`
- Expose a REST API: `GET /notifications/:id`
  - Returns current status, channel, recipient, timestamps, and retry count.
- Status must be updated in PostgreSQL at each stage transition.
- Failed notifications must store the failure reason.

---

### FR-7 — User Preferences (Must)

- Each user can opt in or out of specific channels.
- Expose REST APIs:
  - `PUT /users/:id/preferences` — update preferences
  - `GET /users/:id/preferences` — fetch preferences
- If a user has opted out of a channel (e.g. SMS), any notification triggered for that channel must be silently skipped — status set to `SKIPPED`, no error returned to the caller.
- Preferences stored in PostgreSQL.

---

### FR-8 — Priority Queues (Good to Have)

- Support two priority levels: `HIGH` and `NORMAL`.
  - `HIGH`: OTPs, security alerts, time-sensitive messages.
  - `NORMAL`: Marketing, reminders, informational updates.
- Use separate Kafka topics per priority: `notifications.high` and `notifications.normal`.
- Workers should drain `HIGH` priority queue before processing `NORMAL`.
- Priority is specified by the caller in the trigger request payload.

---

### FR-9 — Rate Limiting (Good to Have)

- Enforce a per-user rate limit to prevent notification spam.
- Default limit: **max 10 notifications per user per hour** (configurable via env).
- Implement using a **Redis sliding window counter**.
- If a user exceeds the limit, the API must reject the request with `429 Too Many Requests`.

---

### FR-10 — Basic Analytics (Good to Have)

- Expose a REST API: `GET /analytics/summary`
- Returns aggregated counts per channel per day:
  - Total sent
  - Total failed
  - Total retried
  - Total skipped (opted-out)
- Implemented as a simple aggregation query on the PostgreSQL notifications table — no separate analytics store needed.

---

## Non-Functional Constraints

- **No frontend** — REST APIs only. Use Postman or Swagger for testing.
- **No Prometheus/Grafana** — out of scope for this project.
- **No Push/Slack/Webhook channels** — not worth the setup overhead.
- All services must run locally via **Docker Compose** (Kafka, Zookeeper, PostgreSQL, Redis).
- Environment-based config for all credentials (AWS, Twilio, etc.) — no hardcoded secrets.
- Code must be in **TypeScript** with proper type definitions.

---

## Data Models (High Level)

### Notification
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| recipient_id | UUID | FK to users |
| channel | ENUM | `email`, `sms` |
| template_id | UUID | FK to templates |
| variables | JSONB | Dynamic values |
| status | ENUM | `PENDING`, `PROCESSING`, `DELIVERED`, `FAILED`, `SKIPPED` |
| priority | ENUM | `HIGH`, `NORMAL` |
| send_at | TIMESTAMP | Null = immediate |
| retry_count | INT | Default 0 |
| failure_reason | TEXT | Null unless failed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Template
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | Human-readable identifier |
| channel | ENUM | `email`, `sms` |
| subject | TEXT | Email only |
| body | TEXT | Supports `{{variable}}` placeholders |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### UserPreference
| Field | Type | Notes |
|---|---|---|
| user_id | UUID | FK to users |
| channel | ENUM | `email`, `sms` |
| opted_in | BOOLEAN | Default true |
| updated_at | TIMESTAMP | |

### DeadLetterQueue
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| notification_id | UUID | FK to notifications |
| failure_reason | TEXT | |
| failed_at | TIMESTAMP | |

---

## API Summary

| Method | Endpoint | Description |
|---|---|---|
| POST | `/notifications` | Trigger a notification |
| GET | `/notifications/:id` | Get notification status |
| POST | `/templates` | Create a template |
| GET | `/templates/:id` | Fetch a template |
| PUT | `/templates/:id` | Update a template |
| DELETE | `/templates/:id` | Delete a template |
| GET | `/users/:id/preferences` | Get user channel preferences |
| PUT | `/users/:id/preferences` | Update user channel preferences |
| GET | `/analytics/summary` | Get delivery analytics summary |

---

## System Flow (For Context)

```
Caller → POST /notifications
           │
           ▼
  Check user preferences
  (skip if opted out)
           │
           ▼
  Check rate limit (Redis)
  (reject if exceeded)
           │
           ▼
  Save notification to DB (PENDING)
           │
           ▼
  Publish to Kafka topic
  (notifications.high or notifications.normal)
           │
           ▼
  Kafka Consumer (Worker)
  - Render template with variables
  - Call provider (SES / SNS / Twilio)
  - On success → update status DELIVERED
  - On failure → retry with backoff
  - After max retries → move to DLQ, status FAILED
```

---

## Instructions for the Assisting Model

- This is a **backend-only** project. Do not suggest or generate any frontend code.
- Use **NodeJS** as the framework (modules, services, controllers, guards pattern).
- Use **TypeORM** or **Prisma** for PostgreSQL ORM — pick one and stay consistent.
- Use **KafkaJS** for Kafka integration.
- Use **ioredis** for Redis.
- All business logic must live in **service classes**, not controllers.
- Follow **repository pattern** — no raw DB queries in service or controller layers.
- Use **environment variables** for all config — provide a `.env.example` file.
- Provide **Docker Compose** configuration that spins up: PostgreSQL, Redis, Kafka, Zookeeper, and the app.
- When generating code, include **inline comments** explaining non-obvious decisions.
- Prioritize **FR-1 through FR-7** (Must requirements) before touching FR-8 to FR-10.
- For each module generated, also provide the corresponding **database migration** (if using TypeORM) or **Prisma schema** update.
```
