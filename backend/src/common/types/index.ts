export enum Channel {
  EMAIL = 'email',
  SMS = 'sms',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export enum Priority {
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
}

export interface ChannelPayload {
  recipient: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface IChannelProvider {
  channel: Channel;
  send(payload: ChannelPayload): Promise<ChannelResult>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
