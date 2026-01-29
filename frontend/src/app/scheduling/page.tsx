'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScheduledPost {
  id: string;
  type: 'post' | 'reel' | 'story';
  caption: string;
  media_urls: string[];
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  account_id: string;
  account_username: string;
  hashtags: string[];
  optimal_time_score: number;
}

interface BestTimePrediction {
  day_of_week: string;
  hour: number;
  engagement_score: number;
  recommended_action: string;
}

interface ContentTemplate {
  id: string;
  name: string;
  type: 'post' | 'reel' | 'story';
  caption_template: string;
  hashtags: string[];
  media_placeholders: string[];
}

export default function ContentSchedulingPage() {
  const [loading, setLoading] = useState(true);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [bestTimePredictions, setBestTimePredictions] = useState<BestTimePrediction[]>([]);
  const [contentTemplates, setContentTemplates] = useState<ContentTemplate[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchScheduledPosts();
    fetchBestTimePredictions();
    fetchContentTemplates();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:8000/api/scheduling/posts?period=${selectedPeriod}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setScheduledPosts(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      setLoading(false);
    }
  };

  const fetchBestTimePredictions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/scheduling/best-times', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBestTimePredictions(data.data);
      }
    } catch (error) {
      console.error('Error fetching best time predictions:', error);
    }
  };

  const fetchContentTemplates = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/scheduling/templates', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setContentTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching content templates:', error);
    }
  };

  const handleCancelSchedule = async (postId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/scheduling/posts/${postId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setScheduledPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      alert('Failed to cancel schedule');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      case 'published':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Published</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>;
      case 'reel':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>;
      case 'story':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>;
      default:
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>;
    }
  };

  const getOptimalTimeColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">InstaFlow AI</h1>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/scheduling" className="text-gray-900 font-medium">
                Scheduling
              </Link>
              <Link href="/analytics" className="text-gray-600 hover:text-gray-900">
                Analytics
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  window.location.href = '/login';
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Content Scheduling
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Schedule posts and find optimal posting times using AI
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Schedule Post
              </button>
            </div>
          </div>

          {/* 最適投稿時間予測 */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Best Time to Post
                </h3>
                <span className="text-sm text-gray-500">
                  Based on AI analysis of your audience
                </span>
              </div>

              {bestTimePredictions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {bestTimePredictions.slice(0, 6).map((prediction, index) => (
                    <div
                      key={`${prediction.day_of_week}-${prediction.hour}`}
                      className={`border rounded-lg p-4 ${index < 3 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {prediction.day_of_week} at {prediction.hour}:00
                        </h4>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${getOptimalTimeColor(prediction.engagement_score)}`}>
                          {prediction.engagement_score}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {prediction.recommended_action}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not enough data for predictions. Schedule more posts to get AI recommendations.</p>
              )}
            </div>
          </div>

          {/* スケジュール済み投稿 */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Scheduled Posts
                </h3>
                <span className="text-sm text-gray-500">
                  {scheduledPosts.length} posts scheduled
                </span>
              </div>

              {scheduledPosts.length > 0 ? (
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <div
                      key={post.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                              {getTypeIcon(post.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </h4>
                              {getStatusBadge(post.status)}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {post.caption}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>@{post.account_username}</span>
                              <span>{new Date(post.scheduled_at).toLocaleString()}</span>
                              {post.optimal_time_score > 0 && (
                                <span className={`px-2 py-0.5 rounded font-medium ${getOptimalTimeColor(post.optimal_time_score)}`}>
                                  {post.optimal_time_score}% optimal
                                </span>
                              )}
                            </div>
                            {post.hashtags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {post.hashtags.slice(0, 5).map((tag) => (
                                  <span key={tag} className="text-xs text-indigo-600">
                                    #{tag}
                                  </span>
                                ))}
                                {post.hashtags.length > 5 && (
                                  <span className="text-xs text-gray-500">
                                    +{post.hashtags.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {post.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelSchedule(post.id)}
                            className="ml-4 text-sm text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled posts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by scheduling your first post
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Schedule Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* コンテンツテンプレート */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Content Templates
                </h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-900">
                  Create Template
                </button>
              </div>

              {contentTemplates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {contentTemplates.slice(0, 6).map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                          {getTypeIcon(template.type)}
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {template.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {template.caption_template}
                      </p>
                      {template.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.hashtags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-indigo-600">
                              #{tag}
                            </span>
                          ))}
                          {template.hashtags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{template.hashtags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No templates yet. Create your first template to save time when scheduling posts.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* スケジュールモーダル */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Schedule New Post</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Choose the content type, write your caption, add hashtags, and select the optimal posting time.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content Type
                </label>
                <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="post">Post</option>
                  <option value="reel">Reel</option>
                  <option value="story">Story</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <textarea
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Write your caption here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hashtags (comma separated)
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="instagood, photooftheday, love"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
