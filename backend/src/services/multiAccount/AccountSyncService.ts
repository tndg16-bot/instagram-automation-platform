import { query } from '../../config/database';

class AccountSyncService {
  async syncAccount(accountId: string, syncType: string): Promise<any> {
    try {
      const syncResult = await query(
        \`SELECT * FROM instagram_accounts WHERE id = \$1\`,
        [accountId]
      );

      if (syncResult.rows.length === 0) {
        return {
          success: false,
          error: 'Account not found',
        };
      }

      const account = syncResult.rows[0];
      const syncedData = await this.fetchInstagramData(account.access_token, syncType);

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 2;

      if (syncedData.profile) {
        updateFields.push(\`profile_pic_url = \$\${paramIndex++}\`);
        updateFields.push(\`followers_count = \$\${paramIndex++}\`);
        updateFields.push(\`following_count = \$\${paramIndex++}\`);
        updateFields.push(\`posts_count = \$\${paramIndex++}\`);
        updateValues.push(syncedData.profile.profile_pic_url, syncedData.profile.followers_count, syncedData.profile.following_count, syncedData.profile.posts_count);
      }

      if (updateFields.length > 0) {
        updateValues.push(accountId);
        const queryStr = \`UPDATE instagram_accounts SET \${updateFields.join(', ')}, last_used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = \$\${paramIndex++}\`;
        await query(queryStr, updateValues);
      }

      await query(
        \`INSERT INTO account_sync_status (account_id, sync_type, status, synced_data, last_synced_at, created_at, updated_at)
         VALUES (\$1, \$2, 'completed', \$3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *\`,
        [accountId, syncType, JSON.stringify(syncedData)]
      );

      return {
        success: true,
        sync_type: syncType,
        synced_data: syncedData,
      };
    } catch (error: any) {
      console.error('Error syncing account:', error);
      return {
        success: false,
        error: 'Failed to sync account',
      };
    }
  }

  private async fetchInstagramData(accessToken: string, syncType: string): Promise<any> {
    return {
      profile: {
        profile_pic_url: 'https://via.placeholder.com/150',
        followers_count: 1250,
        following_count: 300,
        posts_count: 42,
      },
      [syncType]: {},
    };
  }
}

export default new AccountSyncService();
