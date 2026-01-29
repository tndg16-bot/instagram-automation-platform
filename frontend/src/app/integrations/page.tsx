'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: 'analytics' | 'advertising' | 'social' | 'productivity';
  status: 'available' | 'connected' | 'configured';
  connected_at?: string;
  configuration: Record<string, any>;
}

interface IntegrationConfig {
  integration_id: string;
  api_key?: string;
  client_id?: string;
  client_secret?: string;
  account_id?: string;
  webhook_url?: string;
  settings: Record<string, any>;
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configData, setConfigData] = useState<Partial<IntegrationConfig>>({});
  const [configuring, setConfiguring] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/integrations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setLoading(false);
    }
  };

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConfigModal(true);
  };

  const handleConfigure = async () => {
    if (!selectedIntegration) return;

    try {
      setConfiguring(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:8000/api/integrations/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          integration_id: selectedIntegration.id,
          configuration: configData,
        }),
      });

      if (response.ok) {
        await fetchIntegrations();
        setShowConfigModal(false);
        setConfigData({});
        setSelectedIntegration(null);
        alert('Integration connected successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to connect integration');
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      alert('Failed to connect integration');
    } finally {
      setConfiguring(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setIntegrations(integrations.filter(i => i.id !== integrationId));
      }
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      alert('Failed to disconnect integration');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Connected</span>;
      case 'configured':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Configured</span>;
      case 'available':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Available</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analytics':
        return 'bg-blue-100 text-blue-800';
      case 'advertising':
        return 'bg-purple-100 text-purple-800';
      case 'social':
        return 'bg-green-100 text-green-800';
      case 'productivity':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

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
              <Link href="/integrations" className="text-gray-900 font-medium">
                Integrations
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
                Integration Marketplace
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Connect with external services to enhance your Instagram automation
              </p>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Available Integrations
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {integrations.length}
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Connected
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  {integrations.filter(i => i.status === 'connected').length}
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Configured
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                  {integrations.filter(i => i.status === 'configured').length}
                </dd>
              </div>
            </div>
          </div>

          {/* インテグレーション一覧 */}
          <div className="mt-8">
            {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {category} Integrations
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {integration.icon_url ? (
                              <img
                                src={integration.icon_url}
                                alt={integration.name}
                                className="h-12 w-12 rounded"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-semibold">
                                {integration.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">
                                {integration.name}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(integration.category)}`}>
                                {integration.category}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(integration.status)}
                        </div>
                        <p className="mt-4 text-sm text-gray-600">
                          {integration.description}
                        </p>
                        {integration.connected_at && (
                          <p className="mt-2 text-xs text-gray-500">
                            Connected: {new Date(integration.connected_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        {integration.status === 'connected' || integration.status === 'configured' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedIntegration(integration);
                                setConfigData(integration.configuration);
                                setShowConfigModal(true);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Configure
                            </button>
                            <button
                              onClick={() => handleDisconnect(integration.id)}
                              className="flex-1 px-3 py-2 border border-transparent rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(integration)}
                            className="w-full px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ヘルプセクション */}
          <div className="mt-12 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-indigo-900">
                  Need help with integrations?
                </h3>
                <p className="mt-1 text-sm text-indigo-700">
                  Our team can help you set up and configure your integrations. Contact support or check our documentation for detailed guides.
                </p>
                <div className="mt-4">
                  <a
                    href="/docs/integrations"
                    className="text-sm font-medium text-indigo-900 hover:text-indigo-700"
                  >
                    View Documentation →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 設定モーダル */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {selectedIntegration.icon_url ? (
                  <img
                    src={selectedIntegration.icon_url}
                    alt={selectedIntegration.name}
                    className="h-10 w-10 rounded"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-semibold">
                    {selectedIntegration.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Connect {selectedIntegration.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedIntegration.category} Integration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Enter your {selectedIntegration.name} credentials to connect your account.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={configData.api_key || ''}
                  onChange={(e) => setConfigData({ ...configData, api_key: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter your API key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID (optional)
                </label>
                <input
                  type="text"
                  value={configData.client_id || ''}
                  onChange={(e) => setConfigData({ ...configData, client_id: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter your client ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret (optional)
                </label>
                <input
                  type="password"
                  value={configData.client_secret || ''}
                  onChange={(e) => setConfigData({ ...configData, client_secret: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter your client secret"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account ID (optional)
                </label>
                <input
                  type="text"
                  value={configData.account_id || ''}
                  onChange={(e) => setConfigData({ ...configData, account_id: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter your account ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL (optional)
                </label>
                <input
                  type="url"
                  value={configData.webhook_url || ''}
                  onChange={(e) => setConfigData({ ...configData, webhook_url: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://yourdomain.com/webhook"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setConfigData({});
                  setSelectedIntegration(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfigure}
                disabled={configuring}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {configuring ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
