import { RecipientRepository, CreateRecipientInput, UpdateRecipientInput } from './recipient.repository';
import { NotFoundError, ValidationError } from '../../common/errors/app-error';

export class RecipientService {
  private repo: RecipientRepository;

  constructor() {
    this.repo = new RecipientRepository();
  }

  async create(data: CreateRecipientInput) {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new ValidationError(`Recipient with email '${data.email}' already exists`);
    }

    return this.repo.create(data);
  }

  async findById(id: string) {
    const recipient = await this.repo.findById(id);
    if (!recipient) {
      throw new NotFoundError('Recipient', id);
    }
    return recipient;
  }

  async findAll() {
    return this.repo.findAll();
  }

  async update(id: string, data: UpdateRecipientInput) {
    await this.findById(id);

    if (data.email) {
      const existing = await this.repo.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ValidationError(`Recipient with email '${data.email}' already exists`);
      }
    }

    return this.repo.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.repo.delete(id);
  }
}
