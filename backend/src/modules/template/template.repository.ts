import prisma from '../../config/database';
import { Channel } from '@prisma/client';

export interface CreateTemplateInput {
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
}

export interface UpdateTemplateInput {
  name?: string;
  channel?: Channel;
  subject?: string | null;
  body?: string;
}

export class TemplateRepository {
  async create(data: CreateTemplateInput) {
    return prisma.template.create({ data });
  }

  async findById(id: string) {
    return prisma.template.findUnique({ where: { id } });
  }

  async findByName(name: string) {
    return prisma.template.findUnique({ where: { name } });
  }

  async findAll() {
    return prisma.template.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, data: UpdateTemplateInput) {
    return prisma.template.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.template.delete({ where: { id } });
  }
}
