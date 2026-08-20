import { AnalyticsRepository, AnalyticsSummary } from './analytics.repository';

export class AnalyticsService {
  private repo: AnalyticsRepository;

  constructor() {
    this.repo = new AnalyticsRepository();
  }

  async getSummary(): Promise<AnalyticsSummary> {
    return this.repo.getSummary();
  }
}
