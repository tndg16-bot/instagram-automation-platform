import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InstaFlow API',
      version: '1.0.0',
      description: 'Instagram Automation Platform API',
      contact: {
        name: 'InstaFlow Support',
        email: 'support@instaflow.io',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.instaflow.io/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        InstagramAccount: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            profile_pic_url: { type: 'string' },
            followers_count: { type: 'integer' },
            is_active: { type: 'boolean' },
          },
        },
        DMCampaign: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'scheduled', 'sending', 'completed'] },
            scheduled_at: { type: 'string', format: 'date-time' },
          },
        },
        MembershipTier: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            display_name: { type: 'string' },
            price_monthly: { type: 'number' },
            features: { type: 'array', items: { type: 'string' } },
          },
        },
        WebhookEndpoint: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            events: { type: 'array', items: { type: 'string' } },
            is_active: { type: 'boolean' },
          },
        },
        Workflow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            is_active: { type: 'boolean' },
            nodes: { type: 'array' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Instagram', description: 'Instagram account management' },
      { name: 'DM', description: 'Direct message campaigns' },
      { name: 'Comments', description: 'Comment management and auto-reply' },
      { name: 'Workflows', description: 'Automation workflows' },
      { name: 'Membership', description: 'Subscription and billing' },
      { name: 'Community', description: 'Community forum' },
      { name: 'Events', description: 'Events and registrations' },
      { name: 'Webhooks', description: 'Webhook management' },
      { name: 'Analytics', description: 'Analytics and reporting' },
      { name: 'Auto', description: 'Auto-like and auto-follow' },
      { name: 'Scheduled Posts', description: 'Scheduled content posting' },
      { name: 'Tenants', description: 'Multi-tenant management' },
    ],
  },
  apis: ['./src/api/routes/*.ts', './src/api/routes/**/*.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'InstaFlow API Documentation',
  }));

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;
