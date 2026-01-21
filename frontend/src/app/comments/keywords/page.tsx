'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface KeywordRule {
  id: string;
  keyword: string;
  is_active: boolean;
}

export default function KeywordsPage() {
  const [rules, setRules] = useState<KeywordRule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<KeywordRule | null>(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/comments/keywords', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Error fetching keyword rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/comments/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword }),
      });

      const data = await response.json();
      if (data.success) {
        setRules([...rules, data.data]);
        setKeyword('');
        setShowCreateModal(false);
      } else {
        alert(data.error || 'Failed to create keyword rule');
      }
    } catch (error) {
      console.error('Error creating keyword rule:', error);
    }
  };

  const handleUpdateRule = async (ruleId: string, newKeyword: string, newStatus?: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/comments/keywords/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          keyword: newKeyword,
          is_active: newStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRules(rules.map((r) => (r.id === ruleId ? { ...r, ...data.rule } : r)));
      } else {
        alert(data.error || 'Failed to update keyword rule');
      }
    } catch (error) {
      console.error('Error updating keyword rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this keyword rule?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/comments/keywords/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setRules(rules.filter((r) => r.id !== ruleId));
      } else {
        alert(data.error || 'Failed to delete keyword rule');
      }
    } catch (error) {
      console.error('Error deleting keyword rule:', error);
    }
  };

  const openEditModal = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      setEditingRule(rule);
      setKeyword(rule.keyword);
      setShowCreateModal(true);
    }
  };

  const closeEditModal = () => {
    setEditingRule(null);
    setShowCreateModal(false);
    setKeyword('');
  };

  const handleUpdateModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRule) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/comments/keywords/${editingRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword }),
      });

      const data = await response.json();
      if (data.success) {
        setRules(rules.map((r) => (r.id === editingRule.id ? { ...r, keyword } : r)));
        closeEditModal();
        alert('Keyword rule updated successfully!');
      } else {
        alert(data.error || 'Failed to update keyword rule');
      }
    } catch (error) {
      console.error('Error updating keyword rule:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900">
              Keyword Rules
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure keywords to trigger automatic replies
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Keyword
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                When a comment contains one of these keywords, an automatic reply will be sent using the configured template.
              </p>
            </div>
          </div>
        </div>

        {/* Rules List */}
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          {rules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No keyword rules yet. Add your first keyword!
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, index) => (
                  <tr key={rule.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-mono text-sm ${!rule.is_active ? 'text-gray-400' : 'text-gray-900'}`}>
                        {rule.keyword}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(rule.id)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleUpdateRule(rule.id, rule.keyword, !rule.is_active)}
                          className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                          {rule.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && !editingRule && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Keyword Rule
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRule}>
              <div>
                <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword
                </label>
                <input
                  type="text"
                  id="keyword"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g., 価格, 値段, price"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  This keyword will trigger automatic replies when found in comments.
                </p>
              </div>
              <div className="flex items-center justify-end space-x-4 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 border border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Keyword
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showCreateModal && editingRule && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Keyword Rule
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateModalSubmit}>
              <div>
                <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword
                </label>
                <input
                  type="text"
                  id="keyword"
                  required
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end space-x-4 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 border border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
