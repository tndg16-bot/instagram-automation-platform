import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Route imports
import authRoutes from './api/routes/auth';
import dmRoutes from './api/routes/dm';
import commentRoutes from './api/routes/comment';
import workflowRoutes from './api/routes/workflow';

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 8000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
app.use('/api/dm', dmRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/workflows', workflowRoutes);

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
