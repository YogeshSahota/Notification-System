import { PreferenceRepository, CreatePreferenceInput, UpdatePreferenceInput } from './preference.repository';
import { NotFoundError, ValidationError } from '../../common/errors/app-error';
import { Channel } from '@prisma/client';
import { RecipientRepository } from '../recipient/recipient.repository';

export class PreferenceService {
  private repo: PreferenceRepository;
  private recipientRepo: RecipientRepository;

  constructor() {
    this.repo = new PreferenceRepository();
    this.recipientRepo = new RecipientRepository();
  }

  async create(data: CreatePreferenceInput) {
    const recipient = await this.recipientRepo.findById(data.userId);
    if (!recipient) {
      throw new NotFoundError('Recipient', data.userId);
    }

    const existing = await this.repo.findByUserAndChannel(data.userId, data.channel);
    if (existing) {
      throw new ValidationError(`Preference already exists for user '${data.userId}' on channel '${data.channel}'`);
    }

    return this.repo.create({ ...data, optedIn: data.optedIn ?? true });
  }

  async findByUserAndChannel(userId: string, channel: Channel) {
    const pref = await this.repo.findByUserAndChannel(userId, channel);
    if (!pref) {
      throw new NotFoundError('Preference', `${userId}/${channel}`);
    }
    return pref;
  }

  async findByUserId(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async findAll() {
    return this.repo.findAll();
  }

  async update(userId: string, channel: Channel, data: UpdatePreferenceInput) {
    await this.findByUserAndChannel(userId, channel);
    return this.repo.update(userId, channel, data);
  }

  async delete(userId: string, channel: Channel) {
    await this.findByUserAndChannel(userId, channel);
    return this.repo.delete(userId, channel);
  }

  async isOptedIn(userId: string, channel: Channel): Promise<boolean> {
    const pref = await this.repo.findByUserAndChannel(userId, channel);
    if (!pref) {
      return true;
    }
    return pref.optedIn;
  }
}
