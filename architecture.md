# Notification Platform — Architecture Document

## 1. System Overview

A production-grade **Notification Platform** with a lightweight React frontend for triggering and monitoring notifications, and a backend that delivers Email and SMS via an event-driven pipeline. The system supports template-based messaging, scheduled delivery, retry with exponential backoff, priority queues, rate limiting, and dead letter queue handling.

**Goal:** Demonstrate distributed systems maturity, event-driven architecture, and reliability engineering for an SDE-2 resume.

**Scope:** Backend + lightweight React dashboard. No Push/Slack/Webhook channels, no Prometheus/Grafana.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | Node.js + TypeScript | Type safety, industry standard for backend JS |
| Framework | Express | Lightweight, widely known, sufficient for REST APIs |
| ORM | Prisma | Schema-first DX, faster iteration than TypeORM, new learning |
| Primary DB | PostgreSQL | JSONB support for variables, reliable, free |
| Cache | Redis (ioredis) | Rate limiting, BullMQ backend, in-memory speed |
| Message Broker | Apache Kafka (kafkajs) | Resume signal, partition-based parallelism, message replay |
| Delayed Scheduling | BullMQ (Redis-backed) | Kafka lacks native delayed messages; BullMQ provides this cleanly |
| Email Provider | Brevo (Sendinblue) | Free tier (300/day), no credit card, works in India |
| SMS Provider | Console Provider (pluggable) | No free SMS API without credit card in India; architected for easy swap |
| Frontend | React + Vite + TypeScript | Lightweight dashboard to trigger and monitor notifications |
| Frontend Styling | Tailwind CSS | Rapid UI development, no heavy component library |
| Containerization | Docker + Docker Compose | Single-command local infra spin-up |

---

## 3. Architecture Diagram

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │                     React Frontend (Vite)                          │
 │                                                                     │
 │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
 │  │  Trigger     │  │  Templates   │  │  Analytics   │              │
 │  │  Notification│  │  Manager     │  │  Dashboard   │              │
 │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘              │
 └─────────┼────────────────┼─────────────────┼───────────────────────┘
           │                │                 │
           └────────────────┼─────────────────┘
                            │ HTTP (REST)
                            ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │                      Express API Server                            │
 │                                                                     │
 │  POST /notifications                                               │
 │  GET  /notifications/:id                                           │
 │  POST /templates, GET/PUT/DELETE                                   │
 │  GET/PUT /users/:id/preferences                                    │
 │  GET  /analytics/summary                                           │
 └──────────┬──────────────────────────────────────┬──────────────────┘
            │                                      │
 ┌──────────▼──────┐                        ┌──────▼──────────┐
 │  Check User     │                        │  Check Rate     │
 │  Preferences    │                        │  Limit (Redis)  │
 │  (PostgreSQL)   │                        │  Sliding Window │
 └──────────┬──────┘                        └──────┬──────────┘
            │                                      │
            └──────────────┬───────────────────────┘
                           │
           ┌───────────────▼───────────────┐
           │   Save to DB (status: PENDING) │
           └───────────────┬───────────────┘
                           │
           ┌───────────────▼────────────────┐
           │      send_at provided?         │
           └───────┬───────────────┬────────┘
                   │               │
                  YES             NO
                   │               │
     ┌─────────────▼──────┐        │
     │   BullMQ Delayed   │        │
     │   Job (wait until  │        │
     │     send_at)       │        │
     └─────────────┬──────┘        │
                   │               │
        (when due) │               │
                   ▼               │
           Publish to Kafka        │
                   │               │
                   └───────┬───────┘
                           │
           ┌───────────────▼─────────────────────┐
           │           Kafka Topics               │
           │  ┌─────────────────┐ ┌────────────┐  │
           │  │notifications    │ │notifications│  │
           │  │  .high          │ │  .normal   │  │
           │  └────────┬────────┘ └─────┬──────┘  │
           └───────────┼────────────────┼─────────┘
                       │                │
                       ▼                │
           ┌─────────────────────┐       │
           │ HIGH Priority Worker│       │
           │ (drains first)      │       │
           └──────────┬──────────┘       │
                      │                  │
                      ▼                  ▼
           ┌─────────────────────────────────────┐
           │       NORMAL Priority Worker        │
           └──────────────────┬──────────────────┘
                              │
           ┌──────────────────▼──────────────────┐
           │         Render Template             │
           │    (inject {{variables}})           │
           └──────────────────┬──────────────────┘
                              │
           ┌──────────────────▼──────────────────┐
           │       Route to Channel Provider     │
           │  ┌─────────────┐  ┌──────────────┐ │
           │  │  Email       │  │  SMS         │ │
           │  │  (Brevo)     │  │  (Console)   │ │
           │  └──────┬──────┘  └──────┬───────┘ │
           └─────────┼─────────────────┼────────┘
                     │                 │
              ┌──────▼─────┐   ┌──────▼──────┐
              │  Success   │   │  Failure    │
              │  DELIVERED │   │  Retry/DLQ  │
              └────────────┘   └──────┬──────┘
                                      │
                           ┌──────────▼──────────┐
                           │ retry_count < 3?    │
                           └────┬──────────┬─────┘
                                │          │
                               YES        NO
                                │          │
                     ┌──────────▼──┐  ┌────▼─────────┐
                     │ Re-publish  │  │ DLQ Table    │
                     │ to Kafka    │  │ status:      │
                     │ (with delay)│  │ FAILED       │
                     └─────────────┘  └──────────────┘
