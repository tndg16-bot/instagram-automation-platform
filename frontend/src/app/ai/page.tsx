'use client';

import { useState } from 'react';
import Link from 'next/link';

interface GenerateCaptionResponse {
  success: boolean;
  data?: {
    caption: string;
    hashtags: string[];
    confidence: number;
  };
  error?: string;
}

export default function AICaptionPage() {
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('friendly');
  const [maxLength, setMaxLength] = useState(500);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toneOptions = [
    { value: 'friendly', label: 'Friendly (フレンドリー)' },
    { value: 'professional', label: 'Professional (プロフェッショナル)' },
    { value: 'casual', label: 'Casual (カジュアル)' },
    { value: 'humorous', label: 'Humorous (ユーモア)' },
    { value: 'inspiring', label: 'Inspiring (インスピレーション)' },
  ];

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError('Please enter keywords');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedCaption('');
    setGeneratedHashtags([]);

    try {
      const token = localStorage.getItem('accessToken');
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);

      const payload = {
        keywords: keywordList,
        tone,
        maxLength,
        includeHashtags,
      };

      const response = await fetch('http://localhost:8000/api/ai/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data: GenerateCaptionResponse = await response.json();

      if (data.success && data.data) {
        setGeneratedCaption(data.data.caption);
        setGeneratedHashtags(data.data.hashtags || []);
      } else {
        setError(data.error || 'Failed to generate caption');
      }
    } catch (err) {
      console.error('Error generating caption:', err);
      setError('Failed to generate caption');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const captionText = generatedCaption + (includeHashtags ? ' ' + generatedHashtags.join(' ') : '');
    navigator.clipboard.writeText(captionText);
    alert('Caption copied to clipboard!');
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
              <Link href="/dm" className="text-gray-600 hover:text-gray-900">
                DM
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                AI Caption Generator
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Generate engaging Instagram captions using AI
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Input
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
                      Keywords <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="keywords"
                        rows={3}
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="e.g., サボテン, グリーン, 観葉植物"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Separate keywords with commas
                    </p>
                  </div>

                  <div>
                    <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
                      Tone <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <select
                        id="tone"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {toneOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="maxLength" className="block text-sm font-medium text-gray-700">
                      Max Length
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        id="maxLength"
                        min={1}
                        max={2200}
                        value={maxLength}
                        onChange={(e) => setMaxLength(parseInt(e.target.value) || 500)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      1-2200 characters (Instagram limit: 2200)
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeHashtags"
                      checked={includeHashtags}
                      onChange={(e) => setIncludeHashtags(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeHashtags" className="ml-2 block text-sm text-gray-900">
                      Include hashtags
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Caption'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Output
                  </h3>
                  {generatedCaption && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      📋 Copy
                    </button>
                  )}
                </div>

                {loading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Generating caption...</p>
                  </div>
                )}

                {!loading && !generatedCaption && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">📝</p>
                    <p className="mt-2">Your generated caption will appear here</p>
                  </div>
                )}

                {generatedCaption && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caption
                      </label>
                      <div className="rounded-md bg-gray-50 p-4">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {generatedCaption}
                        </p>
                      </div>
                    </div>

                    {generatedHashtags.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hashtags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {generatedHashtags.map((hashtag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800"
                            >
                              {hashtag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      {generatedCaption.length} / {maxLength} characters
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
