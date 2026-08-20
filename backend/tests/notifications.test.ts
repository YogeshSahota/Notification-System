import request from 'supertest';
import app from './app';
import prisma from '../src/config/database';
import redis from '../src/config/redis';
import { connectKafka, disconnectKafka } from '../src/kafka/producer';

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Notification API', () => {
  let recipientId: string;
  let templateId: string;
  const email = `${unique()}@test.com`;

  beforeAll(async () => {
    await connectKafka();

    const recipRes = await request(app).post('/api/recipients').send({ email, name: 'Notif Test', phone: '+919999999999' });
    recipientId = recipRes.body.data.id;

    const tmplRes = await request(app).post('/api/templates').send({
      name: unique(),
      channel: 'email',
      subject: 'Test {{name}}',
      body: 'Hello {{name}}',
    });
    templateId = tmplRes.body.data.id;

    const keys = await redis.keys('rate_limit:*');
    if (keys.length) await redis.del(...keys);
  });

  afterAll(async () => {
    await disconnectKafka();
    await prisma.notification.deleteMany({ where: { recipientId } }).catch(() => {});
    await prisma.userPreference.deleteMany({ where: { userId: recipientId } }).catch(() => {});
    await prisma.template.deleteMany({ where: { id: templateId } }).catch(() => {});
    await prisma.recipient.deleteMany({ where: { id: recipientId } }).catch(() => {});
  });

  it('POST /api/notifications — creates notification (publishes to Kafka)', async () => {
    const res = await request(app).post('/api/notifications').send({
      recipientId,
      channel: 'email',
      templateId,
      priority: 'NORMAL',
      variables: { name: 'Test' },
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.recipientId).toBe(recipientId);
  });

  it('POST /api/notifications — creates HIGH priority notification', async () => {
    const res = await request(app).post('/api/notifications').send({
      recipientId,
      channel: 'email',
      templateId,
      priority: 'HIGH',
      variables: { name: 'Test' },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.priority).toBe('HIGH');
  });

  it('POST /api/notifications — 404 for missing recipient', async () => {
    const res = await request(app).post('/api/notifications').send({
      recipientId: '00000000-0000-0000-0000-000000000000',
      channel: 'email',
      templateId,
      variables: {},
    });
    expect(res.status).toBe(404);
  });

  it('POST /api/notifications — 404 for missing template', async () => {
    const res = await request(app).post('/api/notifications').send({
      recipientId,
      channel: 'email',
      templateId: '00000000-0000-0000-0000-000000000000',
      variables: {},
    });
    expect(res.status).toBe(404);
  });

  it('POST /api/notifications — idempotency key prevents duplicate', async () => {
    const key = `idem-${unique()}`;
    const payload = {
      recipientId,
      channel: 'email',
      templateId,
      variables: {},
      idempotencyKey: key,
    };

    const first = await request(app).post('/api/notifications').send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/notifications').send(payload);
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('DUPLICATE_REQUEST');
  });

  it('POST /api/notifications — SKIPPED when opted out', async () => {
    await request(app).post('/api/preferences').send({
      userId: recipientId,
      channel: 'sms',
      optedIn: false,
    });

    const res = await request(app).post('/api/notifications').send({
      recipientId,
      channel: 'sms',
      templateId,
      variables: {},
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('SKIPPED');

    await prisma.userPreference.deleteMany({ where: { userId: recipientId, channel: 'sms' } }).catch(() => {});
  });

  it('POST /api/notifications — scheduled notification with sendAt', async () => {
    const futureDate = new Date(Date.now() + 60000).toISOString();
    const res = await request(app).post('/api/notifications').send({
      recipientId,
      channel: 'email',
      templateId,
      variables: {},
      sendAt: futureDate,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.sendAt).toBeTruthy();
  });

  it('POST /api/notifications — rejects invalid channel', async () => {
    const res = await request(app).post('/api/notifications').send({
      recipientId,
      channel: 'push',
      templateId,
      variables: {},
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/notifications — lists with filters', async () => {
    const res = await request(app).get('/api/notifications?status=PENDING&channel=email');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/notifications/:id — finds by id', async () => {
    const createRes = await request(app).post('/api/notifications').send({
      recipientId,
      channel: 'email',
      templateId,
      variables: {},
    });
    const id = createRes.body.data.id;

    const res = await request(app).get(`/api/notifications/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('GET /api/notifications/:id — 404 for missing', async () => {
    const res = await request(app).get('/api/notifications/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