```

---

## 4. React Frontend Design

### Purpose

A lightweight dashboard to:
- Trigger notifications (form-based)
- View notification status
- Manage templates
- View analytics summary

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Build Tool | Vite | Fast HMR, zero-config TypeScript |
| UI Framework | React 18 | Lightweight, component-based |
| Styling | Tailwind CSS | Rapid styling, no heavy component library |
| HTTP Client | Axios or fetch | API calls to Express backend |
| State | React useState/useEffect | No Redux needed — lightweight app |

### Pages / Views

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview with recent notifications + quick stats |
| Trigger | `/trigger` | Form to trigger a notification (recipient, channel, template, variables, priority, send_at) |
| Notifications | `/notifications` | List of notifications with status, filterable by channel/status |
| Notification Detail | `/notifications/:id` | Full notification lifecycle details |
| Templates | `/templates` | CRUD management of templates |
| Analytics | `/analytics` | Delivery stats per channel per day |

### Key UI Components

```
src/
├── pages/
│   ├── Dashboard.tsx
│   ├── TriggerNotification.tsx
│   ├── NotificationList.tsx
│   ├── NotificationDetail.tsx
│   ├── TemplateManager.tsx
│   └── Analytics.tsx
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   ├── NotificationForm.tsx
│   ├── TemplateForm.tsx
│   ├── StatusBadge.tsx
│   └── AnalyticsTable.tsx
├── api/
│   └── client.ts           # Axios/fetch wrapper for backend calls
├── types/
│   └── index.ts            # Shared TypeScript types
├── App.tsx
└── main.tsx
```

### Design Principles

- **Minimal and functional** — not a polished product, a developer dashboard
- **No auth** — local dev only, no login system
- **Responsive** — works on desktop, doesn't need mobile optimization
- **No heavy component library** — Tailwind only, no MUI/Chakra/Ant Design

---

## 5. Kafka Pipeline Design

### Topics

| Topic | Purpose | Partitions |
|-------|---------|------------|
| `notifications.high` | HIGH priority notifications (OTP, security alerts) | 3 |
| `notifications.normal` | NORMAL priority notifications (marketing, reminders) | 3 |

### Producer Configuration

- **Acks:** `all` — ensure message is committed to all in-sync replicas
- **Idempotent:** `true` — prevent duplicate messages on retry
- **Key:** `recipient_id` — ensures ordering per user (same user goes to same partition)
- **Compression:** `gzip` — reduce network payload

### Consumer Configuration

- **Consumer Group:** `notification-workers-high` / `notification-workers-normal`
- **Auto Offset Commit:** `false` — manual commit only after successful processing
- **Session Timeout:** 30s
- **Heartbeat Interval:** 10s
- **Max Poll Interval:** 5 minutes (accommodate slow provider calls)

### Priority Consumption Strategy

Two separate consumer instances subscribed to separate topics. HIGH-priority consumer gets higher concurrency:

```typescript
const highConsumer = kafka.consumer({ groupId: 'notification-workers-high' });
const normalConsumer = kafka.consumer({ groupId: 'notification-workers-normal' });

