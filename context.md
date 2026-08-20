# Notification Platform — Context File

> **Purpose:** Resume development across terminal sessions. Read this file at the start of each session to restore full context.

---

## Project Summary

Production-grade **Notification Platform** with Express backend + React frontend. Delivers Email (Brevo) and SMS (console provider) via Kafka event-driven pipeline with BullMQ scheduling, retry with exponential backoff, priority queues, rate limiting, and DLQ.

---

## Tech Stack Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Runtime | Node.js + TypeScript | Type safety, industry standard |
| Framework | Express | Lightweight, widely known |
| ORM | Prisma | Schema-first DX, faster iteration, new learning (already know TypeORM) |
| Message Broker | Kafka (kafkajs) | Resume signal, partition-based parallelism, message replay — needed on resume |
| Delayed Scheduling | BullMQ (Redis-backed) | Kafka lacks native delayed messages; BullMQ fills the gap cleanly |
| Rate Limiting | Redis sliding window (ioredis) | In-memory speed, precise counting |
| Email | Brevo (Sendinblue) | Free 300/day, no credit card, works in India |
| SMS | Console provider (pluggable) | No free SMS API without credit card in India; IChannelProvider interface for easy swap |
| Frontend | React + Vite + Tailwind | Lightweight dashboard for triggering/monitoring |
| Containerization | Docker Compose | Single-command infra spin-up |

---

## Architecture Decisions Log

| # | Decision | Alternatives Considered | Rationale |
|---|----------|------------------------|-----------|
| 1 | Kafka over BullMQ-only | BullMQ as sole queue | Kafka demonstrates distributed systems maturity; BullMQ-only doesn't show broker experience |
| 2 | BullMQ for scheduling only | Custom Redis ZSET polling, DB polling | BullMQ internally uses ZSET — same pattern, production-tested, no custom code |
| 3 | DB polling rejected for scheduling | — | Not considered good practice; Redis ZSET (via BullMQ) is the proper delay queue pattern |
| 4 | One channel per notification request | Multi-channel fan-out | Requirements doc specifies single channel per request; simplifies processing |
| 5 | Separate Kafka topics for priority | Single topic with priority field | Cleaner separation; HIGH consumer drains faster with higher concurrency |
| 6 | Brevo for email | Resend, Nodemailer+Gmail | No credit card required, works in India, free 300/day |
| 7 | Console SMS provider | Twilio, MessageBird | No free SMS API without credit card in India; pluggable interface for future |
| 8 | React frontend added | API-only with Postman | Lightweight dashboard makes project more demo-able; Tailwind keeps it minimal |
| 9 | No auth on frontend | — | Local dev only; auth is out of scope |

---

## Roadmap

### Week 1: Foundation & Core APIs
- [x] **D1:** Init project (Express + TS + ESLint + Prettier), folder structure, `.env.example`, Docker Compose (PostgreSQL, Redis, Kafka, Zookeeper)
- [ ] **D2:** Prisma schema for all 4 tables, run migrations, seed script
- [ ] **D3:** Template CRUD APIs (FR-3) — controller → service → repository, `{{variable}}` parsing
- [ ] **D4:** User Preferences APIs (FR-7) — default opted_in=true, skip logic

### Week 2: Kafka Pipeline + Delivery
- [ ] **D5:** KafkaJS producer/consumer setup, topic creation, `POST /notifications` (FR-2) — validate, check preferences, persist PENDING, publish to Kafka
- [x] **D6:** Kafka consumer workers — drain HIGH topic first, render template, call provider, update status (FR-1, FR-6)
- [x] **D7:** Retry with exponential backoff (FR-5) — track retry_count, re-publish via BullMQ delayed job, max 3 retries → DLQ
- [x] **D8:** `GET /notifications/:id` (FR-6), `GET /notifications` (list with filters)
- [x] **D9:** Channel providers — Brevo email provider + console SMS provider, `IChannelProvider` interface

