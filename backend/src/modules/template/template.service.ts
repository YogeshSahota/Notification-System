import { TemplateRepository, CreateTemplateInput, UpdateTemplateInput } from './template.repository';
import { NotFoundError, ValidationError } from '../../common/errors/app-error';
import { Channel } from '@prisma/client';

export class TemplateService {
  private repo: TemplateRepository;

  constructor() {
    this.repo = new TemplateRepository();
  }

  async create(data: CreateTemplateInput) {
    if (data.channel === Channel.sms && data.subject) {
      throw new ValidationError('SMS templates cannot have a subject');
    }

    const existing = await this.repo.findByName(data.name);
    if (existing) {
      throw new ValidationError(`Template with name '${data.name}' already exists`);
    }

    return this.repo.create(data);
  }

  async findById(id: string) {
    const template = await this.repo.findById(id);
    if (!template) {
      throw new NotFoundError('Template', id);
    }
    return template;
  }

  async findAll() {
    return this.repo.findAll();
  }

  async update(id: string, data: UpdateTemplateInput) {
    await this.findById(id);

    if (data.name) {
      const existing = await this.repo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new ValidationError(`Template with name '${data.name}' already exists`);
      }
    }

    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.repo.delete(id);
  }

  renderTemplate(templateBody: string, templateSubject: string | null, variables: Record<string, string>): { subject: string | null; body: string } {
    const replaceVars = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
      });
    };

    return {
      subject: templateSubject ? replaceVars(templateSubject) : null,
      body: replaceVars(templateBody),
    };
  }
}
