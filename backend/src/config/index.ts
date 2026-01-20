import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  database: {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
  };
  instagram: {
    appId: string;
    appSecret: string;
    redirectUri: string;
    graphApiBaseUrl: string;
    apiVersion: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

const config: Config = {
  port: parseInt(process.env.APP_PORT || '8000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  database: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'instaflow',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
  },
  instagram: {
    appId: process.env.INSTAGRAM_APP_ID || '',
    appSecret: process.env.INSTAGRAM_APP_SECRET || '',
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/auth/instagram/callback',
    graphApiBaseUrl: process.env.INSTAGRAM_GRAPH_API_BASE_URL || 'https://graph.instagram.com',
    apiVersion: process.env.INSTAGRAM_API_VERSION || 'v18.0',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
};

export default config;
