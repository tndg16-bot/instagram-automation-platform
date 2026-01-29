'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserBehaviorMetrics {
  page_views: number;
  unique_visitors: number;
  avg_session_duration: number;
  bounce_rate: number;
}

interface CampaignMetrics {
  total_campaigns: number;
  total_sent: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

interface ABTestResult {
  id: string;
  name: string;
  variant_a: string;
  variant_b: string;
  metric: string;
  winner: string;
  statistical_significance: number;
  created_at: string;
}

interface RealtimeEvent {
  id: string;
  event_type: string;
  page_url: string;
  user_id: string;
  timestamp: string;
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [userBehavior, setUserBehavior] = useState<UserBehaviorMetrics | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics | null>(null);
  const [abTests, setAbTests] = useState<ABTestResult[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    fetchAnalyticsData();

    // リアルタイムイベントを5秒ごとに更新
    const interval = setInterval(fetchRealtimeEvents, 5000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      // ユーザー行動分析
      const behaviorResponse = await fetch(
        `http://localhost:8000/api/analytics/user-behavior?period=${selectedPeriod}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const behaviorData = await behaviorResponse.json();
      if (behaviorData.success) {
        setUserBehavior(behaviorData.data);
      }

      // キャンペーンパフォーマンス
      const campaignResponse = await fetch(
        `http://localhost:8000/api/analytics/campaign-performance?period=${selectedPeriod}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const campaignData = await campaignResponse.json();
      if (campaignData.success) {
        setCampaignMetrics(campaignData.data);
      }

      // A/Bテスト結果
      const abTestsResponse = await fetch(
        `http://localhost:8000/api/analytics/ab-tests`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const abTestsData = await abTestsResponse.json();
      if (abTestsData.success) {
        setAbTests(abTestsData.data);
      }

      // リアルタイムイベント
      await fetchRealtimeEvents();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeEvents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        'http://localhost:8000/api/analytics/realtime-events',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setRealtimeEvents(data.data);
      }
    } catch (error) {
      console.error('Error fetching realtime events:', error);
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
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
              <Link href="/analytics" className="text-gray-900 font-medium">
                Analytics
              </Link>
              <Link href="/integrations" className="text-gray-600 hover:text-gray-900">
                Integrations
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
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
                Analytics Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Monitor user behavior, campaign performance, and A/B test results
              </p>
            </div>
          </div>

          {/* ユーザー行動分析 */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Page Views
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {userBehavior?.page_views.toLocaleString() || 0}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Unique Visitors
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {userBehavior?.unique_visitors.toLocaleString() || 0}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg. Session Duration
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {userBehavior?.avg_session_duration.toFixed(1) || 0}s
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Bounce Rate
                      </dt>
                      <dd className="flex items-baseline">
                        <div className={`text-2xl font-semibold ${getPercentageColor(userBehavior?.bounce_rate || 0)}`}>
                          {userBehavior?.bounce_rate.toFixed(1) || 0}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* キャンペーンパフォーマンス */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Campaign Performance
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Campaigns</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {campaignMetrics?.total_campaigns || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Messages Sent</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {campaignMetrics?.total_sent.toLocaleString() || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Open Rate</dt>
                  <dd className={`mt-1 text-3xl font-semibold ${getPercentageColor(campaignMetrics?.open_rate || 0)}`}>
                    {campaignMetrics?.open_rate.toFixed(1) || 0}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Click Rate</dt>
                  <dd className={`mt-1 text-3xl font-semibold ${getPercentageColor(campaignMetrics?.click_rate || 0)}`}>
                    {campaignMetrics?.click_rate.toFixed(1) || 0}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Conversion Rate</dt>
                  <dd className={`mt-1 text-3xl font-semibold ${getPercentageColor(campaignMetrics?.conversion_rate || 0)}`}>
                    {campaignMetrics?.conversion_rate.toFixed(1) || 0}%
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* A/Bテスト結果 */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  A/B Test Results
                </h3>
                <Link
                  href="/analytics/ab-tests"
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View All
                </Link>
              </div>

              {abTests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Test Name
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variant A
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variant B
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Winner
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Significance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {abTests.slice(0, 5).map((test) => (
                        <tr key={test.id}>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            {test.name}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {test.variant_a}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {test.variant_b}
                          </td>
                          <td className="px-3 py-4 text-sm font-medium text-gray-900">
                            {test.winner}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              test.statistical_significance >= 95
                                ? 'bg-green-100 text-green-800'
                                : test.statistical_significance >= 80
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {test.statistical_significance.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No A/B tests running</p>
              )}
            </div>
          </div>

          {/* リアルタイムイベント */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Real-time Events
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm text-gray-500">Live</span>
                </div>
              </div>

              {realtimeEvents.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {realtimeEvents.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.event_type === 'page_view' ? 'bg-blue-100 text-blue-800' :
                            event.event_type === 'click' ? 'bg-green-100 text-green-800' :
                            event.event_type === 'form_submit' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.event_type}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.page_url}
                          </p>
                          <p className="text-xs text-gray-500">
                            User: {event.user_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No real-time events yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
