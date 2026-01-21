import pool from '../config/database';

/**
 * Get Instagram access token for a user
 * Returns the access token for the user's active Instagram account
 */
export async function getInstagramAccessToken(userId: string, instagramAccountId?: string): Promise<string> {
  const query = instagramAccountId
    ? `SELECT access_token FROM instagram_accounts WHERE id = $1 AND user_id = $2 AND is_active = true`
    : `SELECT access_token FROM instagram_accounts WHERE user_id = $1 AND is_active = true ORDER BY connected_at DESC LIMIT 1`;

  const params = instagramAccountId
    ? [instagramAccountId, userId]
    : [userId];

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    throw new Error('No active Instagram account found');
  }

  return result.rows[0].access_token;
}

/**
 * Get Instagram account details
 */
export async function getInstagramAccount(userId: string, instagramAccountId: string) {
  const query = `
    SELECT id, instagram_user_id, username, access_token, token_expires_at, is_active
    FROM instagram_accounts
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [instagramAccountId, userId]);

  if (result.rows.length === 0) {
    throw new Error('Instagram account not found');
  }

  return result.rows[0];
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt) < new Date();
}
