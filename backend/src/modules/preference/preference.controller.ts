import { Request, Response, NextFunction } from 'express';
import { PreferenceService } from './preference.service';
import { Channel } from '@prisma/client';

export class PreferenceController {
  private service: PreferenceService;

  constructor() {
    this.service = new PreferenceService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preference = await this.service.create(req.body);
      res.status(201).json({ success: true, data: preference });
    } catch (err) {
      next(err);
    }
  };

  findByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preferences = await this.service.findByUserId(req.params.userId as string);
      res.json({ success: true, data: preferences });
    } catch (err) {
      next(err);
    }
  };

  findByUserAndChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preference = await this.service.findByUserAndChannel(
        req.params.userId as string,
        req.params.channel as Channel,
      );
      res.json({ success: true, data: preference });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preferences = await this.service.findAll();
      res.json({ success: true, data: preferences });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preference = await this.service.update(
        req.params.userId as string,
        req.params.channel as Channel,
        req.body,
      );
      res.json({ success: true, data: preference });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.params.userId as string, req.params.channel as Channel);
      res.json({ success: true, data: { message: 'Preference deleted' } });
    } catch (err) {
      next(err);
    }
  };
}
