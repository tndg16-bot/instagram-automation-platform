import express, { Router, Request, Response } from 'express';
import { findUserById } from '../../services/userService';
import { verifyToken } from '../../utils/auth';
import { JWTPayload } from '../../utils/auth';
import {
  findInstagramAccountsByUserId,
  deactivateInstagramAccount,
} from '../../services/instagramAccountService';

const router = Router();

const authenticateUser = async (
  req: Request,
  res: Response
): Promise<string> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' });
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token) as JWTPayload;

  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    throw new Error('Invalid token');
  }

  const user = await findUserById(decoded.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    throw new Error('User not found');
  }

  return user.id;
};

/**
 * GET /api/instagram/accounts
 * Get user's connected Instagram accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = await authenticateUser(req, res);

    const accounts = await findInstagramAccountsByUserId(userId);

    const sanitizedAccounts = accounts.map(account => ({
      id: account.id,
      instagram_user_id: account.instagram_user_id,
      username: account.username,
      profile_pic_url: account.profile_pic_url,
      followers_count: account.followers_count,
      following_count: account.following_count,
      posts_count: account.posts_count,
      is_active: account.is_active,
      connected_at: account.connected_at,
    }));

    res.json({
      success: true,
      accounts: sanitizedAccounts,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized' || (error as Error).message === 'Invalid token' || (error as Error).message === 'User not found') {
      return;
    }
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/instagram/accounts/:id
 * Disconnect Instagram account
 */
router.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const userId = await authenticateUser(req, res);
    const { id } = req.params;
    const accountId = Array.isArray(id) ? id[0] : id;

    const success = await deactivateInstagramAccount(accountId);

    if (!success) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      success: true,
      message: 'Instagram account disconnected successfully',
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized' || (error as Error).message === 'Invalid token' || (error as Error).message === 'User not found') {
      return;
    }
    console.error('Disconnect account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
