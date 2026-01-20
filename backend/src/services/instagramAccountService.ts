import { query } from '../config/database';

export interface InstagramAccount {
  id: string;
  user_id: string;
  instagram_user_id: string;
  username: string;
  access_token: string;
  token_expires_at: Date;
  profile_pic_url: string;
  bio: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_active: boolean;
  connected_at: Date;
  updated_at: Date;
}

export interface CreateInstagramAccountDto {
  user_id: string;
  instagram_user_id: string;
  username: string;
  access_token: string;
  token_expires_at: Date;
  profile_pic_url?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

/**
 * Create Instagram account
 */
export const createInstagramAccount = async (
  dto: CreateInstagramAccountDto
): Promise<InstagramAccount> => {
  const result = await query(
    `INSERT INTO instagram_accounts
       (user_id, instagram_user_id, username, access_token, token_expires_at,
        profile_pic_url, bio, followers_count, following_count, posts_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      dto.user_id,
      dto.instagram_user_id,
      dto.username,
      dto.access_token,
      dto.token_expires_at,
      dto.profile_pic_url || null,
      dto.bio || null,
      dto.followers_count || 0,
      dto.following_count || 0,
      dto.posts_count || 0,
    ]
  );

  return result.rows[0];
};

/**
 * Find Instagram accounts by user ID
 */
export const findInstagramAccountsByUserId = async (
  userId: string
): Promise<InstagramAccount[]> => {
  const result = await query(
    'SELECT * FROM instagram_accounts WHERE user_id = $1 AND is_active = true',
    [userId]
  );

  return result.rows;
};

/**
 * Find Instagram account by Instagram user ID
 */
export const findInstagramAccountByInstaId = async (
  instagramUserId: string
): Promise<InstagramAccount | null> => {
  const result = await query(
    'SELECT * FROM instagram_accounts WHERE instagram_user_id = $1',
    [instagramUserId]
  );

  return result.rows[0] || null;
};

/**
 * Update Instagram account
 */
export const updateInstagramAccount = async (
  id: string,
  updates: Partial<InstagramAccount>
): Promise<InstagramAccount | null> => {
  const setClause = Object.keys(updates)
    .map((key, index) => `${key} = $${index + 2}`)
    .join(', ');

  const values = [id, ...Object.values(updates)];

  const result = await query(
    `UPDATE instagram_accounts SET ${setClause}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Deactivate Instagram account
 */
export const deactivateInstagramAccount = async (
  id: string
): Promise<boolean> => {
  const result = await query(
    'UPDATE instagram_accounts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );

  return (result.rowCount || 0) > 0;
};

/**
 * Refresh Instagram account access token
 */
export const refreshInstagramToken = async (
  id: string,
  newToken: string,
  expiresAt: Date
): Promise<InstagramAccount | null> => {
  const result = await query(
    `UPDATE instagram_accounts
     SET access_token = $2, token_expires_at = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id, newToken, expiresAt]
  );

  return result.rows[0] || null;
};
