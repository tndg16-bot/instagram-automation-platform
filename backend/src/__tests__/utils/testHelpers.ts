import { Pool, PoolClient } from 'pg';

/**
 * Test utilities for DM automation integration tests
 */

export interface MockUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface MockInstagramAccount {
  id: string;
  user_id: string;
  instagram_id: string;
  username: string;
  access_token: string;
  created_at: Date;
}

/**
 * Create a mock database connection
 */
export function createMockPool(): jest.Mocked<Pool> {
  const pool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  } as any;

  return pool;
}

/**
 * Create a mock database client
 */
export function createMockClient(): jest.Mocked<PoolClient> {
  return {
    query: jest.fn(),
    release: jest.fn(),
  } as any;
}

/**
 * Create test user
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    password_hash: '$2b$10$testhash',
    created_at: new Date(),
    ...overrides,
  };
}

/**
 * Create test Instagram account
 */
export function createMockInstagramAccount(overrides: Partial<MockInstagramAccount> = {}): MockInstagramAccount {
  return {
    id: 'test-ig-account-1',
    user_id: 'test-user-1',
    instagram_id: '123456789',
    username: 'testuser',
    access_token: 'test-access-token-12345',
    created_at: new Date(),
    ...overrides,
  };
}

/**
 * Mock query result helper
 */
export function mockQueryResult<T>(rows: T[]) {
  return {
    rows,
    rowCount: rows.length,
  };
}

/**
 * Wait for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test UUID
 */
export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Mock Instagram Graph API response
 */
export function createMockInstagramResponse(data: any) {
  return {
    data,
    success: true,
  };
}

/**
 * Test database setup and teardown utilities
 */
export class TestDatabase {
  private tables: string[] = [
    'users',
    'instagram_accounts',
    'dm_campaigns',
    'dm_campaign_recipients',
    'dm_segments',
    'dm_message_templates',
    'dm_logs',
    'dm_step_sequences',
  ];

  /**
   * Clean all test data from database
   */
  async cleanup(pool: Pool): Promise<void> {
    // Delete in correct order (respecting foreign keys)
    const deleteOrder = [
      'dm_campaign_recipients',
      'dm_step_sequences',
      'dm_logs',
      'dm_campaigns',
      'dm_message_templates',
      'dm_segments',
      'instagram_accounts',
      'users',
    ];

    for (const table of deleteOrder) {
      await pool.query(`DELETE FROM ${table} WHERE email LIKE 'test-%' OR username LIKE 'test-%' OR name LIKE 'test-%'`);
    }
  }

  /**
   * Insert test user
   */
  async insertTestUser(pool: Pool, userData: Partial<MockUser> = {}): Promise<MockUser> {
    const user = createMockUser(userData);
    await pool.query(
      'INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)',
      [user.id, user.email, user.password_hash, user.created_at]
    );
    return user;
  }

  /**
   * Insert test Instagram account
   */
  async insertTestInstagramAccount(
    pool: Pool,
    accountData: Partial<MockInstagramAccount> = {}
  ): Promise<MockInstagramAccount> {
    const account = createMockInstagramAccount(accountData);
    await pool.query(
      'INSERT INTO instagram_accounts (id, user_id, instagram_id, username, access_token, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [account.id, account.user_id, account.instagram_id, account.username, account.access_token, account.created_at]
    );
    return account;
  }

  /**
   * Get row count for a table
   */
  async getRowCount(pool: Pool, table: string): Promise<number> {
    const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
    return parseInt(result.rows[0].count);
  }
}

export const testDatabase = new TestDatabase();
