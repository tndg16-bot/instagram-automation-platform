import { query } from '../config/database';

export interface CommunityTopic {
  id: string;
  title: string;
  slug: string;
  description?: string;
  author_id: string;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  category: string;
  tags: string[];
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_activity_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CommunityPost {
  id: string;
  topic_id: string;
  author_id: string;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  content: string;
  parent_post_id?: string;
  is_solution: boolean;
  upvotes: number;
  downvotes: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTopicDto {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
}

export interface CreatePostDto {
  content: string;
  parent_post_id?: string;
}

export const getTopics = async (
  options: {
    category?: string;
    tag?: string;
    sortBy?: 'latest' | 'popular' | 'unanswered';
    page?: number;
    limit?: number;
  } = {}
): Promise<{ topics: CommunityTopic[]; total: number }> => {
  const { category, tag, sortBy = 'latest', page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE t.is_pinned = FALSE';
  const params: any[] = [];
  
  if (category) {
    params.push(category);
    whereClause += ` AND t.category = $${params.length}`;
  }
  
  if (tag) {
    params.push(tag);
    whereClause += ` AND $${params.length} = ANY(t.tags)`;
  }
  
  let orderClause = '';
  switch (sortBy) {
    case 'popular':
      orderClause = 'ORDER BY t.view_count DESC, t.last_activity_at DESC';
      break;
    case 'unanswered':
      orderClause = 'ORDER BY t.reply_count ASC, t.created_at DESC';
      break;
    default:
      orderClause = 'ORDER BY t.last_activity_at DESC';
  }
  
  const pinnedQuery = `SELECT t.*, u.name as author_name FROM community_topics t JOIN users u ON t.author_id = u.id WHERE t.is_pinned = TRUE ORDER BY t.created_at DESC`;
  const topicsQuery = `SELECT t.*, u.name as author_name FROM community_topics t JOIN users u ON t.author_id = u.id ${whereClause} ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const countQuery = `SELECT COUNT(*) as total FROM community_topics t ${whereClause.replace('WHERE t.is_pinned = FALSE', 'WHERE 1=1')}`;
  
  const [pinnedResult, topicsResult, countResult] = await Promise.all([
    query(pinnedQuery),
    query(topicsQuery, [...params, limit, offset]),
    query(countQuery, params)
  ]);
  
  const mapTopic = (row: any): CommunityTopic => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    author_id: row.author_id,
    author: row.author_id ? { id: row.author_id, name: row.author_name } : undefined,
    category: row.category,
    tags: row.tags || [],
    is_pinned: row.is_pinned,
    is_locked: row.is_locked,
    view_count: row.view_count,
    reply_count: row.reply_count,
    last_activity_at: row.last_activity_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  });
  
  return {
    topics: [...pinnedResult.rows.map(mapTopic), ...topicsResult.rows.map(mapTopic)],
    total: parseInt(countResult.rows[0].total)
  };
};

export const getTopicById = async (topicId: string): Promise<{ topic: CommunityTopic | null; posts: CommunityPost[] }> => {
  const topicResult = await query(
    'SELECT t.*, u.name as author_name FROM community_topics t JOIN users u ON t.author_id = u.id WHERE t.id = $1',
    [topicId]
  );
  
  if (topicResult.rows.length === 0) return { topic: null, posts: [] };
  
  const row = topicResult.rows[0];
  const topic: CommunityTopic = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    author_id: row.author_id,
    author: { id: row.author_id, name: row.author_name },
    category: row.category,
    tags: row.tags || [],
    is_pinned: row.is_pinned,
    is_locked: row.is_locked,
    view_count: row.view_count,
    reply_count: row.reply_count,
    last_activity_at: row.last_activity_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
  
  await query('UPDATE community_topics SET view_count = view_count + 1 WHERE id = $1', [topicId]);
  
  const postsResult = await query(
    'SELECT p.*, u.name as author_name FROM community_posts p JOIN users u ON p.author_id = u.id WHERE p.topic_id = $1 ORDER BY p.created_at ASC',
    [topicId]
  );
  
  const posts = postsResult.rows.map((row: any): CommunityPost => ({
    id: row.id,
    topic_id: row.topic_id,
    author_id: row.author_id,
    author: { id: row.author_id, name: row.author_name },
    content: row.content,
    parent_post_id: row.parent_post_id,
    is_solution: row.is_solution,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
  
  return { topic, posts };
};

export const createTopic = async (authorId: string, dto: CreateTopicDto): Promise<CommunityTopic> => {
  const slug = dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);
  
  const result = await query(
    'INSERT INTO community_topics (title, slug, description, author_id, category, tags, last_activity_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
    [dto.title, slug, dto.description, authorId, dto.category, dto.tags || []]
  );
  
  return result.rows[0];
};

export const createPost = async (topicId: string, authorId: string, dto: CreatePostDto): Promise<CommunityPost> => {
  const result = await query(
    'INSERT INTO community_posts (topic_id, author_id, content, parent_post_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [topicId, authorId, dto.content, dto.parent_post_id || null]
  );
  
  await query(
    'UPDATE community_topics SET last_activity_at = NOW(), reply_count = reply_count + 1 WHERE id = $1',
    [topicId]
  );
  
  return result.rows[0];
};
