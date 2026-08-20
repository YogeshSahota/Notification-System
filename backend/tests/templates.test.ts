import request from 'supertest';
import app from './app';
import prisma from '../src/config/database';

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Template API', () => {
  let createdId: string;
  const templateName = unique();

  afterAll(async () => {
    if (createdId) {
      await prisma.template.deleteMany({ where: { id: createdId } }).catch(() => {});
    }
  });

  it('POST /api/templates — creates an email template', async () => {
    const res = await request(app).post('/api/templates').send({
      name: templateName,
      channel: 'email',
      subject: 'Hello {{name}}',
      body: 'Hi {{name}}, your code is {{otp}}.',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(templateName);
    expect(res.body.data.channel).toBe('email');
    createdId = res.body.data.id;
  });

  it('POST /api/templates — rejects SMS with subject', async () => {
    const res = await request(app).post('/api/templates').send({
      name: unique(),
      channel: 'sms',
      subject: 'Not allowed',
      body: 'Your code is {{otp}}.',
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/templates — lists templates', async () => {
    const res = await request(app).get('/api/templates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/templates/:id — finds by id', async () => {
    const res = await request(app).get(`/api/templates/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PUT /api/templates/:id — updates template', async () => {
    const res = await request(app).put(`/api/templates/${createdId}`).send({ body: 'New body {{name}}' });
    expect(res.status).toBe(200);
    expect(res.body.data.body).toBe('New body {{name}}');
  });

  it('DELETE /api/templates/:id — deletes template', async () => {
    const createRes = await request(app).post('/api/templates').send({
      name: unique(),
      channel: 'sms',
      body: 'Test body',
    });
    const id = createRes.body.data.id;
    const res = await request(app).delete(`/api/templates/${id}`);
    expect(res.status).toBe(200);
  });
});
