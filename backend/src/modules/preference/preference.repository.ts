import prisma from '../../config/database';
import { Channel } from '@prisma/client';

export interface CreatePreferenceInput {
  userId: string;
  channel: Channel;
  optedIn?: boolean;
}

export interface UpdatePreferenceInput {
  optedIn?: boolean;
}

export class PreferenceRepository {
  async create(data: CreatePreferenceInput) {
    return prisma.userPreference.create({ data });
  }

  async findByUserAndChannel(userId: string, channel: Channel) {
    return prisma.userPreference.findUnique({
      where: { userId_channel: { userId, channel } },
    });
  }

  async findByUserId(userId: string) {
    return prisma.userPreference.findMany({
      where: { userId },
      orderBy: { channel: 'asc' },
    });
  }

  async findAll() {
    return prisma.userPreference.findMany({
      orderBy: [{ userId: 'asc' }, { channel: 'asc' }],
    });
  }

  async update(userId: string, channel: Channel, data: UpdatePreferenceInput) {
    return prisma.userPreference.update({
      where: { userId_channel: { userId, channel } },
      data,
    });
  }

  async delete(userId: string, channel: Channel) {
    return prisma.userPreference.delete({
      where: { userId_channel: { userId, channel } },
    });
  }
}
