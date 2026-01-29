'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FunnelStep {
  step_name: string;
  step_order: number;
  users_count: number;
  conversion_rate: number;
  drop_off_rate: number;
  avg_time_on_step: number;
}

interface ConversionEvent {
  id: string;
  event_name: string;
  user_id: string;
  session_id: string;
  page_url: string;
  timestamp: string;
  properties: Record<string, any>;
}

interface FunnelMetrics {
  total_users: number;
  overall_conversion_rate: number;
  total_conversions: number;
  avg_completion_time: number;
  best_converting_step: string;
  worst_converting_step: string;
}

export default function UserJourneyFunnelPage() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [conversionEvents, setConversionEvents] = useState<ConversionEvent[]>([]);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);

  useEffect(() => {
    fetchFunnelData();
  }, [selectedPeriod]);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      // ファネルステップデータ
      const funnelResponse = await fetch(
        `http://localhost:8000/api/analytics/funnel?period=${selectedPeriod}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const funnelData = await funnelResponse.json();
      if (funnelData.success) {
        setFunnelSteps(funnelData.data.steps);
        setFunnelMetrics(funnelData.data.metrics);
      }

      // コンバージョンイベント
      const eventsResponse = await fetch(
        `http://localhost:8000/api/analytics/conversion-events?period=${selectedPeriod}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const eventsData = await eventsResponse.json();
      if (eventsData.success) {
        setConversionEvents(eventsData.data);
      }
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepColor = (index: number, total: number) => {
    const colors = [
      'bg-blue-500',
      'bg-blue-400',
      'bg-blue-300',
      'bg-blue-200',
      'bg-blue-100',
    ];
    return colors[index % colors.length];
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 50) return 'text-green-600';
    if (rate >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateDropOff = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((previous - current) / previous) * 100;
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
              <Link href="/journey" className="text-gray-900 font-medium">
                User Journey
              </Link>
              <Link href="/analytics" className="text-gray-600 hover:text-gray-900">
                Analytics
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
                User Journey Funnel
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Analyze user behavior from awareness to conversion
              </p>
            </div>
          </div>

          {/* ファネルメトリクス */}
          {funnelMetrics && (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {funnelMetrics.total_users.toLocaleString()}
                  </dd>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overall Conversion
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {funnelMetrics.overall_conversion_rate.toFixed(1)}%
                  </dd>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Conversions
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-600">
                    {funnelMetrics.total_conversions.toLocaleString()}
                  </dd>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg. Completion Time
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {funnelMetrics.avg_completion_time.toFixed(0)}s
                  </dd>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Best Step
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-green-600 truncate">
                    {funnelMetrics.best_converting_step}
                  </dd>
                </div>
              </div>
            </div>
          )}

          {/* ファネルビジュアライゼーション */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Conversion Funnel
            </h3>

            {funnelSteps.length > 0 ? (
              <div className="space-y-4">
                {funnelSteps.map((step, index) => {
                  const previousCount = index > 0 ? funnelSteps[index - 1].users_count : funnelSteps[0].users_count;
                  const dropOff = calculateDropOff(step.users_count, previousCount);
                  const maxWidth = funnelSteps[0].users_count;
                  const stepWidth = (step.users_count / maxWidth) * 100;

                  return (
                    <div key={step.step_order} className="flex items-center">
                      <div className="w-48 flex-shrink-0">
                        <div className="text-sm font-medium text-gray-900">
                          {step.step_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.users_count.toLocaleString()} users
                        </div>
                      </div>

                      <div className="flex-1 mx-4">
                        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className={`absolute top-0 left-0 h-full ${getStepColor(index, funnelSteps.length)} rounded-lg transition-all duration-500`}
                            style={{ width: `${stepWidth}%` }}
                          />
                          <div className="absolute top-0 left-0 w-full h-full flex items-center px-4">
                            <div className="flex justify-between w-full">
                              <span className="text-sm font-medium text-white">
                                {step.conversion_rate.toFixed(1)}%
                              </span>
                              {dropOff > 0 && (
                                <span className="text-xs text-red-700">
                                  -{dropOff.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-40 flex-shrink-0 text-right">
                        <div className={`text-sm font-semibold ${getConversionColor(step.conversion_rate)}`}>
                          {step.conversion_rate.toFixed(1)}% conv.
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.avg_time_on_step.toFixed(0)}s avg
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No funnel data available yet</p>
              </div>
            )}
          </div>

          {/* ファネルステップ詳細 */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Funnel Step Details
              </h3>

              {funnelSteps.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Conversion Rate
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Drop-off Rate
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {funnelSteps.map((step) => (
                        <tr key={step.step_order}>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            {step.step_name}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            {step.users_count.toLocaleString()}
                          </td>
                          <td className={`px-3 py-4 text-sm font-medium ${getConversionColor(step.conversion_rate)}`}>
                            {step.conversion_rate.toFixed(1)}%
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            {step.drop_off_rate.toFixed(1)}%
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            {step.avg_time_on_step.toFixed(1)}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No funnel steps data available</p>
              )}
            </div>
          </div>

          {/* コンバージョンイベント */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Conversions
              </h3>

              {conversionEvents.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {conversionEvents.slice(0, 20).map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {event.event_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Converted
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {event.page_url}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          User: {event.user_id} • Session: {event.session_id}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No conversions yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Conversions will appear here when users complete your funnel
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* インサイトと推奨事項 */}
          <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-indigo-900">
                  Insights & Recommendations
                </h3>
                <div className="mt-4 space-y-3">
                  {funnelMetrics?.overall_conversion_rate && funnelMetrics.overall_conversion_rate < 20 && (
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-500">⚠️</span>
                      <div>
                        <p className="text-sm font-medium text-indigo-900">Low conversion rate detected</p>
                        <p className="text-sm text-indigo-700">
                          Consider optimizing your funnel. Review the worst performing steps and improve user experience.
                        </p>
                      </div>
                    </div>
                  )}
                  {funnelMetrics?.overall_conversion_rate && funnelMetrics.overall_conversion_rate >= 30 && (
                    <div className="flex items-start space-x-2">
                      <span className="text-green-500">✓</span>
                      <div>
                        <p className="text-sm font-medium text-indigo-900">Good conversion performance</p>
                        <p className="text-sm text-indigo-700">
                          Your funnel is performing well. Consider A/B testing to further optimize conversion rates.
                        </p>
                      </div>
                    </div>
                  )}
                  {funnelSteps.length > 0 && funnelSteps[0].conversion_rate > 80 && funnelSteps[funnelSteps.length - 1].conversion_rate < 20 && (
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-500">💡</span>
                      <div>
                        <p className="text-sm font-medium text-indigo-900">High drop-off in middle of funnel</p>
                        <p className="text-sm text-indigo-700">
                          Users are engaging initially but dropping off. Review content and UX in the middle steps.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
