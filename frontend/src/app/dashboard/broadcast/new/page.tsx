'use client';

import { useState } from 'react';

export default function NewBroadcastPage() {
  const [campaignName, setCampaignName] = useState('');
  const [targetData, setTargetData] = useState('all');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const targetOptions = [
    { value: 'all', label: 'All Followers' },
    { value: 'new', label: 'New Followers' },
    { value: 'vip', label: 'VIP Customers' },
  ];

  const handlePreview = () => {
    if (!campaignName || !message) {
      setError('Please fill in campaign name and message');
      return;
    }
    setShowPreview(true);
  };

  const handleSendNow = () => {
    if (!campaignName || !message) {
      setError('Please fill in all required fields');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        name: campaignName,
        target_segment: targetData,
        message_body: message,
        scheduled_at: scheduledAt || null,
      };

      console.log('Sending campaign:', payload);

      const response = await fetch('http://localhost:8000/api/dm/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const data = await response.json();
      console.log('Campaign created:', data);

      window.location.href = '/dm';
    } catch (err) {
      console.error('Error sending campaign:', err);
      setError('Failed to send campaign');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <a href="/dashboard" className="text-2xl font-bold text-gray-900">
                  InstaFlow
                </a>
              </div>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="/dashboard" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="/dm" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                DM
              </a>
              <a href="/segments" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Segments
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Create New Campaign
            </h2>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <form className="space-y-6 px-4 py-6 sm:px-6">
            <div>
              <label htmlFor="campaignName" className="block text-sm font-medium leading-6 text-gray-900">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="campaignName"
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  placeholder="e.g., Welcome Message for New Followers"
                />
              </div>
            </div>

            <div>
              <label htmlFor="targetData" className="block text-sm font-medium leading-6 text-gray-900">
                Target Data <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <select
                  id="targetData"
                  name="targetData"
                  value={targetData}
                  onChange={(e) => setTargetData(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                >
                  {targetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Select the segment of users you want to send this message to
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium leading-6 text-gray-900">
                Message <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  placeholder="Type your message here... You can use emojis! 😊"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {message.length} / 2200 characters
              </p>
            </div>

            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium leading-6 text-gray-900">
                Scheduled At (Optional)
              </label>
              <div className="mt-2">
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  id="scheduledAt"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to send immediately after confirmation
              </p>
            </div>

            <div className="flex items-center justify-end gap-x-3 pt-4">
              <button
                type="button"
                onClick={handlePreview}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={handleSendNow}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Send Now
              </button>
            </div>
          </form>
        </div>
      </main>

      {showPreview && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowPreview(false)}
            ></div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Campaign Preview
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Campaign Name
                        </label>
                        <p className="mt-1 text-sm text-gray-900">{campaignName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Target
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {targetOptions.find((opt) => opt.value === targetData)?.label}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Message
                        </label>
                        <div className="mt-1 rounded-md bg-gray-50 p-3">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{message}</p>
                        </div>
                      </div>
                      {scheduledAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Scheduled At
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(scheduledAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreview(false);
                    handleSendNow();
                  }}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                >
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowConfirm(false)}
            ></div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Send Campaign Now?
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        This action will send the message to {targetOptions.find((opt) => opt.value === targetData)?.label}. This cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={confirmSend}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
