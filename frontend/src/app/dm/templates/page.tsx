'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DMTemplate {
  id: string;
  user_id: string;
  name: string;
  message: string;
  message_type: string;
  media_url?: string;
  category?: string;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function DMTemplatesPage() {
  const [templates, setTemplates] = useState<DMTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DMTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');
  const [templateMediaType, setTemplateMediaType] = useState('TEXT');
  const [templateMediaUrl, setTemplateMediaUrl] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/dm/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/dm/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: templateName,
          message: templateMessage,
          message_type: templateMediaType,
          media_url: templateMediaUrl || undefined,
          category: templateCategory || undefined,
          tags: templateTags ? templateTags.split(',').map(tag => tag.trim()) : [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTemplates([...templates, data.template]);
        setTemplateName('');
        setTemplateMessage('');
        setTemplateMediaType('TEXT');
        setTemplateMediaUrl('');
        setTemplateCategory('');
        setTemplateTags('');
        setShowCreateModal(false);
      } else {
        alert(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateTemplate = async (templateId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/dm/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: templateName,
          message: templateMessage,
          message_type: templateMediaType,
          media_url: templateMediaUrl || undefined,
          category: templateCategory || undefined,
          tags: templateTags ? templateTags.split(',').map(tag => tag.trim()) : [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTemplates(templates.map((t) => (t.id === templateId ? data.template : t)));
        setEditingTemplate(null);
        setShowCreateModal(false);
        setTemplateName('');
        setTemplateMessage('');
        setTemplateMediaType('TEXT');
        setTemplateMediaUrl('');
        setTemplateCategory('');
        setTemplateTags('');
        alert('Template updated successfully!');
      } else {
        alert(data.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/dm/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTemplates(templates.filter((t) => t.id !== templateId));
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const openEditModal = (template: DMTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateMessage(template.message);
    setTemplateMediaType(template.message_type);
    setTemplateMediaUrl(template.media_url || '');
    setTemplateCategory(template.category || '');
    setTemplateTags(template.tags.join(', '));
    setShowCreateModal(true);
  };

  const closeEditModal = () => {
    setEditingTemplate(null);
    setShowCreateModal(false);
    setTemplateName('');
    setTemplateMessage('');
    setTemplateMediaType('TEXT');
    setTemplateMediaUrl('');
    setTemplateCategory('');
    setTemplateTags('');
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
                DM Broadcasts
              </Link>
              <Link href="/dm/templates" className="text-gray-600 hover:text-gray-900">
                Templates
              </Link>
              <Link href="/segments" className="text-gray-600 hover:text-gray-900">
                Segments
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
              DM Templates
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your DM message templates for faster campaign creation
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Template
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="mt-6">
          {templates.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500">No templates yet. Create your first template!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div key={template.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {template.name}
                      </h3>
                      {template.category && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {template.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.message}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <span className="mr-3">📤 {template.usage_count}</span>
                        <span className="mr-3">📄 {template.message_type}</span>
                        {template.media_url && <span>🖼️</span>}
                      </div>
                    </div>
                    {template.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {template.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(template.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(template)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={editingTemplate ? (e) => { e.preventDefault(); handleUpdateTemplate(editingTemplate.id); } : handleCreateTemplate}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      id="templateName"
                      required
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="templateMessage" className="block text-sm font-medium text-gray-700">
                      Message *
                    </label>
                    <textarea
                      id="templateMessage"
                      required
                      rows={6}
                      value={templateMessage}
                      onChange={(e) => setTemplateMessage(e.target.value)}
                      placeholder="Enter your message here... Use {username} for personalization"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="templateMediaType" className="block text-sm font-medium text-gray-700">
                      Message Type
                    </label>
                    <select
                      id="templateMediaType"
                      value={templateMediaType}
                      onChange={(e) => setTemplateMediaType(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="TEXT">Text Only</option>
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                      <option value="MEDIA">Media</option>
                    </select>
                  </div>

                  {templateMediaType !== 'TEXT' && (
                    <div>
                      <label htmlFor="templateMediaUrl" className="block text-sm font-medium text-gray-700">
                        Media URL
                      </label>
                      <input
                        type="url"
                        id="templateMediaUrl"
                        value={templateMediaUrl}
                        onChange={(e) => setTemplateMediaUrl(e.target.value)}
                        placeholder="https://example.com/media.jpg"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="templateCategory" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <input
                      type="text"
                      id="templateCategory"
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      placeholder="e.g., Welcome, Sales, Updates"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="templateTags" className="block text-sm font-medium text-gray-700">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      id="templateTags"
                      value={templateTags}
                      onChange={(e) => setTemplateTags(e.target.value)}
                      placeholder="e.g., welcome, sales, promotion"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {editingTemplate ? 'Save Changes' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