// HIGH consumer processes with higher concurrency
// NORMAL consumer processes with lower concurrency
```

### Message Format

```json
{
  "notificationId": "uuid",
  "retryCount": 0,
  "scheduledRetryAt": null
}
```

---

## 6. BullMQ Scheduling Design

BullMQ is used **only** for delayed/scheduled notifications. Kafka does not support native delayed messages, so BullMQ fills this gap.

### Queue

- **Queue Name:** `scheduled-notifications`
- **Backend:** Redis (same Redis instance used for rate limiting)

### Job Data

```json
{
  "notificationId": "uuid"
}
```

### Delay Calculation

```typescript
const delay = new Date(sendAt).getTime() - Date.now();
if (delay > 0) {
  await schedulerQueue.add('send-notification', { notificationId }, { delay });
}
```

### Processor Logic

When a delayed job fires:

1. Fetch notification from DB by `notificationId`
2. Verify status is still `PENDING` (not cancelled or already processed)
3. Publish to appropriate Kafka topic based on `notification.priority`
4. Remove job from BullMQ (auto-completed)

### Why BullMQ over Custom Redis ZSET

- BullMQ **internally uses Redis ZSET** for delayed jobs — same pattern, production-tested
- Built-in job lifecycle (completed, failed, stalled)
- No custom polling logic needed — BullMQ handles it
- Simple API: `.add()` with `{ delay }` and `.process()` for handling

---

## 7. Redis Usage

### Rate Limiting — Sliding Window Counter

```
Key format:    rate_limit:{recipient_id}
Window:        1 hour (3600 seconds)
Limit:         10 requests per window (configurable via RATE_LIMIT_PER_HOUR)

Algorithm:
1. MULTI
2. HINCRBY rate_limit:{user} {current_minute} 1
3. EXPIRE rate_limit:{user} 3600
4. EXEC
5. Sum all minute buckets within the window
6. If total > limit → reject with 429
```

### BullMQ Backend

BullMQ uses the same Redis instance for:
- Delayed job storage (ZSET)
- Active/waiting/completed job lists
- Job metadata

### Connection Config

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 8. Data Models

### Notification

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, default gen | |
| recipient_id | UUID | NOT NULL | Logical FK (no users table in scope) |
| channel | ENUM(email, sms) | NOT NULL | |
| template_id | UUID | FK → Template | |
| variables | JSONB | NOT NULL, default {} | Dynamic values for template |
| status | ENUM(PENDING, PROCESSING, DELIVERED, FAILED, SKIPPED) | NOT NULL, default PENDING | |
| priority | ENUM(HIGH, NORMAL) | NOT NULL, default NORMAL | |
| send_at | TIMESTAMP | NULLABLE | Null = immediate delivery |
| retry_count | INT | NOT NULL, default 0 | |
| failure_reason | TEXT | NULLABLE | Set only on FAILED |
| idempotency_key | VARCHAR | UNIQUE, NULLABLE | Prevents duplicate triggers |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, auto-updated | |

### Template

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, default gen | |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Human-readable identifier |
| channel | ENUM(email, sms) | NOT NULL | |
| subject | TEXT | NULLABLE | Required for email, null for sms |
| body | TEXT | NOT NULL | Supports `{{variable}}` placeholders |
| created_at | TIMESTAMP | NOT NULL, default now() | |
| updated_at | TIMESTAMP | NOT NULL, auto-updated | |

### UserPreference

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| user_id | UUID | NOT NULL | Composite PK with channel |
| channel | ENUM(email, sms) | NOT NULL | Composite PK with user_id |
| opted_in | BOOLEAN | NOT NULL, default true | |
| updated_at | TIMESTAMP | NOT NULL, auto-updated | |

### DeadLetterQueue

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK, default gen | |
| notification_id | UUID | FK → Notification | |
| failure_reason | TEXT | NOT NULL | Final failure reason after all retries |
| failed_at | TIMESTAMP | NOT NULL, default now() | |

### Indexes

```sql
CREATE INDEX idx_notification_recipient ON "Notification"(recipient_id);
CREATE INDEX idx_notification_status ON "Notification"(status);
CREATE INDEX idx_notification_send_at ON "Notification"(send_at) WHERE status = 'PENDING';
CREATE INDEX idx_dlq_notification ON "DeadLetterQueue"(notification_id);
CREATE INDEX idx_user_pref ON "UserPreference"(user_id, channel);
```

---

## 9. API Reference

### Trigger Notification

```
POST /notifications
Content-Type: application/json

