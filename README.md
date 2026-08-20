# Notification Platform

Production-grade notification platform delivering **Email** (Brevo) and **SMS** (console provider) via a Kafka event-driven pipeline with BullMQ scheduling, retry with exponential backoff, priority queues, rate limiting, and Dead Letter Queue.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────────────┐
│   React UI   │────▶│  Express API  │────▶│         Kafka Topics               │
│  (Vite+TW)   │     │  (Port 3000)  │     │  ┌─────────────┐ ┌─────────────┐  │
└─────────────┘     │               │     │  │ notif.high  │ │ notif.normal│  │
                    │  ┌──────────┐ │     │  └──────┬──────┘ └──────┬──────┘  │
                    │  │ BullMQ   │ │     └─────────┼───────────────┼─────────┘
                    │  │ Scheduler│ │               │               │
                    │  └──────────┘ │     ┌─────────▼───────────────▼─────────┐
                    │               │     │        Kafka Consumers            │
                    │  ┌──────────┐ │     │  HIGH (concurrency:5)             │
                    │  │ Rate     │ │     │  NORMAL (concurrency:2)           │
                    │  │ Limiter  │ │     └─────────┬───────────────┬─────────┘
                    │  └──────────┘ │               │               │
                    └──────────────┘     ┌─────────▼───────────────▼─────────┐
                                         │     Channel Providers             │
                                         │  ┌───────────┐  ┌──────────────┐ │
                                         │  │   Brevo   │  │   Console    │ │
                                         │  │  (Email)  │  │   (SMS)     │ │
                                         │  └───────────┘  └──────────────┘ │
                                         └───────────────────────────────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  Retry (BullMQ)     │
                                         │  30s → 2m → 10m     │
                                         │  Max 3 → DLQ        │
                                         └─────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Express v5 + TypeScript | REST API |
| ORM | Prisma | Schema-first DB access |
| Message Broker | Kafka (kafkajs) | Async event pipeline |
| Scheduling | BullMQ (Redis) | Delayed notification delivery |
| Rate Limiting | Redis sliding window (ioredis) | Per-recipient throttling |
| Email | Brevo | Transactional email (300/day free) |
| SMS | Console provider | Pluggable via `IChannelProvider` |
| Frontend | React 19 + Vite + Tailwind v4 | Dashboard UI |
| Database | PostgreSQL | Persistent storage |
| Containers | Docker Compose | Single-command infra |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running on `localhost:5432`
- Docker Desktop (for Redis, Kafka, Zookeeper)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts Redis, Zookeeper, Kafka, Conduktor UI, and creates Kafka topics.

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL connection string and Brevo API key
npm install
npx prisma migrate dev
npx prisma generate
npm run db:seed
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Access

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:3000/api/docs |
| Frontend | http://localhost:5173 |
| Conduktor (Kafka UI) | http://localhost:8080 |

### Docker Compose (Full Stack)

```bash
docker-compose up -d
```

Includes `web` (nginx serving frontend) on port 5173 and `backend` on port 3000.

## API Endpoints

### Recipients

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recipients` | Create recipient |
| GET | `/api/recipients` | List all recipients |
| GET | `/api/recipients/:id` | Get recipient by ID |
| PUT | `/api/recipients/:id` | Update recipient |
| DELETE | `/api/recipients/:id` | Delete recipient |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/templates` | Create template |
| GET | `/api/templates` | List all templates |
| GET | `/api/templates/:id` | Get template by ID |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |

### Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/preferences` | Create preference |
| GET | `/api/preferences` | List all preferences |
| GET | `/api/preferences/:userId` | List preferences for user |
| GET | `/api/preferences/:userId/:channel` | Get specific preference |
| PUT | `/api/preferences/:userId/:channel` | Update preference |
| DELETE | `/api/preferences/:userId/:channel` | Delete preference |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications` | Send notification |
| GET | `/api/notifications` | List (filter by status, channel, priority, recipientId) |
| GET | `/api/notifications/:id` | Get notification by ID |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Aggregate stats |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

Full OpenAPI spec available at `/api/docs`.

## Key Features

### Priority Queues
Separate Kafka topics (`notifications.high`, `notifications.normal`) with HIGH consumer draining faster (concurrency 5 vs 2).

### Retry with Exponential Backoff
Failed notifications retry up to 3 times with delays of 30s, 2m, 10m via BullMQ delayed jobs. After max retries, the notification enters the Dead Letter Queue.

### Scheduled Delivery
Pass `sendAt` in the notification payload to schedule future delivery. BullMQ holds the job until the scheduled time, then publishes to Kafka.

### Rate Limiting
Redis sliding window enforces `RATE_LIMIT_PER_HOUR` per recipient. Returns `429` when exceeded.

### Idempotency
Optional `idempotencyKey` prevents duplicate notification creation. Returns `409` on duplicate key.

### User Preferences
Recipients can opt out of specific channels. Notifications to opted-out recipients are created with status `SKIPPED`.

### Template Variables
Templates support `{{variable}}` interpolation. Pass a `variables` map when creating a notification.

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # DB schema (5 models)
│   └── seed.ts                # Seed data
├── src/
│   ├── app.ts                 # Express app + routes
│   ├── config/
│   │   ├── env.ts             # Env validation
│   │   └── swagger.ts         # OpenAPI setup
│   ├── common/
│   │   ├── middleware/        # Error handler, validation, not-found
│   │   └── validators/        # Shared Zod schemas
│   ├── modules/
│   │   ├── template/          # Template CRUD
│   │   ├── recipient/         # Recipient CRUD
│   │   ├── preference/        # User preferences
│   │   ├── notification/      # Notification create + query
│   │   └── analytics/         # Analytics summary
│   ├── kafka/
│   │   ├── producer.ts        # Kafka producer
│   │   ├── notification-worker.ts  # Consumer (idempotent)
│   │   └── retry-handler.ts   # BullMQ retry + DLQ
│   ├── scheduler/
│   │   └── scheduler.service.ts    # BullMQ delayed jobs
│   └── channels/
│       ├── provider.interface.ts   # IChannelProvider
│       ├── brevo-email.provider.ts
│       ├── console-sms.provider.ts
│       └── provider-factory.ts     # getProvider()
└── tests/                     # Integration + unit tests

frontend/
├── src/
│   ├── pages/                 # Dashboard, Notifications, Templates, etc.
│   ├── components/            # Layout, Sidebar
│   └── App.tsx
├── Dockerfile                 # Multi-stage (build → nginx)
└── nginx.conf                 # Reverse proxy /api → backend
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `KAFKA_BROKERS` | Kafka bootstrap servers | `localhost:9092` |
| `BREVO_API_KEY` | Brevo API key | — |
| `BREVO_SENDER_EMAIL` | Verified sender email | — |
| `RATE_LIMIT_PER_HOUR` | Max notifications per recipient per hour | `10` |
| `MAX_RETRY_COUNT` | Max retry attempts | `3` |
| `RETRY_DELAYS_MS` | Comma-separated retry delays (ms) | `30000,120000,600000` |

## Running Tests

```bash
cd backend
npm test
```

36 tests across 6 suites covering recipients, templates, preferences, notifications, analytics, and template rendering.

## Brevo Setup (Email)

1. Sign up at https://brevo.com (no credit card required)
2. Verify your email address
3. Go to SMTP & API → generate API key
4. Set `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` in `.env`