### Week 3: Scheduling + Good-to-Have Features
- [x] **D10:** BullMQ delayed jobs for scheduled notifications (FR-4) — when job fires → publish to Kafka
- [x] **D11:** Priority queues (FR-8) — already via Kafka topics, add `priority` to API, HIGH-first consumer logic
- [x] **D12:** Rate limiting (FR-9) — Redis sliding window via ioredis, configurable `RATE_LIMIT_PER_HOUR`, return 429
- [x] **D13:** Basic Analytics (FR-10) — `GET /analytics/summary`, SQL aggregation by channel + date

### Week 4: Frontend + Hardening + Polish
- [x] **D14:** React frontend — Vite + Tailwind setup, Layout + Sidebar, Dashboard page
- [x] **D15:** React frontend — Trigger Notification form, Notification List + Detail pages
- [x] **D16:** React frontend — Template Manager, Analytics page; Docker Compose add web service
- [x] **D17:** Error handling, input validation (Zod), graceful shutdown, idempotency
- [x] **D18:** Integration tests — full pipeline, scheduling, retry, DLQ, preference skip, rate limit
- [x] **D19:** Swagger/OpenAPI docs, README with architecture diagram
- [ ] **D20:** Code cleanup, verify single-command Docker Compose startup, interview talking points prep

---

## Current Progress

**Status:** D1 complete — project initialized, Docker Compose ready, dev server verified
**Next Task:** D2 — Prisma schema for all 4 tables, run migrations, seed script

---

## Key Design Patterns

| Pattern | Where Used |
|---------|-----------|
| Repository | All data access — no raw queries in service/controller layers |
| Service Layer | All business logic in service classes, controllers are thin |
| Strategy (Provider) | `IChannelProvider` interface — BrevoEmailProvider, ConsoleSmsProvider |
| Factory | `getProvider(channel)` returns correct provider instance |
| Observer (Event-driven) | Kafka producer/consumer for async processing |
| Delay Queue | BullMQ delayed jobs for scheduled notifications |

---

## Dev Commands

```bash
# Start infrastructure
docker-compose up -d

# Backend
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run dev              # Start Express server

# Frontend
cd frontend
npm install
npm run dev              # Start Vite dev server on :5173

# Run all tests
cd backend && npm test

# Prisma studio (DB GUI)
npx prisma studio
```

---

## Free Provider Setup

### Brevo (Email)
1. Go to https://brevo.com — sign up (no credit card)
2. Verify your email
3. Go to SMTP & API settings → generate API key
4. Set `BREVO_API_KEY` in `.env`
5. Set `BREVO_SENDER_EMAIL` to your verified email

### SMS (Console Provider)
- No setup needed — logs SMS payload to console
- To switch to Twilio later: implement `TwilioSmsProvider` class, update factory

---

## Interview Talking Points

### Why Kafka over BullMQ-only
- Kafka provides partition-based parallelism, message replay, consumer group scaling
- BullMQ is single-Redis-node; Kafka is designed for distributed, high-throughput systems
- Kafka on resume signals distributed systems maturity

### Why BullMQ alongside Kafka
- Kafka doesn't support native delayed messages
- BullMQ is the simplest delay mechanism on top of Redis
- Separation of concerns: Kafka = reliable delivery pipeline, BullMQ = time-based scheduling

### Scaling the system
- Increase Kafka partitions for higher throughput
- Add more consumer instances per consumer group
- Partition by recipient_id for per-user ordering
- DB read replicas for analytics queries
- Move to Kafka Streams or Flink for real-time analytics at scale

### Kafka consumer group rebalancing
- Code handles rebalance gracefully — manual offset commit only after successful processing
- Idempotent processing prevents duplicate delivery on rebalance

### Why Redis ZSET (via BullMQ) for scheduling
- DB polling is anti-pattern at scale
- Redis sorted sets provide O(log N) range queries by score (timestamp)
- BullMQ implements this pattern production-ready — no custom code needed

---

## File Locations

| File | Path | Purpose |
|------|------|---------|
| Architecture | `architecture.md` | Full system architecture document |
| Context | `context.md` | This file — session resumption |
| Requirements | `notification-platform-requirements.md` | Original project requirements |
| Docker Compose | `docker-compose.yml` | All infra services |
| Backend Config | `backend/.env.example` | Environment variables template |
| Prisma Schema | `backend/prisma/schema.prisma` | Database schema |

---

## Notes / Blockers

_(Update this section as you encounter issues or decisions during development)_
