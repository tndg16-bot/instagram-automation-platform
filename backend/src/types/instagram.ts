export interface InstagramUser {
  id: string;
  username: string;
  profile_picture_url?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  biography?: string;
  website?: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
  permalink: string;
  like_count: number;
  comments_count: number;
}

export interface InstagramComment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  media_id: string;
}

export interface InstagramDirectMessage {
  id: string;
  from_id: string;
  to_id: string;
  text?: string;
  media_url?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface InstagramPageInfo {
  has_next_page: boolean;
  end_cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  paging?: InstagramPageInfo;
}

export interface InstagramAPIError {
  error: {
    type: string;
    message: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}
