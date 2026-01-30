'use client';

import { useState, useEffect } from 'react';

interface ConversationContextViewerProps {
  conversationId: string;
  userId: string;
}

export default function ConversationContextViewer({
  conversationId,
  userId
}: ConversationContextViewerProps) {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'summary' | 'entities' | 'funnel'>('messages');

  useEffect(() => {
    fetchContext();
  }, [conversationId, userId]);

  const fetchContext = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/conversations/${conversationId}/context`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversation context');
      }

      const data = await response.json();
      setContext(data.data);
    } catch (error) {
      console.error('Error fetching conversation context:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFunnelStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      'awareness': '👁 認知',
      'consideration': '🤔 検討',
      'decision': '✅ 決定',
      'purchase': '🛒 購入',
      'retention': '🔄 リテンション'
    };
    return labels[stage] || stage;
  };

  const getFunnelStageColor = (stage: string): string => {
    const colors: Record<string, string> = {
      'awareness': 'bg-blue-100 text-blue-800',
      'consideration': 'bg-yellow-100 text-yellow-800',
      'decision': 'bg-green-100 text-green-800',
      'purchase': 'bg-purple-100 text-purple-800',
      'retention': 'bg-indigo-100 text-indigo-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentColor = (sentiment: string): string => {
    const colors: Record<string, string> = {
      'positive': 'text-green-600',
      'neutral': 'text-gray-600',
      'negative': 'text-red-600'
    };
    return colors[sentiment] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <p className="text-gray-500">会話文脈が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            💬 会話文脈ビューアー
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            ID: {conversationId}
          </p>
        </div>
        <div className="text-xs text-gray-500">
          最終更新: {new Date(context.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Funnel stage badge */}
      <div className={`mb-6 p-3 rounded-lg ${getFunnelStageColor(context.stage)}`}>
        <div className="text-sm font-medium text-gray-900">
          {getFunnelStageLabel(context.stage)}
        </div>
      </div>

      {/* Sentiment trend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          😊 感情トレンド
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">現在の感情:</span>
          <span className={`text-sm font-medium ${getSentimentColor(context.sentiment.label)}`}>
            {context.sentiment.label === 'positive' ? 'ポジティブ' :
              context.sentiment.label === 'neutral' ? 'ニュートラル' : 'ネガティブ'}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-700">スコア:</span>
          <span className="text-sm font-medium">
            {context.sentiment.score.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('messages')}
            className={`${
              activeTab === 'messages'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            メッセージ ({context.history.length})
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`${
              activeTab === 'summary'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            サマリー
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`${
              activeTab === 'entities'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            エンティティ ({context.entities.length})
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={`${
              activeTab === 'funnel'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            ファネル
          </button>
        </nav>
      </div>

      {/* Messages tab */}
      {activeTab === 'messages' && (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {context.history.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="text-xs text-gray-600 mb-1">
                  {msg.role === 'user' ? 'あなた' : 'AI'}
                </div>
                <div className="text-sm">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary tab */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">トピック</h4>
            <div className="flex flex-wrap gap-2">
              {context.summary.topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">主要なポイント</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {context.summary.keyPoints.map((point, idx) => (
                <li key={idx}>• {point}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">未解決の質問</h4>
            {context.summary.openQuestions.length > 0 ? (
              <ul className="text-sm text-gray-700 space-y-1">
                {context.summary.openQuestions.map((q, idx) => (
                  <li key={idx}>• {q}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">未解決の質問はありません</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">要約</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {context.summary.summaryText}
            </p>
          </div>
        </div>
      )}

      {/* Entities tab */}
      {activeTab === 'entities' && (
        <div className="grid grid-cols-2 gap-3">
          {context.entities.map((entity, idx) => (
            <div
              key={idx}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
            >
              <div className="text-xs text-gray-500 mb-1">
                {entity.type}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {entity.value}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                信頼度: {(entity.confidence * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Funnel tab */}
      {activeTab === 'funnel' && (
        <div>
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              現在のステージ
            </h4>
            <div className={`p-4 rounded-lg ${getFunnelStageColor(context.stage)}`}>
              <div className="text-lg font-medium text-gray-900">
                {getFunnelStageLabel(context.stage)}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              購入ファネルの進捗状況
            </h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${context.stage === 'awareness' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  1
                </div>
                <div className="ml-3 flex-1 h-2 bg-gray-200 rounded">
                  <div
                    className={`h-full bg-blue-600 rounded ${context.stage === 'awareness' ? 'w-full' : 'w-0'}`}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${context.stage === 'consideration' ? 'bg-yellow-600' : 'bg-gray-300'}`}>
                  2
                </div>
                <div className="ml-3 flex-1 h-2 bg-gray-200 rounded">
                  <div
                    className={`h-full bg-yellow-600 rounded ${context.stage === 'consideration' ? 'w-full' : 'w-0'}`}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${context.stage === 'decision' ? 'bg-green-600' : 'bg-gray-300'}`}>
                  3
                </div>
                <div className="ml-3 flex-1 h-2 bg-gray-200 rounded">
                  <div
                    className={`h-full bg-green-600 rounded ${context.stage === 'decision' ? 'w-full' : 'w-0'}`}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${context.stage === 'purchase' ? 'bg-purple-600' : 'bg-gray-300'}`}>
                  4
                </div>
                <div className="ml-3 flex-1 h-2 bg-gray-200 rounded">
                  <div
                    className={`h-full bg-purple-600 rounded ${context.stage === 'purchase' ? 'w-full' : 'w-0'}`}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${context.stage === 'retention' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  5
                </div>
                <div className="ml-3 flex-1 h-2 bg-gray-200 rounded">
                  <div
                    className={`h-full bg-indigo-600 rounded ${context.stage === 'retention' ? 'w-full' : 'w-0'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
