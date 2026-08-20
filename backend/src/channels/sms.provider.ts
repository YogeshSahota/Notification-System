import { Channel, ChannelPayload, ChannelResult, IChannelProvider } from '../common/types';

export class ConsoleSmsProvider implements IChannelProvider {
  channel = Channel.SMS;

  async send(payload: ChannelPayload): Promise<ChannelResult> {
    console.log('\n========== SMS NOTIFICATION ==========');
    console.log(`To: ${payload.recipient}`);
    console.log(`Body: ${payload.body}`);
    console.log('======================================\n');

    return {
      success: true,
      providerMessageId: `console-sms-${Date.now()}`,
    };
  }
}
