import { Request, Response, NextFunction } from 'express';
import { RecipientService } from './recipient.service';

export class RecipientController {
  private service: RecipientService;

  constructor() {
    this.service = new RecipientService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recipient = await this.service.create(req.body);
      res.status(201).json({ success: true, data: recipient });
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recipient = await this.service.findById(req.params.id as string);
      res.json({ success: true, data: recipient });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recipients = await this.service.findAll();
      res.json({ success: true, data: recipients });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recipient = await this.service.update(req.params.id as string, req.body);
      res.json({ success: true, data: recipient });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.params.id as string);
      res.json({ success: true, data: { message: 'Recipient deleted' } });
    } catch (err) {
      next(err);
    }
  };
}
