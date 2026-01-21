'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScheduledPost {
  id: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_urls: any;
  caption: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface PostTemplate {
  id: string;
  template_name: string;
  caption: string | null;
  media_urls: any;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'>('IMAGE');
  const [mediaUrls, setMediaUrls] = useState<string[]>(['']);
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'templates'>('posts');

  useEffect(() => {
    fetchPosts();
    fetchTemplates();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/posts/templates', {
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          instagram_account_id: localStorage.getItem('selectedAccountId'),
          media_type: mediaType,
          media_urls: mediaUrls.filter((url) => url.trim() !== ''),
          caption: caption,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (scheduledAt) {
          await schedulePost(data.data.id, scheduledAt);
        }
        fetchPosts();
        setShowCreateModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const schedulePost = async (postId: string, scheduledAt: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/posts/${postId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ scheduled_at: scheduledAt }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Failed to schedule post');
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
    }
  };

  const handlePublishPost = async (postId: string) => {
    if (!confirm('Publish this post now?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/posts/${postId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert('Post published successfully!');
        fetchPosts();
      } else {
        alert(data.error || 'Failed to publish post');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert(data.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/posts/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_name: `Template ${templates.length + 1}`,
          caption: caption,
          media_urls: mediaUrls.filter((url) => url.trim() !== ''),
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTemplates();
        alert('Template created successfully!');
      } else {
        alert(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const addMediaUrlField = () => {
    setMediaUrls([...mediaUrls, '']);
  };

  const removeMediaUrlField = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const updateMediaUrl = (index: number, value: string) => {
    const newMediaUrls = [...mediaUrls];
    newMediaUrls[index] = value;
    setMediaUrls(newMediaUrls);
  };

  const resetForm = () => {
    setMediaType('IMAGE');
    setMediaUrls(['']);
    setCaption('');
    setScheduledAt('');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      publishing: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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
              <Link href="/dm" className="text-gray-600 hover:text-gray-900">
                DM
              </Link>
              <Link href="/comments" className="text-gray-600 hover:text-gray-900">
                Comments
              </Link>
              <Link href="/posts" className="text-gray-600 hover:text-gray-900">
                Posts
              </Link>
              <Link href="/analytics" className="text-gray-600 hover:text-gray-900">
                Analytics
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
              Post Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create, schedule, and publish Instagram posts
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Post
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`${
                  activeTab === 'posts'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Posts ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`${
                  activeTab === 'templates'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Templates ({templates.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No posts yet. Create your first post!
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Caption
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, index) => (
                    <tr key={post.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {post.media_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {post.caption || '(No caption)'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(post.status)}`}>
                          {post.status}
                        </span>
                        {post.error_message && (
                          <div className="text-xs text-red-600 mt-1">{post.error_message}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString('ja-JP') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {post.status === 'draft' && (
                            <button
                              onClick={() => handlePublishPost(post.id)}
                              className="text-green-600 hover:text-green-900 text-sm"
                            >
                              Publish
                            </button>
                          )}
                          {post.status === 'draft' && (
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setShowCreateModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 text-sm"
                            >
                              Schedule
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePost(post.id)}
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
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            {templates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No templates yet. Create your first template!
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Caption
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Media Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template, index) => (
                    <tr key={template.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          {template.template_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-md truncate">
                          {template.caption || '(No caption)'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-900 font-medium">
                          {template.media_urls?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (confirm('Delete this template?')) {
                              fetch(`http://localhost:8000/api/posts/templates/${template.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
                              }).then(fetchTemplates);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-4 p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPost ? 'Schedule Post' : 'Create New Post'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPost(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media Type
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="CAROUSEL_ALBUM">Carousel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media URLs
                  </label>
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => updateMediaUrl(index, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {mediaUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMediaUrlField(index)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {mediaType === 'CAROUSEL_ALBUM' && mediaUrls.length < 10 && (
                    <button
                      type="button"
                      onClick={addMediaUrlField}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      + Add Media URL
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                    Caption
                  </label>
                  <textarea
                    id="caption"
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption here..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {!editingPost && (
                  <div>
                    <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule (optional)
                    </label>
                    <input
                      type="datetime-local"
                      id="scheduledAt"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPost(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                {activeTab === 'templates' ? (
                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    className="px-4 py-2 border border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save as Template
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 border border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {scheduledAt || editingPost ? 'Schedule Post' : 'Create Draft'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
