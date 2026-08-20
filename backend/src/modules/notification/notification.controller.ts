import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { Channel, NotificationStatus, Priority } from '@prisma/client';

export class NotificationController {
  private service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await this.service.create(req.body);
      res.status(201).json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await this.service.findById(req.params.id as string);
      res.json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, channel, priority, recipientId } = req.query as Record<string, string>;

      const notifications = await this.service.findAll({
        ...(status && { status: status as NotificationStatus }),
        ...(channel && { channel: channel as Channel }),
        ...(priority && { priority: priority as Priority }),
        ...(recipientId && { recipientId }),
      });
      res.json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  };
}
