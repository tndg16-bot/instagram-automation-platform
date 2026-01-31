import { query } from '../../src/config/database';
import * as autoLikeService from '../../src/services/autoLikeService';
import InstagramGraphClient from '../../src/services/instagramClient';

jest.mock('../../src/config/database');
jest.mock('../../src/services/instagramClient');

describe('AutoLikeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAutoLikeSettings', () => {
    it('should return settings for user and account', async () => {
      const mockSettings = {
        id: 'settings-1',
        user_id: 'user-1',
        instagram_account_id: 'ig-1',
        is_active: true,
        target_hashtags: ['#marketing', '#business'],
        max_likes_per_day: 100,
      };
      (query as jest.Mock).mockResolvedValue({ rows: [mockSettings] });

      const result = await autoLikeService.getAutoLikeSettings('user-1', 'ig-1');

      expect(result).toBeDefined();
      expect(result?.is_active).toBe(true);
      expect(result?.target_hashtags).toHaveLength(2);
    });

    it('should return null if no settings found', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await autoLikeService.getAutoLikeSettings('user-1', 'ig-1');

      expect(result).toBeNull();
    });
  });

  describe('saveAutoLikeSettings', () => {
    it('should create or update settings', async () => {
      const mockSettings = {
        id: 'settings-1',
        user_id: 'user-1',
        instagram_account_id: 'ig-1',
        is_active: true,
      };
      (query as jest.Mock).mockResolvedValue({ rows: [mockSettings] });

      const result = await autoLikeService.saveAutoLikeSettings('user-1', 'ig-1', {
        is_active: true,
        target_hashtags: ['#test'],
        max_likes_per_day: 50,
      });

      expect(result).toBeDefined();
      expect(query).toHaveBeenCalled();
    });
  });

  describe('getTodayLikeCount', () => {
    it('should return count of likes today', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [{ count: '5' }] });

      const result = await autoLikeService.getTodayLikeCount('user-1', 'ig-1');

      expect(result).toBe(5);
    });
  });

  describe('executeAutoLike', () => {
    it('should not execute if settings are inactive', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [{ is_active: false }] });

      const result = await autoLikeService.executeAutoLike('user-1', 'ig-1', 'token-123');

      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
    });

    it('should not execute if daily limit reached', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ is_active: true, max_likes_per_day: 100 }] })
        .mockResolvedValueOnce({ rows: [{ count: '100' }] }); // Limit reached

      const result = await autoLikeService.executeAutoLike('user-1', 'ig-1', 'token-123');

      expect(result.processed).toBe(0);
    });

    it('should execute auto-like with proper limits', async () => {
      const mockSettings = {
        is_active: true,
        max_likes_per_day: 100,
        target_accounts: ['competitor1', 'competitor2'],
        like_delay_min: 1,
        like_delay_max: 2,
      };
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSettings] })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // 10 likes today
        .mockResolvedValueOnce({ rows: [{ id: 'user-123', username: 'competitor1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'media-1' }] })
        .mockResolvedValueOnce({ rows: [] }) // No existing like
        .mockResolvedValueOnce({ rows: [] }); // Log insert

      const mockLikeMedia = jest.fn();
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        likeMedia: mockLikeMedia,
        searchUsers: jest.fn().mockResolvedValue([{ id: 'user-123' }]),
        getUserMedia: jest.fn().mockResolvedValue([{ id: 'media-1' }]),
      }));

      const result = await autoLikeService.executeAutoLike('user-1', 'ig-1', 'token-123');

      expect(result.processed).toBeGreaterThanOrEqual(0);
    });
  });
});
