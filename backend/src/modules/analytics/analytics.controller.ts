import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  getSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.service.getSummary();
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  };
}
