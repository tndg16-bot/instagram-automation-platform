import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Route imports
import authRoutes from './api/routes/auth';
import instagramRoutes from './api/routes/instagram';
import dmRoutes from './api/routes/dm';
import dmInboxRoutes from './api/routes/dmInbox';
import commentRoutes from './api/routes/comment';
import workflowRoutes from './api/routes/workflow';
import aiRoutes from './api/routes/ai';
import ordersRoutes from './api/routes/orders';
import bookingsRoutes from './api/routes/bookings';
import postsRoutes from './api/routes/posts';
import analyticsRoutes from './api/routes/analytics';
import webhooksRoutes from './api/routes/webhooks';
import membershipRoutes from './api/routes/membership';
import communityRoutes from './api/routes/community';
import eventsRoutes from './api/routes/events';
import webhooksOutboundRoutes from './api/routes/webhooks-outbound';
import zapierRoutes from './api/routes/zapier';
import makeRoutes from './api/routes/make';
import n8nRoutes from './api/routes/n8n';
import autoLikeRoutes from './api/routes/auto-like';
import autoFollowRoutes from './api/routes/auto-follow';
import scheduledPostsRoutes from './api/routes/scheduled-posts';
import tenantsRoutes from './api/routes/tenants';

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 8000;

// Security middleware
app.use(helmet());

// CORS configuration
// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3020', // Frontend development port
  'http://localhost:3030'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Check if origin is allowed or if it's not defined (e.g. same origin or server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/dm', dmInboxRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/webhooks/outbound', webhooksOutboundRoutes);
app.use('/api/integrations/zapier', zapierRoutes);
app.use('/api/integrations/make', makeRoutes);
app.use('/api/integrations/n8n', n8nRoutes);
app.use('/api/auto/like', autoLikeRoutes);
app.use('/api/auto/follow', autoFollowRoutes);
app.use('/api/scheduled-posts', scheduledPostsRoutes);
app.use('/api/tenants', tenantsRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

export default app;
