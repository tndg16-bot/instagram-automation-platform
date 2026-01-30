'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [webhookData, setWebhookData] = useState({
    name: '',
    type: 'instagram',
    url: '',
    events: ['post', 'comment', 'follow'],
    active: true,
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:8000/api/webhooks', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setWebhooks(data.data);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookData.name || !webhookData.url || !webhookData.events.length) {
      alert('Name, URL, and at least one event are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:8000/api/webhooks', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(webhookData),
      });

      const data = await response.json();
      if (data.success) {
        setWebhooks([...webhooks, { ...data.data }]);
        setShowCreateModal(false);
        setWebhookData({
          name: '',
          type: 'instagram',
          url: '',
          events: ['post', 'comment', 'follow'],
          active: true,
        });
        alert('Webhook created successfully!');
      } else {
        alert(data.error || 'Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Failed to create webhook');
    }
  };

  const handleToggleWebhook = async (webhookId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:8000/api/webhooks/${webhookId}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ active: currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setWebhooks(webhooks.map((w: any) =>
          w.id === webhookId ? { ...w, active: currentStatus } : w
        ));
      }
    } catch (error) {
      console.error('Error toggling webhook:', error);
      alert('Failed to toggle webhook');
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:8000/api/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'language': 'ja',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Test payload sent!');
      } else {
        alert(data.error || 'Failed to test webhook');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      alert('Failed to test webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:8000/api/webhooks/${webhook}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setWebhooks(webhooks.filter((w: any) => w.id !== webhookId));
        setSelectedWebhook(null);
        alert('Webhook deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete webhook');
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  const handleViewLogs = (webhookId: string) => () => {
    setSelectedWebhook(webhooks.find((w: any) => w.id === webhookId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">InstaFlow AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/newsletter" className="text-gray-600 hover:text-gray-900">
                Newsletter
              </Link>
              <Link href="/membership" className="text-gray-600 hover:text-gray-900">
                Membership
              </Link>
              <Link href="/community" className="text-gray-600 hover:text-gray-900">
                Community
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Webhooks Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure external integrations and notifications
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create New Webhook
            </button>
          </div>

          {/* Webhooks List */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Active Webhooks
            </h3>

            {webhooks.length > 0 ? (
              <div className="space-y-4">
                {webhooks.map((webhook: any) => (
                  <div
                    key={webhook.id}
                    className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 truncate">{webhook.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            webhook.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {webhook.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{webhook.events.join(', ')}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleWebhook(webhook.id, !webhook.active)}
                          className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            webhook.active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {webhook.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleViewLogs(webhook.id)}
                          className="inline-flex items-center px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View Logs
                        </button>
                        <button
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            handleTestWebhook(webhook.id);
                          }}
                          className="inline-flex items-center px-3 py-1 rounded-md border-gray-300 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className="inline-flex items-center px-3 py-1 rounded-md border-gray-300 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">URL:</span>
                      <span className="ml-2">{webhook.url}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{formatDate(webhook.created_at)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Total Triggers:</span>
                      <span className="ml-2">{webhook.total_triggers}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Success Rate:</span>
                      <span className="ml-2">
                        {webhook.total_triggers > 0
                          ? `${Math.round((webhook.success_count / webhook.total_triggers) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <p className="text-gray-500">No webhooks configured yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create First Webhook
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Create New Webhook</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateWebhook} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Webhook Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={webhookData.name}
                    onChange={(e) => setWebhookData({...webhookData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Instagram Comment Webhook"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Webhook Type
                  </label>
                  <select
                    id="type"
                    value={webhookData.type}
                    onChange={(e) => setWebhookData({...webhookData, type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="instagram">Instagram (Posts, Comments, Follows)</option>
                    <option value="newsletter">Newsletter (Campaigns, Sends)</option>
                    <option value="analytics">Analytics (Stats, Reports)</option>
                    <option value="automation">Automation (Workflows)</option>
                    <option value="custom">Custom (Generic)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    Webhook URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={webhookData.url}
                    onChange={(e) => setWebhookData({...webhookData, url: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://your-webhook-url.com/webhook"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Events <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {webhookData.type === 'instagram' && (
                      <>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={webhookData.events.includes('post')}
                            onChange={(e) => setWebhookData({...webhookData, events: e.target.checked 
                              ? [...webhookData.events, 'post']
                              : webhookData.events.filter((ev: string) => ev !== 'post')
                            })}
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700 ml-2">Post</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={webhookData.events.includes('comment')}
                            onChange={(e) => setWebhookData({...webhookData, events: e.target.checked 
                              ? [...webhookData.events, 'comment']
                              : webhookData.events.filter((ev: string) => ev !== 'comment')
                            })}
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700 ml-2">Comment</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={webhookEvents.includes('follow')}
                            onChange={(e) => setWebhookData({...webhookData, events: e.target.checked 
                              ? [...webhookData.events, 'follow']
                              : webhookData.events.filter((ev: string) => ev !== 'follow')
                            })}
                            className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700 ml-2">Follow</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                  >
                    Create Webhook
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Details Modal */}
      {selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedWebhook.name}
                </h3>
                <button
                  onClick={() => setSelectedWebhook(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Type:</span>
                  <span className="ml-2">{selectedWebhook.type}</span>
                </p>

                <p className="text-gray-700 mb-2">
                  <span className="font-medium">URL:</span>
                  <span className="ml-2">
                    <a
                      href={selectedWebhook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900 underline"
                    >
                      {selectedWebhook.url}
                    </a>
                  </span>
                </p>

                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Events:</span>
                  <span className="ml-2">{selectedWebhook.events.join(', ')}</span>
                </p>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    Settings
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="ml-2 font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedWebhook.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedWebhook.active ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="ml-2 font-medium">{formatDate(selectedWebhook.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Triggers:</span>
                      <span className="ml-2 font-medium">{selectedWebhook.total_triggers}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Success Rate:</span>
                      <span className="ml-2">
                        {selectedWebhook.total_triggers > 0
                          ? `${Math.round((selectedWebhook.success_count / selectedWebhook.total_triggers) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Failure Rate:</span>
                      <span className="ml-2">
                        {selectedWebhook.total_triggers > 0
                          ? `${Math.round((selectedWebhook.failure_count / selectedWebhook.total_triggers) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4 space-y-2">
                  <h4 className="base font-medium text-gray-900 mb-2">
                    Actions
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTestWebhook(selectedWebhook.id)}
                      className="flex-1 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-700"
                    >
                      Test Webhook
                    </button>
                    <button
                      onClick={() => handleToggleWebhook(selectedWebhook.id, !selectedWebhook.active)}
                      className="flex-1 inline-flex items-center px-4 py-2 border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {selectedWebhook.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWebhook(null);
                      handleDeleteWebhook(selectedWebhook.id);
                    }}
                    className="flex-1 inline-flex items-center px-4 py-2 border-gray-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete Webhook
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-base font-medium text-gray-900 mb-2">
                  Recent Logs (Last 20)
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-600">2026-01-28 14:30:00</span>
                      <span className="text-sm textgray-400">sent</span>
                    </div>
                  <span className="text-xs text-gray-400">200 OK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">2026-01-28 14:25:00</span>
                    <span className="text-sm text-gray-400">opened</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">2026-01-28 14:20:00</span>
                    <span className="text-sm text-gray-400">clicked</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">2026-01-28 14:15:00</span>
                    <span className="text-sm text-gray-400">failed</span>
                  </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">2026-01-28 14:20:00</span>
                      <span className="text-sm text-gray-400">clicked</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">2026-01-28 14:15:00</span>
                    <span className="text-sm text-gray-400">failed</span>
                  </div>
                </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
