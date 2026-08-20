import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Platform API',
      version: '1.0.0',
      description:
        'Production-grade notification platform delivering Email (Brevo) and SMS (console) via Kafka event-driven pipeline with BullMQ scheduling, retry with exponential backoff, priority queues, rate limiting, and DLQ.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {},
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'string', example: 'NOT_FOUND' },
            message: { type: 'string', example: 'Resource not found' },
            details: { type: 'object', nullable: true },
          },
          required: ['success', 'code', 'message'],
        },
        Recipient: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            name: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateRecipient: {
          type: 'object',
          required: ['email'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Optional custom UUID' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            name: { type: 'string' },
          },
        },
        UpdateRecipient: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            name: { type: 'string', nullable: true },
          },
        },
        Template: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            channel: { type: 'string', enum: ['email', 'sms'] },
            subject: { type: 'string', nullable: true, description: 'Required for email, not allowed for SMS' },
            body: { type: 'string', description: 'Supports {{variable}} interpolation' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTemplate: {
          type: 'object',
          required: ['name', 'channel', 'body'],
          properties: {
            name: { type: 'string', maxLength: 100 },
            channel: { type: 'string', enum: ['email', 'sms'] },
            subject: { type: 'string', maxLength: 200, description: 'Required for email templates' },
            body: { type: 'string', minLength: 1, description: 'Supports {{variable}} interpolation' },
          },
        },
        UpdateTemplate: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 100 },
            channel: { type: 'string', enum: ['email', 'sms'] },
            subject: { type: 'string', maxLength: 200, nullable: true },
            body: { type: 'string', minLength: 1 },
          },
        },
        UserPreference: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            channel: { type: 'string', enum: ['email', 'sms'] },
            optedIn: { type: 'boolean' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreatePreference: {
          type: 'object',
          required: ['userId', 'channel'],
          properties: {
            userId: { type: 'string' },
            channel: { type: 'string', enum: ['email', 'sms'] },
            optedIn: { type: 'boolean', default: true },
          },
        },
        UpdatePreference: {
          type: 'object',
          required: ['optedIn'],
          properties: {
            optedIn: { type: 'boolean' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            recipientId: { type: 'string', format: 'uuid' },
            channel: { type: 'string', enum: ['email', 'sms'] },
            templateId: { type: 'string', format: 'uuid' },
            variables: { type: 'object', additionalProperties: { type: 'string' } },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'SKIPPED'] },
            priority: { type: 'string', enum: ['HIGH', 'NORMAL'] },
            sendAt: { type: 'string', format: 'date-time', nullable: true },
            retryCount: { type: 'integer', minimum: 0 },
            failureReason: { type: 'string', nullable: true },
            idempotencyKey: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateNotification: {
          type: 'object',
          required: ['recipientId', 'channel', 'templateId'],
          properties: {
            recipientId: { type: 'string', description: 'UUID of the recipient' },
            channel: { type: 'string', enum: ['email', 'sms'] },
            templateId: { type: 'string', description: 'UUID of the template' },
            variables: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'Template variable substitutions',
              default: {},
            },
            priority: { type: 'string', enum: ['HIGH', 'NORMAL'], default: 'NORMAL' },
            sendAt: { type: 'string', format: 'date-time', description: 'Future ISO date for scheduled delivery' },
            idempotencyKey: { type: 'string', description: 'Deduplication key — prevents duplicate processing' },
          },
        },
        AnalyticsSummary: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            byStatus: {
              type: 'object',
              properties: {
                PENDING: { type: 'integer' },
                PROCESSING: { type: 'integer' },
                DELIVERED: { type: 'integer' },
                FAILED: { type: 'integer' },
                SKIPPED: { type: 'integer' },
              },
            },
            byChannel: {
              type: 'object',
              properties: {
                email: { type: 'integer' },
                sms: { type: 'integer' },
              },
            },
            byPriority: {
              type: 'object',
              properties: {
                HIGH: { type: 'integer' },
                NORMAL: { type: 'integer' },
              },
            },
            dlqCount: { type: 'integer', description: 'Dead Letter Queue entries' },
            recentHourCount: { type: 'integer', description: 'Notifications created in the last hour' },
          },
        },
      },
    },
  },
  apis: ['./src/modules/*/routes.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}