Request:
{
  "recipient_id": "uuid",
  "channel": "email" | "sms",
  "template_id": "uuid",
  "variables": { "name": "Rahul", "otp": "482910" },
  "priority": "HIGH" | "NORMAL",       // default: NORMAL
  "send_at": "2026-08-11T15:00:00Z",   // optional
  "idempotency_key": "unique-string"    // optional
}

Response (201):
{
  "notification_id": "uuid",
  "status": "PENDING"
}

Response (429 - Rate Limited):
{
  "error": "Rate limit exceeded",
  "retry_after": 3600
}
```

### Get Notification Status

```
GET /notifications/:id

Response (200):
{
  "id": "uuid",
  "recipient_id": "uuid",
  "channel": "email",
  "template_id": "uuid",
  "status": "DELIVERED",
  "priority": "HIGH",
  "retry_count": 0,
  "failure_reason": null,
  "send_at": null,
  "created_at": "2026-08-11T10:00:00Z",
  "updated_at": "2026-08-11T10:00:02Z"
}
```

### List Notifications

```
GET /notifications?channel=email&status=DELIVERED&page=1&limit=20

Response (200):
{
  "data": [ ... ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### Template CRUD

```
POST /templates
{
  "name": "otp-email",
  "channel": "email",
  "subject": "Your OTP for {{service_name}}",
  "body": "Hello {{name}}, your OTP is {{otp}}. It expires in 10 minutes."
}

Response (201):
{
  "id": "uuid",
  "name": "otp-email",
  "channel": "email",
  "subject": "Your OTP for {{service_name}}",
  "body": "Hello {{name}}, your OTP is {{otp}}. It expires in 10 minutes.",
  "created_at": "...",
  "updated_at": "..."
}

GET /templates/:id       → 200
GET /templates           → 200  (list all)
PUT /templates/:id       → 200  (same body as POST)
DELETE /templates/:id    → 204
```

### User Preferences

```
GET /users/:id/preferences

Response (200):
{
  "user_id": "uuid",
  "preferences": [
    { "channel": "email", "opted_in": true },
    { "channel": "sms", "opted_in": false }
  ]
}

PUT /users/:id/preferences
{
  "preferences": [
    { "channel": "email", "opted_in": true },
    { "channel": "sms", "opted_in": false }
  ]
}

Response (200):
{
  "user_id": "uuid",
  "preferences": [
    { "channel": "email", "opted_in": true },
    { "channel": "sms", "opted_in": false }
  ]
}
```

### Analytics Summary

```
GET /analytics/summary?from=2026-08-01&to=2026-08-11

Response (200):
{
  "summary": [
    {
      "date": "2026-08-10",
      "channel": "email",
      "total_sent": 150,
      "total_failed": 3,
      "total_retried": 7,
      "total_skipped": 2
    },
    {
      "date": "2026-08-10",
      "channel": "sms",
      "total_sent": 80,
      "total_failed": 1,
      "total_retried": 2,
      "total_skipped": 5
    }
  ]
}
```

---

## 10. Channel Provider Interface

```typescript
interface IChannelProvider {
  channel: 'email' | 'sms';
  send(payload: ChannelPayload): Promise<ChannelResult>;
}

interface ChannelPayload {
  recipient: string;       // email address or phone number
  subject?: string;        // email only
  body: string;            // rendered template body
  metadata?: Record<string, any>;
}

interface ChannelResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}
```

### Implementations

| Provider | Channel | Class |
|----------|---------|-------|
| BrevoEmailProvider | email | Uses Brevo API (free, no credit card) |
| ConsoleSmsProvider | sms | Logs to console; pluggable for Twilio later |
| TwilioSmsProvider | sms | (Future) Uses Twilio API |

### Provider Resolution

```typescript
function getProvider(channel: 'email' | 'sms'): IChannelProvider {
  switch (channel) {
    case 'email': return new BrevoEmailProvider();
    case 'sms':   return new ConsoleSmsProvider();
  }
}
```

---

## 11. Retry & DLQ Flow

### Backoff Schedule

| Retry Attempt | Delay | Cumulative Time |
|---------------|-------|-----------------|
| 1st retry | 30 seconds | ~30s after first failure |
| 2nd retry | 2 minutes | ~2m 30s after first failure |
| 3rd retry | 10 minutes | ~12m 30s after first failure |
| After 3rd | Move to DLQ | — |

### Implementation Strategy

When a Kafka consumer fails to deliver a notification:

1. Increment `retry_count` in DB
2. If `retry_count < 3`:
   - Calculate next retry delay from backoff schedule
   - Add BullMQ delayed job with that delay
   - When BullMQ job fires → re-publish to Kafka
   - Update status to `PROCESSING`
3. If `retry_count >= 3`:
   - Update notification status to `FAILED`
   - Insert record into `DeadLetterQueue` table with `failure_reason`
   - Do NOT re-publish

### DLQ Recovery

No automatic reprocessing. Manual recovery via:

```
POST /dlq/:id/retry    // Re-triggers a DLQ notification (future scope)
```

For now, DLQ entries are queryable in PostgreSQL for manual investigation.

---

## 12. Priority Queue Design

### Two Kafka Topics

| Topic | Priority | Use Cases |
|-------|----------|-----------|
| `notifications.high` | HIGH | OTPs, security alerts, time-sensitive |
| `notifications.normal` | NORMAL | Marketing, reminders, informational |

### Consumer Priority Logic

```typescript
async function startWorkers() {
  const highConsumer = createConsumer('notification-workers-high', 'notifications.high', { concurrency: 5 });
  const normalConsumer = createConsumer('notification-workers-normal', 'notifications.normal', { concurrency: 2 });
  
  highConsumer.run({ eachMessage: processNotification });
  normalConsumer.run({ eachMessage: processNotification });
}
```

HIGH consumer group gets higher concurrency, naturally draining faster. At production scale, allocate more partitions and consumer instances to the HIGH topic.

---

## 13. Status Transition Diagram

```
                    ┌──────────┐
                    │ PENDING  │ ◄── Initial state on trigger
                    └────┬─────┘
                         │
            ┌────────────▼────────────┐
            │    User opted out?      │
            └────┬──────────────┬─────┘
                 │              │
                YES            NO
                 │              │
        ┌────────▼───┐  ┌──────▼──────────┐
        │  SKIPPED   │  │   PROCESSING    │
        └────────────┘  └──────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Delivery result   │
                    └────┬──────────┬─────┘
                         │          │
                     Success    Failure
                         │          │
                ┌────────▼──┐  ┌───▼──────────┐
                │ DELIVERED │  │ retry < 3?   │
                └───────────┘  └──┬──────┬────┘
                                  │      │
                                 YES    NO
                                  │      │
                           ┌──────▼──┐  ┌▼────────┐
                           │ Retry   │  │ FAILED  │
                           │ (backoff│  │ (→ DLQ) │
                           └─────────┘  └─────────┘
```

**Valid transitions:**
- PENDING → SKIPPED (user opted out)
- PENDING → PROCESSING (consumer picks up)
- PROCESSING → DELIVERED (provider success)
- PROCESSING → PROCESSING (retry, with incremented retry_count)
- PROCESSING → FAILED (max retries exhausted)

---

## 14. Error Handling

### API Error Response Format

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| INVALID_INPUT | 400 | Validation failure |
| TEMPLATE_NOT_FOUND | 404 | Template ID doesn't exist |
| NOTIFICATION_NOT_FOUND | 404 | Notification ID doesn't exist |
| RATE_LIMIT_EXCEEDED | 429 | User exceeded hourly limit |
| DUPLICATE_REQUEST | 409 | Idempotency key already exists |
| CHANNEL_UNAVAILABLE | 503 | Provider temporarily down (triggers retry) |
| INTERNAL_ERROR | 500 | Unexpected server error |

### Kafka Consumer Error Handling

- **Provider timeout (30s):** Treat as failure, trigger retry
- **Provider 5xx:** Treat as failure, trigger retry
- **Provider 4xx (bad request, invalid recipient):** Fail immediately, no retry (client error)
- **Kafka rebalance:** Pause processing, resume after assignment
- **DB connection lost:** Retry DB operation 3 times with 1s backoff, then fail the message

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  // 1. Stop accepting new HTTP requests
  // 2. Disconnect Kafka consumers (commit final offsets)
  // 3. Close BullMQ schedulers
  // 4. Close DB connections
  // 5. Close Redis connections
  // 6. Exit
});
```

---

## 15. Environment Configuration

```env
# Application
PORT=3000
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notification_platform

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-platform
KAFKA_CONSUMER_GROUP_HIGH=notification-workers-high
KAFKA_CONSUMER_GROUP_NORMAL=notification-workers-normal

