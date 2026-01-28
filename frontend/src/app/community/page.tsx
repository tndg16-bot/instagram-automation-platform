'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CommunityForum() {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/community/topics', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTopics(data.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      setLoading(false);
    }
  };

  const fetchReplies = async (topicId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/community/topics/${topicId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setReplies(data.data.replies);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleTopicClick = (topic: any) => {
    setSelectedTopic(topic);
    fetchReplies(topic.id);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !selectedTopic) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/community/topics/${selectedTopic.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newReply }),
      });

      const data = await response.json();
      if (data.success) {
        setReplies([...replies, data.data]);
        setNewReply('');
      } else {
        alert(data.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to post reply');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicDescription.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/community/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTopicTitle,
          description: newTopicDescription,
          category: 'general',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTopics([...topics, data.data]);
        setNewTopicTitle('');
        setNewTopicDescription('');
        setShowNewTopicForm(false);
      } else {
        alert(data.error || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Failed to create topic');
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">InstaFlow AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/membership" className="text-gray-600 hover:text-gray-900">
                Membership
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
                Community Forum
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Connect with other members and share your experiences
              </p>
            </div>
            <button
              onClick={() => setShowNewTopicForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              New Topic
            </button>
          </div>

          {showNewTopicForm && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Create New Topic
                </h3>
                <form onSubmit={handleCreateTopic} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter topic title"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={newTopicDescription}
                      onChange={(e) => setNewTopicDescription(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter topic description"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewTopicForm(false)}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {!selectedTopic ? (
            <div className="mt-6 space-y-4">
              {topics.map((topic: any) => (
                <div
                  key={topic.id}
                  onClick={() => handleTopicClick(topic)}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center mb-2">
                    <div className="flex-shrink-0">
                      <img
                        src={topic.author_avatar || 'https://via.placeholder.com/150'}
                        alt={topic.author_name}
                        className="h-10 w-10 rounded-full"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{topic.author_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(topic.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2">{topic.description}</p>
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    <span>💬 {topic.reply_count} replies</span>
                    <span>👁 {topic.view_count} views</span>
                    <span>🏷️ {topic.category}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <button
                  onClick={() => {
                    setSelectedTopic(null);
                    setReplies([]);
                  }}
                  className="mb-4 text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to Topics
                </button>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedTopic.title}
                </h3>
                
                <div className="space-y-4">
                  {replies.map((reply: any) => (
                    <div key={reply.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-start space-x-3">
                        <img
                          src={reply.author_avatar || 'https://via.placeholder.com/150'}
                          alt={reply.author_name}
                          className="h-8 w-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">{reply.author_name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(reply.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-gray-700">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4">
                  <form onSubmit={handleSubmitReply} className="space-y-4">
                    <div>
                      <label htmlFor="reply" className="block text-sm font-medium text-gray-700">
                        Post a Reply
                      </label>
                      <textarea
                        id="reply"
                        rows={3}
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Write your reply..."
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Post Reply
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
