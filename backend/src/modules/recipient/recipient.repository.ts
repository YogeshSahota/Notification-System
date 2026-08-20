import prisma from '../../config/database';

export interface CreateRecipientInput {
  id?: string;
  email: string;
  phone?: string;
  name?: string;
}

export interface UpdateRecipientInput {
  email?: string;
  phone?: string | null;
  name?: string | null;
}

export class RecipientRepository {
  async create(data: CreateRecipientInput) {
    return prisma.recipient.create({ data });
  }

  async findById(id: string) {
    return prisma.recipient.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.recipient.findUnique({ where: { email } });
  }

  async findAll() {
    return prisma.recipient.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, data: UpdateRecipientInput) {
    return prisma.recipient.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.recipient.delete({ where: { id } });
  }
}
