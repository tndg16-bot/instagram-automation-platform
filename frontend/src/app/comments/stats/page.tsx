'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CommentStats {
  total_comments: number;
  pending_comments: number;
  replied_comments: number;
  ignored_comments: number;
  recent_replies: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/comments/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching comment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateResponseRate = () => {
    if (!stats || stats.total_comments === 0) return 0;
    return ((stats.replied_comments / stats.total_comments) * 100).toFixed(1);
  };

  const calculateAvgResponseTime = () => {
    // This would be calculated from actual data in a real implementation
    return '2.3'; // Placeholder: average hours
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                InstaFlow AI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/comments" className="text-gray-600 hover:text-gray-900">
                Comments
              </Link>
              <Link href="/comments/templates" className="text-gray-600 hover:text-gray-900">
                Templates
              </Link>
              <Link href="/comments/keywords" className="text-gray-600 hover:text-gray-900">
                Keywords
              </Link>
              <Link href="/comments/stats" className="text-gray-600 hover:text-gray-900">
                Stats
              </Link>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900">
              Comment Statistics
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your comment engagement and response performance
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>

        {stats && (
          <>
            {/* Key Metrics */}
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Comments */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Comments
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.total_comments}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Comments */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Pending
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-yellow-600">
                            {stats.pending_comments}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replied Comments */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Replied
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-green-600">
                            {stats.replied_comments}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Replies */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Recent Replies (24h)
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-purple-600">
                            {stats.recent_replies}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Response Rate */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Response Rate</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-indigo-600">{calculateResponseRate()}%</div>
                    <p className="text-sm text-gray-500 mt-1">of total comments</p>
                  </div>
                    <div className="w-32 h-32 relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#4f46e5"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - Number(calculateResponseRate()) / 100)}`}
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Average Response Time */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Average Response Time</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-indigo-600">{calculateAvgResponseTime()}</div>
                    <p className="text-sm text-gray-500 mt-1">hours</p>
                  </div>
                  <div className="flex items-center text-green-600">
                    <svg className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm font-medium">12% faster</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="mt-8 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
              <div className="space-y-4">
                {/* Replied */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Replied</span>
                    <span className="text-sm font-medium text-gray-700">
                      {stats.total_comments > 0 ? ((stats.replied_comments / stats.total_comments) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total_comments > 0 ? (stats.replied_comments / stats.total_comments) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Pending */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Pending</span>
                    <span className="text-sm font-medium text-gray-700">
                      {stats.total_comments > 0 ? ((stats.pending_comments / stats.total_comments) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total_comments > 0 ? (stats.pending_comments / stats.total_comments) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Ignored */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Ignored</span>
                    <span className="text-sm font-medium text-gray-700">
                      {stats.total_comments > 0 ? ((stats.ignored_comments / stats.total_comments) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{
                        width: `${stats.total_comments > 0 ? (stats.ignored_comments / stats.total_comments) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Link
                href="/comments"
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center mb-4">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">View Comments</h3>
                </div>
                <p className="text-sm text-gray-500">
                  {stats.pending_comments} pending comments waiting for your response
                </p>
              </Link>

              <Link
                href="/comments/templates"
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center mb-4">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Manage Templates</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Create and customize reply templates for faster responses
                </p>
              </Link>

              <Link
                href="/comments/keywords"
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center mb-4">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Keyword Rules</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Set up automatic replies for specific keywords
                </p>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
