import axios from 'axios';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || '';
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || '';
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/auth/instagram/callback';

export interface InstagramOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
}

export interface InstagramUserProfile {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
  followers_count?: number;
  follows_count?: number;
  biography?: string;
  profile_picture_url?: string;
  website?: string;
}

/**
 * Generate Instagram OAuth URL
 */
export const getInstagramAuthUrl = (state: string): string => {
  const scopes = [
    'instagram_basic',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'instagram_content_publish',
    'instagram_manage_messages',
  ].join(',');

  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    scope: scopes,
    response_type: 'code',
    state,
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (
  code: string
): Promise<InstagramOAuthTokenResponse> => {
  try {
     const response = await axios.post(
       'https://api.instagram.com/oauth/access_token',
       {
         client_id: INSTAGRAM_APP_ID,
         client_secret: INSTAGRAM_APP_SECRET,
         grant_type: 'authorization_code',
         redirect_uri: INSTAGRAM_REDIRECT_URI,
         code,
       },
       {
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
         },
       }
     );

    return response.data as InstagramOAuthTokenResponse;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw new Error('Failed to exchange authorization code for access token');
  }
};

/**
 * Get long-lived access token (valid for 60 days)
 */
export const getLongLivedToken = async (
  shortLivedToken: string
): Promise<InstagramOAuthTokenResponse> => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`
    );

    return response.data as InstagramOAuthTokenResponse;
  } catch (error) {
    console.error('Error getting long-lived token:', error);
    throw new Error('Failed to get long-lived access token');
  }
};

/**
 * Get Instagram user profile
 */
export const getInstagramUserProfile = async (
  accessToken: string
): Promise<InstagramUserProfile> => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count,follows_count,biography,profile_picture_url&access_token=${accessToken}`
    );

    return response.data as InstagramUserProfile;
  } catch (error) {
    console.error('Error getting Instagram user profile:', error);
    throw new Error('Failed to get Instagram user profile');
  }
};

/**
 * Refresh long-lived access token
 */
export const refreshAccessToken = async (
  accessToken: string
): Promise<InstagramOAuthTokenResponse> => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    );

    return response.data as InstagramOAuthTokenResponse;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
};
