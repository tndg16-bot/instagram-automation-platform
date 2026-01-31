import { query } from '../../src/config/database';
import * as membershipService from '../../src/services/membershipService';

// Mock database
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

describe('MembershipService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMembershipTiers', () => {
    it('should return all tiers ordered by price', async () => {
      const mockTiers = [
        { id: 1, name: 'Free', price_monthly: 0 },
        { id: 2, name: 'Starter', price_monthly: 2980 },
      ];
      (query as jest.Mock).mockResolvedValue({ rows: mockTiers });

      const result = await membershipService.getMembershipTiers();

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM membership_tiers ORDER BY price_monthly ASC'
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Free');
    });
  });

  describe('getUserMembershipStatus', () => {
    it('should return active membership for user', async () => {
      const mockMembership = {
        id: 'mem-1',
        user_id: 'user-1',
        tier_id: 2,
        status: 'active',
        name: 'Starter',
        display_name: 'スタータープラン',
      };
      (query as jest.Mock).mockResolvedValue({ rows: [mockMembership] });

      const result = await membershipService.getUserMembershipStatus('user-1');

      expect(result).toBeDefined();
      expect(result?.tier?.name).toBe('Starter');
    });

    it('should return free tier if no active membership', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // No active membership
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Free', display_name: 'フリープラン', max_instagram_accounts: 1, max_dm_per_day: 100, max_workflows: 3, max_team_members: 1, ai_credits_per_month: 10, priority_support: false, features: [] }] }); // Free tier

      const result = await membershipService.getUserMembershipStatus('user-1');

      expect(result).toBeDefined();
      expect(result?.tier?.name).toBe('Free');
    });
  });

  describe('upgradeMembership', () => {
    it('should upgrade user membership', async () => {
      const mockMembership = {
        id: 'mem-2',
        user_id: 'user-1',
        tier_id: 3,
        status: 'active',
      };
      (query as jest.Mock).mockResolvedValue({ rows: [mockMembership] });

      const result = await membershipService.upgradeMembership('user-1', 3, 'stripe', 'sub-123');

      expect(query).toHaveBeenCalledTimes(2); // Cancel old + create new
      expect(result.tier_id).toBe(3);
    });
  });

  describe('checkPlanLimits', () => {
    it('should return current usage and limit', async () => {
      const mockMembership = {
        user_id: 'user-1',
        tier_id: 2,
        tier: { max_instagram_accounts: 3 },
      };
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockMembership] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const result = await membershipService.checkPlanLimits('user-1', 'instagram_accounts');

      expect(result.current).toBe(1);
      expect(result.limit).toBe(3);
      expect(result.withinLimit).toBe(true);
    });
  });
});
