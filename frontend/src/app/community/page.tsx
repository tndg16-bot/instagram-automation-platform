'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Topic {
  id: string;
  title: string;
  slug: string;
  description?: string;
  author?: { name: string };
  category: string;
  tags: string[];
  is_pinned: boolean;
  view_count: number;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
}

export default function CommunityPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  useEffect(() => {
    fetchTopics();
  }, [category, sortBy]);

  const fetchTopics = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('sortBy', sortBy);
      
      const response = await fetch(`http://localhost:8000/api/community/topics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch topics');
      
      const data = await response.json();
      setTopics(data.data?.topics || []);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const categories = ['general', 'help', 'showcase', 'tutorial'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
          <Link href="/community/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            New Topic
          </Link>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
              className="border rounded px-3 py-2"
            >
              <option value="latest">Latest Activity</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-4">
          {topics.map((topic) => (
            <Link 
              key={topic.id} 
              href={`/community/topics/${topic.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {topic.is_pinned && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Pinned</span>
                    )}
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded capitalize">
                      {topic.category}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{topic.title}</h2>
                  
                  {topic.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{topic.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By {topic.author?.name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{topic.view_count} views</span>
                    <span>•</span>
                    <span>{topic.reply_count} replies</span>
                    <span>•</span>
                    <span>{new Date(topic.last_activity_at).toLocaleDateString()}</span>
                  </div>
                  
                  {topic.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {topic.tags.map((tag) => (
                        <span key={tag} className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No topics yet. Be the first to start a discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