# Brevo (Email)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Notification Platform

# Rate Limiting
RATE_LIMIT_PER_HOUR=10

# Retry Config
MAX_RETRY_COUNT=3
RETRY_DELAYS_MS=30000,120000,600000

# Scheduler
SCHEDULER_POLL_INTERVAL_MS=5000

# Frontend
VITE_API_BASE_URL=http://localhost:3000
```

---

## 16. Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | postgres:16-alpine | 5432 | Primary database |
| redis | redis:7-alpine | 6379 | Cache + BullMQ backend |
| zookeeper | confluentinc/cp-zookeeper:7.5.0 | 2181 | Kafka dependency |
| kafka | confluentinc/cp-kafka:7.5.0 | 9092 | Message broker |
| api | (local Dockerfile) | 3000 | Express API server |
| web | (local Dockerfile) | 5173 | React frontend (Vite dev server) |

---

## 17. Project Structure

```
notification-platform/
├── backend/
│   ├── src/
│   │   ├── config/                 # env, kafka, redis, db config
│   │   │   ├── env.ts
│   │   │   ├── kafka.ts
│   │   │   ├── redis.ts
│   │   │   └── database.ts
│   │   ├── modules/
│   │   │   ├── notification/
│   │   │   │   ├── notification.controller.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   ├── notification.repository.ts
│   │   │   │   ├── notification.routes.ts
│   │   │   │   └── notification.consumer.ts
│   │   │   ├── template/
│   │   │   │   ├── template.controller.ts
│   │   │   │   ├── template.service.ts
│   │   │   │   ├── template.repository.ts
│   │   │   │   └── template.routes.ts
│   │   │   ├── preference/
│   │   │   │   ├── preference.controller.ts
│   │   │   │   ├── preference.service.ts
│   │   │   │   ├── preference.repository.ts
│   │   │   │   └── preference.routes.ts
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   ├── analytics.service.ts
│   │   │   │   └── analytics.routes.ts
│   │   │   └── dlq/
│   │   │       └── dlq.service.ts
│   │   ├── channels/
│   │   │   ├── channel.interface.ts
│   │   │   ├── email.provider.ts
│   │   │   ├── sms.provider.ts
│   │   │   └── provider-factory.ts
│   │   ├── common/
│   │   │   ├── middleware/
│   │   │   │   ├── error-handler.ts
│   │   │   │   └── validate.ts
│   │   │   ├── errors/
│   │   │   │   └── app-error.ts
│   │   │   ├── validators/
│   │   │   │   └── notification.schema.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── kafka/
│   │   │   ├── producer.ts
│   │   │   ├── consumer.ts
│   │   │   └── topics.ts
│   │   ├── scheduler/
│   │   │   └── scheduler.service.ts
│   │   ├── redis/
│   │   │   ├── rate-limiter.ts
│   │   │   └── client.ts
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── Dockerfile
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TriggerNotification.tsx
│   │   │   ├── NotificationList.tsx
│   │   │   ├── NotificationDetail.tsx
│   │   │   ├── TemplateManager.tsx
│   │   │   └── Analytics.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── NotificationForm.tsx
│   │   │   ├── TemplateForm.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── AnalyticsTable.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml
├── architecture.md
├── context.md
└── notification-platform-requirements.md
```
