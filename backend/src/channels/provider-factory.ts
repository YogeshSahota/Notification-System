import { Channel, IChannelProvider } from '../common/types';
import { BrevoEmailProvider } from './email.provider';
import { ConsoleSmsProvider } from './sms.provider';

const providers: Record<string, IChannelProvider> = {
  [Channel.EMAIL]: new BrevoEmailProvider(),
  [Channel.SMS]: new ConsoleSmsProvider(),
};

export function getProvider(channel: string): IChannelProvider {
  const provider = providers[channel];
  if (!provider) {
    throw new Error(`No provider for channel: ${channel}`);
  }
  return provider;
}
