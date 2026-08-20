import { Channel, ChannelPayload, ChannelResult, IChannelProvider } from '../common/types';
import { env } from '../config/env';

interface BrevoEmailResponse {
  messageId?: string;
  error?: string;
}

export class BrevoEmailProvider implements IChannelProvider {
  channel = Channel.EMAIL;

  async send(payload: ChannelPayload): Promise<ChannelResult> {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: env.BREVO_SENDER_NAME,
            email: env.BREVO_SENDER_EMAIL,
          },
          to: [{ email: payload.recipient }],
          subject: payload.subject || 'Notification',
          htmlContent: payload.body,
        }),
      });

      const data = (await response.json()) as BrevoEmailResponse;

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Brevo API error: ${response.status}`,
        };
      }

      return {
        success: true,
        providerMessageId: data.messageId,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown email provider error',
      };
    }
  }
}
