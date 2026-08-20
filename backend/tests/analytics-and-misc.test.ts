import request from 'supertest';
import app from './app';

describe('Analytics API', () => {
  it('GET /api/analytics/summary — returns summary', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('byStatus');
    expect(res.body.data).toHaveProperty('byChannel');
    expect(res.body.data).toHaveProperty('byPriority');
    expect(res.body.data).toHaveProperty('dlqCount');
    expect(res.body.data).toHaveProperty('recentHourCount');
  });
});

describe('Health check', () => {
  it('GET /health — returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
