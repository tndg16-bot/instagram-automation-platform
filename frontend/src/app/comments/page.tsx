'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
  media_id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  status: 'pending' | 'replied' | 'ignored';
  replied_at?: Date;
  reply_message_id?: string;
}

interface ReplyTemplate {
  id: string;
  template_name: string;
  content: string;
  is_active: boolean;
}

interface KeywordRule {
  id: string;
  keyword: string;
  is_active: boolean;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [keywordRules, setKeywordRules] = useState<KeywordRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied' | 'ignored'>('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    replied: 0,
    ignored: 0,
    recent_replies: 0,
  });

  useEffect(() => {
    fetchComments();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/comments/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/comments?status=' + filter + '&limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      alert('Please enter a reply message');
      return;
    }

    if (!selectedComment) {
      alert('No comment selected');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/comments/${selectedComment.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyMessage }),
      });

      const data = await response.json();
      if (data.success) {
        setShowReplyModal(false);
        setReplyMessage('');
        fetchComments();
        alert('Reply sent successfully!');
      } else {
        alert(data.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    }
  };

  const handleUpdateCommentStatus = async (commentId: string, newStatus: 'pending' | 'replied' | 'ignored') => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchComments();
        alert('Status updated successfully!');
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating comment status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'ignored':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ja-JP');
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
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                InstaFlow AI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dm" className="text-gray-600 hover:text-gray-900">
                DM
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">Comments</h1>
            </div>
            <Link
              href="/comments/templates"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage Templates
            </Link>
          </div>

          {/* Statistics Cards */}
          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Replied</p>
                  <p className="text-2xl font-bold text-green-600">{stats.replied || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ignored</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.ignored || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recent (24h)</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.recent_replies || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px-4 flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setFilter('all')}
                className={`${
                  filter === 'all'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } px-1 py-4 border-b-2 border-transparent hover:border-gray-300 font-medium text-sm`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`${
                  filter === 'pending'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } px-1 py-4 border-b-2 border-transparent hover:border-gray-300 font-medium text-sm`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('replied')}
                className={`${
                  filter === 'replied'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } px-1 py-4 border-b-2 border-transparent hover:border-gray-300 font-medium text-sm`}
              >
                Replied
              </button>
              <button
                onClick={() => setFilter('ignored')}
                className={`${
                  filter === 'ignored'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } px-1 py-4 border-b-2 border-transparent hover:border-gray-300 font-medium text-sm`}
              >
                Ignored
              </button>
            </nav>
          </div>

          {/* Comments List */}
          <div className="divide-y divide-gray-200">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No comments yet. Connect your Instagram account to start monitoring.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                          {comment.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{comment.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(comment.timestamp)}
                          </p>
                          {comment.media_id && (
                            <span className="text-xs text-blue-600 hover:underline">
                              <Link
                                href={`https://instagram.com/p/${comment.media_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600"
                              >
                                Media
                              </Link>
                            </span>
                          )}
                          {comment.status !== 'pending' && comment.status !== 'replied' && (
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(comment.status)}`}>
                              {comment.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex space-x-2">
                      {comment.status === 'pending' && (
                        <button
                          onClick={() => { setShowReplyModal(true); setSelectedComment(comment); setReplyMessage(''); }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Reply
                        </button>
                      )}
                      {comment.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateCommentStatus(comment.id, 'ignored')}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Ignore
                        </button>
                      )}
                      {comment.status !== 'pending' && (
                        <button
                          onClick={() => { setShowReplyModal(true); setSelectedComment(comment); setReplyMessage(''); }}
                          disabled={comment.status === 'ignored'}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 cursor-not-allowed"
                        >
                          Reply Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Reply Modal */}
      {showReplyModal && selectedComment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Reply to Comment
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Comment:</span>
                </p>
                <div className="bg-gray-100 rounded-md p-3 mb-4">
                  <p className="text-sm text-gray-900">{selectedComment.text}</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedComment.timestamp)}</p>
                  <p className="text-xs text-blue-600">@{selectedComment.username}</p>
                </div>

                {/* Template Selection */}
                <div className="mb-3">
                  <label htmlFor="templateSelect" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Template (optional)
                  </label>
                  <select
                    id="templateSelect"
                    value=""
                    onChange={(e) => {
                      const templateId = e.target.value;
                      if (templateId) {
                        const template = templates.find((t) => t.id === templateId);
                        if (template) {
                          setReplyMessage(template.content);
                        }
                      }
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">-- Select a template --</option>
                    {templates
                      .filter((t) => t.is_active)
                      .map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.template_name}
                        </option>
                      ))}
                  </select>
                </div>

                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter your reply..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-600 focus:border-indigo-500 sm:text-sm sm:leading-6"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2 border border-transparent rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
