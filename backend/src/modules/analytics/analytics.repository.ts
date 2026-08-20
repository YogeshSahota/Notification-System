import prisma from '../../config/database';

export interface AnalyticsSummary {
  total: number;
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
  byPriority: Record<string, number>;
  dlqCount: number;
  recentHourCount: number;
}

export class AnalyticsRepository {
  async getSummary(): Promise<AnalyticsSummary> {
    const [total, byStatus, byChannel, byPriority, dlqCount, recentHourCount] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.notification.groupBy({ by: ['channel'], _count: { channel: true } }),
      prisma.notification.groupBy({ by: ['priority'], _count: { priority: true } }),
      prisma.deadLetterQueue.count(),
      prisma.notification.count({
        where: { createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count.status }), {}),
      byChannel: byChannel.reduce((acc, item) => ({ ...acc, [item.channel]: item._count.channel }), {}),
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count.priority }), {}),
      dlqCount,
      recentHourCount,
    };
  }
}
