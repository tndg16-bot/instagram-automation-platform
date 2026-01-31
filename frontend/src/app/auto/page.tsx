'use client';

import { useState, useEffect } from 'react';

interface AutoSettings {
  is_active: boolean;
  target_hashtags: string[];
  target_accounts: string[];
  max_actions_per_day: number;
  delay_min: number;
  delay_max: number;
  skip_private: boolean;
}

export default function AutoSettingsPage() {
  const [activeTab, setActiveTab] = useState<'like' | 'follow'>('like');
  const [likeSettings, setLikeSettings] = useState<AutoSettings>({
    is_active: false,
    target_hashtags: [],
    target_accounts: [],
    max_actions_per_day: 100,
    delay_min: 30,
    delay_max: 120,
    skip_private: true,
  });
  const [followSettings, setFollowSettings] = useState<AutoSettings>({
    is_active: false,
    target_hashtags: [],
    target_accounts: [],
    max_actions_per_day: 50,
    delay_min: 60,
    delay_max: 300,
    skip_private: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'like' ? '/api/auto/like/settings' : '/api/auto/follow/settings';
      const settings = activeTab === 'like' ? likeSettings : followSettings;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          instagram_account_id: localStorage.getItem('instagramAccountId'),
          ...settings,
        }),
      });

      if (response.ok) {
        setMessage('設定を保存しました');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('エラーが発生しました');
    }
    setLoading(false);
  };

  const addTag = (tag: string) => {
    if (activeTab === 'like') {
      setLikeSettings({ ...likeSettings, target_hashtags: [...likeSettings.target_hashtags, tag] });
    } else {
      setFollowSettings({ ...followSettings, target_hashtags: [...followSettings.target_hashtags, tag] });
    }
  };

  const removeTag = (index: number) => {
    if (activeTab === 'like') {
      const newTags = [...likeSettings.target_hashtags];
      newTags.splice(index, 1);
      setLikeSettings({ ...likeSettings, target_hashtags: newTags });
    } else {
      const newTags = [...followSettings.target_hashtags];
      newTags.splice(index, 1);
      setFollowSettings({ ...followSettings, target_hashtags: newTags });
    }
  };

  const currentSettings = activeTab === 'like' ? likeSettings : followSettings;
  const setCurrentSettings = activeTab === 'like' ? setLikeSettings : setFollowSettings;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">自動化設定</h1>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('like')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'like' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            自動いいね
          </button>
          <button
            onClick={() => setActiveTab('follow')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'follow' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            自動フォロー
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">自動実行</h3>
              <p className="text-gray-500">自動{activeTab === 'like' ? 'いいね' : 'フォロー'}を有効にする</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={currentSettings.is_active}
                onChange={(e) => setCurrentSettings({ ...currentSettings, is_active: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Target Hashtags */}
          <div>
            <h3 className="text-lg font-medium mb-2">対象ハッシュタグ</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="ハッシュタグを追加"
                className="flex-1 border rounded px-3 py-2"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {currentSettings.target_hashtags.map((tag, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                  #{tag}
                  <button onClick={() => removeTag(index)} className="text-blue-600 hover:text-blue-800">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Target Accounts */}
          <div>
            <h3 className="text-lg font-medium mb-2">対象アカウント</h3>
            <textarea
              className="w-full border rounded px-3 py-2 h-24"
              placeholder="アカウント名を改行区切りで入力"
              value={currentSettings.target_accounts.join('\n')}
              onChange={(e) => setCurrentSettings({ 
                ...currentSettings, 
                target_accounts: e.target.value.split('\n').filter(a => a.trim()) 
              })}
            />
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">1日上限</h3>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={currentSettings.max_actions_per_day}
                onChange={(e) => setCurrentSettings({ ...currentSettings, max_actions_per_day: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Delay Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">最小間隔（秒）</h3>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={currentSettings.delay_min}
                onChange={(e) => setCurrentSettings({ ...currentSettings, delay_min: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">最大間隔（秒）</h3>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={currentSettings.delay_max}
                onChange={(e) => setCurrentSettings({ ...currentSettings, delay_max: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Skip Options */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skip_private"
              checked={currentSettings.skip_private}
              onChange={(e) => setCurrentSettings({ ...currentSettings, skip_private: e.target.checked })}
            />
            <label htmlFor="skip_private">プライベートアカウントを除外</label>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
