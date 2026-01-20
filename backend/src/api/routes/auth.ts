import express, { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import {
  createUser,
  authenticateUser,
  saveRefreshToken,
  validateRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
  findUserById,
} from '../../services/userService';
import { generateTokenPair, verifyToken } from '../../utils/auth';
import { JWTPayload } from '../../utils/auth';
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramUserProfile,
} from '../../services/instagramOAuthService';
import {
  findInstagramAccountByInstaId,
  createInstagramAccount,
  updateInstagramAccount,
} from '../../services/instagramAccountService';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      const existingUser = await authenticateUser({ email, password });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const user = await createUser({ email, password, name });
      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tokens,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await authenticateUser({ email, password });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const tokens = generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tokens,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const isValid = await validateRefreshToken(refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const decoded = verifyToken(refreshToken) as JWTPayload;
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    await deleteRefreshToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    res.json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await deleteRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as JWTPayload;

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await deleteAllRefreshTokens(decoded.userId);

    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as JWTPayload;

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/instagram
 * Instagram OAuth callback
 */
router.post('/instagram', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as JWTPayload;

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokenResponse = await exchangeCodeForToken(code);
    const longLivedTokenResponse = await getLongLivedToken(tokenResponse.access_token);
    const userProfile = await getInstagramUserProfile(longLivedTokenResponse.access_token);

    const existingAccount = await findInstagramAccountByInstaId(userProfile.id);

    if (existingAccount) {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + longLivedTokenResponse.expires_in);

      await updateInstagramAccount(existingAccount.id, {
        access_token: longLivedTokenResponse.access_token,
        token_expires_at: tokenExpiresAt,
        followers_count: userProfile.followers_count || 0,
        following_count: userProfile.follows_count || 0,
        posts_count: userProfile.media_count || 0,
        profile_pic_url: userProfile.profile_picture_url || '',
        bio: userProfile.biography || '',
      });
    } else {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + longLivedTokenResponse.expires_in);

      await createInstagramAccount({
        user_id: decoded.userId,
        instagram_user_id: userProfile.id,
        username: userProfile.username,
        access_token: longLivedTokenResponse.access_token,
        token_expires_at: tokenExpiresAt,
        followers_count: userProfile.followers_count || 0,
        following_count: userProfile.follows_count || 0,
        posts_count: userProfile.media_count || 0,
        profile_pic_url: userProfile.profile_picture_url || '',
        bio: userProfile.biography || '',
      });
    }

    res.json({
      success: true,
      message: 'Instagram account connected successfully',
      account: {
        id: userProfile.id,
        username: userProfile.username,
        profile_pic_url: userProfile.profile_picture_url,
      },
    });
  } catch (error) {
    console.error('Instagram auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
