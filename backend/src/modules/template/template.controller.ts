import { Request, Response, NextFunction } from 'express';
import { TemplateService } from './template.service';

export class TemplateController {
  private service: TemplateService;

  constructor() {
    this.service = new TemplateService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await this.service.create(req.body);
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await this.service.findById(req.params.id as string);
      res.json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const templates = await this.service.findAll();
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await this.service.update(req.params.id as string, req.body);
      res.json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.params.id as string);
      res.json({ success: true, data: { message: 'Template deleted' } });
    } catch (err) {
      next(err);
    }
  };
}
