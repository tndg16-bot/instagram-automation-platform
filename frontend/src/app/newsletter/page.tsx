'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NewsletterPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    description: '',
    content_template_id: '',
    target_audience: {
      tags: [],
      custom_segments: [],
    },
  });

  useEffect(() => {
    fetchNewsletterData();
  }, []);

  const fetchNewsletterData = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch campaigns, templates, subscribers in parallel
      const [campaignsRes, templatesRes, subscribersRes] = await Promise.all([
        fetch('http://localhost:8000/api/newsletter/campaigns', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:8000/api/newsletter/templates', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:8000/api/newsletter/subscribers?page=1&limit=20', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const campaignsData = await campaignsRes.json();
      const templatesData = await templatesRes.json();
      const subscribersData = await subscribersRes.json();

      if (campaignsData.success) {
        setCampaigns(campaignsData.data);
      }
      if (templatesData.success) {
        setTemplates(templatesData.data);
      }
      if (subscribersData.success) {
        setSubscribers(subscribersData.data.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching newsletter data:', error);
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignData.name || !campaignData.subject) {
      alert('Name and subject are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:8000/api/newsletter/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(campaignData),
      });

      const data = await response.json();
      if (data.success) {
        setCampaigns([...campaigns, data.data]);
        setShowCreateCampaign(false);
        setCampaignData({
          name: '',
          subject: '',
          description: '',
          content_template_id: '',
          target_audience: { tags: [], custom_segments: [] },
        });
        alert('Campaign created successfully!');
      } else {
        alert(data.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:8000/api/newsletter/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Campaign sent successfully!');
        fetchNewsletterData();
      } else {
        alert(data.error || 'Failed to send campaign');
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignData.name || !campaignData.subject_template || !campaignData.content_template) {
      alert('Name, subject template, and content template are required');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:8000/api/newsletter/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(campaignData),
      });

      const data = await response.json();
      if (data.success) {
        setTemplates([...templates, data.data]);
        setShowCreateTemplate(false);
        setCampaignData({
          name: '',
          subject_template: '',
          content_template: '',
          template_variables: '{}',
        });
        alert('Template created successfully!');
      } else {
        alert(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    }
  };

  const handleAddSubscriber = async (email: string) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:8000/api/newsletter/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, subscription_source: 'manual' }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Subscriber added successfully!');
        fetchNewsletterData();
      } else {
        alert(data.error || 'Failed to add subscriber');
      }
    } catch (error) {
      console.error('Error adding subscriber:', error);
      alert('Failed to add subscriber');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
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
              <Link href="/community" className="text-gray-600 hover:text-gray-900">
                Community
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
                Newsletter Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Create campaigns, manage templates, and track performance
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreateCampaign(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                New Campaign
              </button>
              <button
                onClick={() => setShowCreateTemplate(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                New Template
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Total Campaigns</h3>
              <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              <p className="text-xs text-gray-500">Created campaigns</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Total Subscribers</h3>
              <p className="text-2xl font-bold text-gray-900">{subscribers.length}</p>
              <p className="text-xs text-gray-500">Active subscribers</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Templates</h3>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              <p className="text-xs text-gray-500">Email templates</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Avg Open Rate</h3>
              <p className="text-2xl font-bold text-gray-900">24.5%</p>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Campaigns
            </h3>

            {campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.map((campaign: any) => (
                  <div
                    key={campaign.id}
                    className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">{campaign.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'draft' 
                              ? 'bg-gray-100 text-gray-800' 
                              : campaign.status === 'scheduled' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : campaign.status === 'sent' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign);
                              handleSendCampaign(campaign.id);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Send Now
                            </button>
                          )}
                          {campaign.status === 'sent' && (
                            <button
                              onClick={() => setSelectedCampaign(campaign)}
                              className="inline-flex items-center px-3 py-1 border-gray-300 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              View Stats
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {campaign.description || campaign.subject}
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Sent:</span>
                          <span>{campaign.total_sent || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium">Opened:</span>
                          <span>{campaign.total_opened || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium">Clicked:</span>
                          <span>{campaign.total_clicked || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <p className="text-gray-500">No campaigns yet</p>
                <button
                  onClick={() => setShowCreateCampaign(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Create First Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Create New Campaign</h3>
                <button
                  onClick={() => setShowCreateCampaign(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={campaignData.subject}
                    onChange={(e) => setCampaignData({...campaignData, subject: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    value={campaignData.description}
                    onChange={(e) => setCampaignData({...campaignData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe your campaign..."
                  />
                </div>

                <div>
                  <label htmlFor="content_template_id" className="block text-sm font-medium text-gray-700">
                    Email Template (Optional)
                  </label>
                  <select
                    id="content_template_id"
                    value={campaignData.content_template_id}
                    onChange={(e) => setCampaignData({...campaignData, content_template_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template: any) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(campaignData.target_audience.tags || []).join(', ')}
                        onChange={(e) => setCampaignData({...campaignData, target_audience: {...campaignData.target_audience, tags: e.target.value.split(',').map(t => t.trim())}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., premium, newsletter"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Schedule
                      </label>
                      <select
                        value={campaignData.schedule_type || 'immediate'}
                        onChange={(e) => setCampaignData({...campaignData, schedule_type: e.target.value as any})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indio-500"
                      >
                        <option value="immediate">Send Now</option>
                        <option value="scheduled">Schedule for Later</option>
                        <option value="recurring">Recurring</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateCampaign(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                  >
                    Create Campaign
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedCampaign.name}
                </h3>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700">{selectedCampaign.description || selectedCampaign.subject}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="ml-2 font-medium">{selectedCampaign.status}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Sent:</span>
                    <span className="ml-2 font-medium">{selectedCampaign.total_sent || 0}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Opened:</span>
                    <span className="mailto:sml font-medium">{selectedCampaign.total_opened || 0}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Clicked:</span>
                    <span className="ml-2 font-medium">{selectedCampaign.total_clicked || 0}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedCampaign.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Scheduled:</span>
                    <span className="ml-2 font-medium">{selectedCampaign.scheduled_at ? formatDate(selectedCampaign.scheduled_at) : 'N/A'}</span>
                  </div>
                </div>

                {selectedCampaign.status === 'sent' && (
                  <button
                    onClick={() => handleSendCampaign(selectedCampaign.id)}
                    className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                  >
                    Resend Campaign
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
