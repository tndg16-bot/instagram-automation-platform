import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isMockMode = process.env.MOCK_MODE === 'true';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'instaflow',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Only create pool if not in mock mode to avoid connection errors
const pool: any = isMockMode ? null : new Pool(poolConfig);

export default pool;

// Mock data
const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'demo@example.com',
  // bcrypt hash for "password"
  password_hash: '$2b$10$w3.g.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0',
  name: 'Demo User',
  created_at: new Date(),
  updated_at: new Date(),
};

const mockInstagramAccount = {
  id: 'ig_12345',
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  instagram_user_id: '17841400000000000',
  username: 'demo_shop_jp',
  access_token: 'mock_access_token',
  token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  profile_pic_url: 'https://via.placeholder.com/150',
  followers_count: 1250,
  following_count: 300,
  posts_count: 42,
  is_active: true,
  connected_at: new Date(),
  updated_at: new Date(),
};

export const query = async (text: string, params?: any[]) => {
  if (isMockMode) {
    console.log('[MockDB] Query:', text.replace(/\s+/g, ' ').trim());

    // Simple mock logic based on query content
    const lowerText = text.toLowerCase();

    // User related queries
    if (lowerText.includes('from users')) {
      if (lowerText.includes('where email')) {
        // Find by email - return mock user if email matches or just return it for simplicity
        return { rows: [mockUser], rowCount: 1 };
      }
      if (lowerText.includes('where id')) {
        return { rows: [mockUser], rowCount: 1 };
      }
    }

    // Auth/Refresh Token related
    if (lowerText.includes('insert into users')) {
      return { rows: [mockUser], rowCount: 1 };
    }

    // Refresh tokens (simplified)
    if (lowerText.includes('refresh_tokens')) {
      return { rows: [], rowCount: 0 };
    }

    // Instagram Account related
    if (lowerText.includes('from instagram_accounts')) {
      if (lowerText.includes('user_id')) {
        return { rows: [mockInstagramAccount], rowCount: 1 };
      }
      if (lowerText.includes('instagram_user_id')) {
        return { rows: [mockInstagramAccount], rowCount: 1 };
      }
    }

    if (lowerText.includes('insert into instagram_accounts') || lowerText.includes('update instagram_accounts')) {
      return { rows: [mockInstagramAccount], rowCount: 1 };
    }

    // DM Campaigns related
    if (lowerText.includes('from dm_campaigns')) {
      if (lowerText.includes('where id')) {
        const mockCampaign = {
          id: 'dm-campaign-1',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          instagram_account_id: 'ig_12345',
          name: 'Test Campaign',
          message: 'Test message',
          message_type: 'TEXT',
          media_url: null,
          segment_id: null,
          status: 'draft',
          scheduled_at: null,
          started_at: null,
          completed_at: null,
          total_recipients: null,
          sent_count: 0,
          failed_count: 0,
          delivered_count: 0,
          read_count: 0,
          error_message: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        return { rows: [mockCampaign], rowCount: 1 };
      }
      if (lowerText.includes('where user_id')) {
        const mockCampaigns = [
          {
            id: 'dm-campaign-1',
            user_id: '550e8400-e29b-41d4-a716-446655440000',
            instagram_account_id: 'ig_12345',
            name: 'Test Campaign',
            message: 'Test message',
            status: 'draft',
            sent_count: 0,
            failed_count: 0,
            delivered_count: 0,
            read_count: 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];
        return { rows: mockCampaigns, rowCount: 1 };
      }
    }

    if (lowerText.includes('insert into dm_campaigns')) {
      const mockCampaign = {
        id: 'dm-campaign-1',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        instagram_account_id: 'ig_12345',
        name: 'Test Campaign',
        message: 'Test message',
        message_type: 'TEXT',
        media_url: null,
        segment_id: null,
        status: 'draft',
        scheduled_at: null,
        started_at: null,
        completed_at: null,
        total_recipients: null,
        sent_count: 0,
        failed_count: 0,
        delivered_count: 0,
        read_count: 0,
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      return { rows: [mockCampaign], rowCount: 1 };
    }

    if (lowerText.includes('update dm_campaigns')) {
      return { rows: [], rowCount: 0 };
    }

    // DM Campaign Recipients related
    if (lowerText.includes('from dm_campaign_recipients')) {
      const mockRecipients = [
        {
          id: 'recipient-1',
          campaign_id: 'dm-campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'testuser',
          status: 'pending',
          sent_at: null,
          delivered_at: null,
          read_at: null,
          error_message: null,
          created_at: new Date(),
        },
      ];
      return { rows: mockRecipients, rowCount: 1 };
    }

    if (lowerText.includes('insert into dm_campaign_recipients') || lowerText.includes('update dm_campaign_recipients')) {
      const mockRecipient = {
        id: 'recipient-1',
        campaign_id: 'dm-campaign-1',
        recipient_id: 'ig-user-1',
        recipient_username: 'testuser',
        status: 'pending',
        sent_at: null,
        delivered_at: null,
        read_at: null,
        error_message: null,
        created_at: new Date(),
      };
      return { rows: [mockRecipient], rowCount: 1 };
    }

    // DM Segments related
    if (lowerText.includes('from dm_segments')) {
      const mockSegments = [
        {
          id: 'segment-1',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          instagram_account_id: 'ig_12345',
          name: 'High Engagement Users',
          description: 'Users with >1000 followers',
          conditions: '[]',
          is_dynamic: true,
          size: 150,
          last_updated_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      return { rows: mockSegments, rowCount: 1 };
    }

    if (lowerText.includes('insert into dm_segments')) {
      const mockSegment = {
        id: 'segment-1',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        instagram_account_id: 'ig_12345',
        name: 'High Engagement Users',
        description: 'Users with >1000 followers',
        conditions: '[]',
        is_dynamic: true,
        size: 150,
        last_updated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      return { rows: [mockSegment], rowCount: 1 };
    }

    // DM Message Templates related
    if (lowerText.includes('from dm_message_templates')) {
      const mockTemplates = [
        {
          id: 'template-1',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Welcome Message',
          message: 'Welcome to our community!',
          message_type: 'TEXT',
          media_url: null,
          category: 'onboarding',
          tags: '["welcome", "onboarding"]',
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      return { rows: mockTemplates, rowCount: 1 };
    }

    if (lowerText.includes('insert into dm_message_templates') || lowerText.includes('update dm_message_templates')) {
      const mockTemplate = {
        id: 'template-1',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Welcome Message',
        message: 'Welcome to our community!',
        message_type: 'TEXT',
        media_url: null,
        category: 'onboarding',
        tags: '["welcome", "onboarding"]',
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      return { rows: [mockTemplate], rowCount: 1 };
    }

    // DM Logs related
    if (lowerText.includes('insert into dm_logs') || lowerText.includes('from dm_logs')) {
      return { rows: [], rowCount: 0 };
    }

    // Default empty response
    return { rows: [], rowCount: 0 };
  }

  return pool!.query(text, params);
};
