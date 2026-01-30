// Conversation History Service
// Phase B: AI Decision Engine - Conversation History Management

import { query } from '../config/database';
import { ConversationMessage } from '../types/conversationContext';

/**
 * Conversation History Service
 * Manages conversation history for context-aware AI decisions
 */
class ConversationHistoryService {
  async getHistory(conversationId: string): Promise<ConversationMessage[]> {
    try {
      const result = await query(
        `
        SELECT
          id,
          role,
          content,
          timestamp,
          metadata
        FROM conversation_history
        WHERE conversation_id = $1
        ORDER BY timestamp ASC
        `,
        [conversationId]
      );

      return result.rows.map(row => ({
        id: row.id,
        role: row.role,
        content: row.content,
        timestamp: new Date(row.timestamp),
        metadata: row.metadata,
      }));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  async getConversationsByUserId(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await query(
        `
        SELECT DISTINCT
          ch.conversation_id as "conversationId",
          ch.ig_user_id as "igUserId",
          COUNT(*) as "messageCount",
          MAX(ch.timestamp) as "lastMessageAt",
          cc.funnel_stage as "funnelStage",
          cc.sentiment
        FROM conversation_history ch
        LEFT JOIN conversation_contexts cc ON ch.conversation_id = cc.conversation_id
        WHERE ch.user_id = $1
        GROUP BY ch.conversation_id, ch.ig_user_id, cc.funnel_stage, cc.sentiment
        ORDER BY last_message_at DESC
        LIMIT $2
        `,
        [userId, limit]
      );

      return result.rows.map(row => ({
        conversationId: row.conversationId,
        igUserId: row.igUserId,
        messageCount: parseInt(row.messageCount),
        lastMessageAt: new Date(row.lastMessageAt),
        funnelStage: row.funnelStage,
        sentiment: row.sentiment,
      }));
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      return [];
    }
  }

  async addMessage(
    conversationId: string,
    userId: string,
    igUserId: string,
    message: ConversationMessage
  ): Promise<void> {
    try {
      await query(
        `
        INSERT INTO conversation_history (
          conversation_id,
          user_id,
          ig_user_id,
          role,
          content,
          timestamp,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (conversation_id, user_id) DO NOTHING
        `,
        [
          conversationId,
          userId,
          igUserId,
          message.role,
          message.content,
          message.timestamp || new Date(),
          JSON.stringify(message.metadata),
        ]
      );
    } catch (error) {
      console.error('Error adding conversation message:', error);
    }
  }

  async summarizeConversation(conversationId: string): Promise<any> {
    try {
      const result = await query(
        `
        SELECT
          role,
          COUNT(*) as count,
          MIN(timestamp) as "firstMessage",
          MAX(timestamp) as "lastMessage"
        FROM conversation_history
        WHERE conversation_id = $1
        GROUP BY role
        `,
        [conversationId]
      );

      const summary = {
        totalMessages: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0),
        userMessages: 0,
        assistantMessages: 0,
        duration: 0,
      };

      for (const row of result.rows) {
        if (row.role === 'user') {
          summary.userMessages = parseInt(row.count);
        } else if (row.role === 'assistant') {
          summary.assistantMessages = parseInt(row.count);
        }
      }

      if (result.rows.length >= 2) {
        const firstMessage = result.rows[0].firstMessage;
        const lastMessage = result.rows[result.rows.length - 1].lastMessage;
        summary.duration = Math.floor((new Date(lastMessage).getTime() - new Date(firstMessage).getTime()) / 1000);
      }

      return summary;
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return null;
    }
  }
}

export default new ConversationHistoryService();
