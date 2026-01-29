'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InstagramAccount {
  id: string;
  instagram_user_id: string;
  username: string;
  profile_pic_url: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_active: boolean;
  sync_status: 'syncing' | 'synced' | 'error' | 'pending';
  last_synced_at: string | null;
  created_at: string;
}

interface BulkOperation {
  id: string;
  type: 'dm_send' | 'comment_reply' | 'follow' | 'unfollow' | 'like';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  accounts_count: number;
  started_at: string;
  completed_at: string | null;
}

export default function MultiAccountPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAccounts();
    fetchBulkOperations();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/multi-account/accounts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setLoading(false);
    }
  };

  const fetchBulkOperations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/multi-account/bulk-operations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBulkOperations(data.data);
      }
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      setSyncing(prev => new Set([...prev, accountId]));
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:8000/api/multi-account/accounts/${accountId}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Error syncing account:', error);
    } finally {
      setSyncing(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };

  const handleSyncAll = async () => {
    for (const account of accounts) {
      await handleSyncAccount(account.id);
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/multi-account/accounts/${accountId}/switch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Account switched successfully!');
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Error switching account:', error);
      alert('Failed to switch account');
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this account?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/multi-account/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setAccounts(accounts.filter(acc => acc.id !== accountId));
      }
    } catch (error) {
      console.error('Error removing account:', error);
      alert('Failed to remove account');
    }
  };

  const handleBulkOperation = async (operationType: string) => {
    if (selectedAccounts.size === 0) {
      alert('Please select at least one account');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/multi-account/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: operationType,
          account_ids: Array.from(selectedAccounts),
        }),
      });

      if (response.ok) {
        alert('Bulk operation started!');
        await fetchBulkOperations();
        setSelectedAccounts(new Set());
      }
    } catch (error) {
      console.error('Error starting bulk operation:', error);
      alert('Failed to start bulk operation');
    }
  };

  const getSyncStatusBadge = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Synced</span>;
      case 'syncing':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Syncing</span>;
      case 'error':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{syncStatus}</span>;
    }
  };

  const getOperationStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'processing':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Processing</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
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
              <Link href="/multi-account" className="text-gray-900 font-medium">
                Multi-Account
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
                Multi-Account Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage and switch between multiple Instagram accounts
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <button
                onClick={handleSyncAll}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sync All
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Account
              </button>
            </div>
          </div>

          {/* バルク操作パネル */}
          {selectedAccounts.size > 0 && (
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-indigo-900">
                    {selectedAccounts.size} account{selectedAccounts.size > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkOperation('dm_send')}
                    className="px-3 py-1 border border-indigo-300 rounded text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    Send DM
                  </button>
                  <button
                    onClick={() => handleBulkOperation('like')}
                    className="px-3 py-1 border border-indigo-300 rounded text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    Bulk Like
                  </button>
                  <button
                    onClick={() => handleBulkOperation('follow')}
                    className="px-3 py-1 border border-indigo-300 rounded text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    Bulk Follow
                  </button>
                  <button
                    onClick={() => setSelectedAccounts(new Set())}
                    className="px-3 py-1 text-sm font-medium text-indigo-700 hover:text-indigo-900"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* アカウント一覧 */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Connected Accounts ({accounts.length})
              </h3>

              {accounts.length > 0 ? (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        account.is_active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.has(account.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedAccounts);
                              if (e.target.checked) {
                                newSelected.add(account.id);
                              } else {
                                newSelected.delete(account.id);
                              }
                              setSelectedAccounts(newSelected);
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <img
                            src={account.profile_pic_url || '/placeholder-avatar.png'}
                            alt={account.username}
                            className="h-12 w-12 rounded-full"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-base font-semibold text-gray-900">
                                {account.username}
                              </h4>
                              {account.is_active && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                              <span>{account.followers_count.toLocaleString()} followers</span>
                              <span>{account.following_count.toLocaleString()} following</span>
                              <span>{account.posts_count.toLocaleString()} posts</span>
                            </div>
                            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                              {getSyncStatusBadge(account.sync_status)}
                              {account.last_synced_at && (
                                <span>
                                  Last synced: {new Date(account.last_synced_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!account.is_active && (
                            <button
                              onClick={() => handleSwitchAccount(account.id)}
                              className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-900"
                            >
                              Switch
                            </button>
                          )}
                          <button
                            onClick={() => handleSyncAccount(account.id)}
                            disabled={syncing.has(account.id)}
                            className={`px-3 py-1 text-sm font-medium rounded ${
                              syncing.has(account.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {syncing.has(account.id) ? 'Syncing...' : 'Sync'}
                          </button>
                          <button
                            onClick={() => handleRemoveAccount(account.id)}
                            className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts connected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first Instagram account
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Add Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* バルク操作履歴 */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Bulk Operations History
              </h3>

              {bulkOperations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Accounts
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Started
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completed
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {bulkOperations.slice(0, 5).map((operation) => (
                        <tr key={operation.id}>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            {operation.type.replace('_', ' ').toUpperCase()}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            {getOperationStatusBadge(operation.status)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-900">
                            {operation.accounts_count}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {new Date(operation.started_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {operation.completed_at ? new Date(operation.completed_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No bulk operations yet</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* アカウント追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Instagram Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Connect a new Instagram account to manage it alongside your existing accounts.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.location.href = '/auth/instagram/callback';
                }}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
