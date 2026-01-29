import { query } from '../../config/database';

class MultiAccountManager {
  async getAccounts(userId: string): Promise<any> {
    try {
      const result = await query(
        \`SELECT * FROM instagram_accounts WHERE user_id = \$1 ORDER BY is_default DESC, created_at DESC\`,
        [userId]
      );

      return {
        success: true,
        data: result.rows,
      };
    } catch (error: any) {
      console.error('Error getting accounts:', error);
      return {
        success: false,
        error: 'Failed to get accounts',
      };
    }
  }
}

export default new MultiAccountManager();
