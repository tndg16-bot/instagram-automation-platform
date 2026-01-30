'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TriggerDisplay {
  type: string;
  eventType?: string;
  schedule?: {
    expression: string;
    timezone: string;
  };
  description: string;
}

interface ParsedIntentDisplay {
  trigger: TriggerDisplay;
  conditions: ConditionDisplay[];
  actions: ActionDisplay[];
  extractedEntities: EntityDisplay[];
  confidence: number;
}

interface ConditionDisplay {
  field: string;
  operator: string;
  value: string;
  description: string;
  confidence: number;
}

interface ActionDisplay {
  type: string;
  description: string;
  order: number;
}

interface EntityDisplay {
  type: string;
  value: string;
  confidence: number;
}

interface WorkflowPreview {
  nodes: PreviewNode[];
  edges: PreviewEdge[];
}

interface PreviewNode {
  id: string;
  type: string;
  label: string;
}

interface PreviewEdge {
  id: string;
  source: string;
  target: string;
}

interface WorkflowGenerationResult {
  workflow: any;
  confidence: number;
  alternatives: any[];
  explanation: string;
  parsingDetails?: {
    parsed: ParsedIntentDisplay;
    validation: any;
    generationTime: number;
  };
}

export default function NLGeneratorPage() {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<WorkflowGenerationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert('記述を入力してください');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch('/api/workflows/generate-from-nl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          description,
          language,
          workflowName: 'AI生成ワークフロー',
          includeAI: true
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setShowPreview(true);
      } else {
        alert('生成に失敗しました');
      }
    } catch (error) {
      console.error('Error generating workflow:', error);
      alert('エラーが発生しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyWorkflow = async () => {
    if (!result?.workflow) {
      return;
    }

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          name: result.workflow.name,
          nodes: result.workflow.nodes,
          edges: result.workflow.edges,
          is_active: false
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('ワークフローを保存しました！');
        window.location.href = `/dashboard/workflows/builder?id=${data.data.id}`;
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('エラーが発生しました');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return '高';
    if (confidence >= 0.6) return '中';
    return '低';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/workflows" className="text-gray-600 hover:text-gray-900">
                ← ワークフロー一覧
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">AIワークフロー生成</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 入力フォーム */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              🤖 自然言語でワークフローを記述
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  言述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例: 新しいコメントがついたら、ポジティブなら「ありがとうございます！」と返信してDMを送る"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={5}
                />
                <p className="mt-2 text-xs text-gray-500">
                  ヒント: 「〜したら〜」「〜という場合」など具体的に記述してください
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  言語
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'ja' | 'en')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generating ? '生成中...' : '🚀 ワークフローを生成'}
              </button>
            </div>
          </div>

            {/* 右側: 生成結果 */}
            {result && (
              <div className="space-y-6">
                {/* 信頼度表示 */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      信頼度
                    </h3>
                    <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                      {getConfidenceLabel(result.confidence)}
                    </div>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      解析精度: {result.confidence * 100}%
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 説明 */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📝 解析結果
                  </h3>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {result.explanation}
                  </pre>
                </div>

                {/* 構成要素 */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🔧 構成要素
                  </h3>

                  {result.parsingDetails?.parsed && (
                    <>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          🎯 トリガー
                        </h4>
                        <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded">
                          {result.parsingDetails.parsed.trigger.description}
                        </p>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          ⚖️ 条件
                        </h4>
                        <ul className="space-y-2">
                          {result.parsingDetails.parsed.conditions.map((cond, idx) => (
                            <li key={idx} className="text-sm text-gray-900 bg-orange-50 p-3 rounded flex items-center justify-between">
                              <span>{cond.description}</span>
                              <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                                {Math.round(cond.confidence * 100)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          ⚡ アクション
                        </h4>
                        <ul className="space-y-2">
                          {result.parsingDetails.parsed.actions.map((act, idx) => (
                            <li key={idx} className="text-sm text-gray-900 bg-green-50 p-3 rounded">
                              <span>{act.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          🏷️ エンティティ
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.parsingDetails.parsed.extractedEntities.map((entity, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full inline-block"
                            >
                              {entity.type}: {entity.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 候補選択 */}
                {result.alternatives && result.alternatives.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      💡 代替案
                    </h3>

                    <div className="space-y-3">
                      {result.alternatives.map((alt, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedAlternative(idx)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              代替案 {idx + 1}
                            </span>
                            {alt.confidence && (
                              <span className={`text-sm font-mono ${getConfidenceColor(alt.confidence)}`}>
                                信頼度: {Math.round(alt.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {alt.name || `AIモデル: ${alt.model}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors"
                  >
                    👁 プレビュー
                  </button>
                  <button
                    onClick={handleApplyWorkflow}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors"
                  >
                    ✓ ワークフローに適用
                  </button>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
    );
}
