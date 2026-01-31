'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AIDecision {
  nodeId: string;
  action: string;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    action: string;
    confidence: number;
    reason?: string;
  }>;
}

interface DecisionExplanationProps {
  decision: AIDecision | null;
  onClose?: () => void;
}

export default function DecisionExplanation({ decision, onClose }: DecisionExplanationProps) {
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  if (!decision) {
    return null;
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'send_dm': 'DMを送信する',
      'reply_comment': 'コメントに返信する',
      'like': 'いいねする',
      'follow': 'フォローする',
      'none': '何もしない'
    };
    return labels[action] || action;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🤖 AI意思決定の説明
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            AIが選択したアクションとその理由
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main decision */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">
            推奨アクション
          </h4>
          <div className={`text-sm font-mono ${getConfidenceColor(decision.confidence)}`}>
            信頼度: {Math.round(decision.confidence * 100)}%
          </div>
        </div>

        <div className="text-2xl font-bold text-indigo-700 mb-4">
          {getActionLabel(decision.action)}
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            理由:
          </h5>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {decision.reasoning}
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            信頼度スコア
          </span>
          <span className={`text-sm font-bold ${getConfidenceColor(decision.confidence)}`}>
            {decision.confidence.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              decision.confidence >= 0.8 ? 'bg-green-500' :
              decision.confidence >= 0.6 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${decision.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Alternatives */}
      {decision.alternatives && decision.alternatives.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">
            💡 代替案
          </h4>

          <div className="space-y-3">
            {decision.alternatives.map((alt, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedAlternative(idx.toString())}
                className={`border rounded-lg p-4 cursor-pointer transition-shadow ${
                  selectedAlternative === idx.toString()
                    ? 'border-indigo-500 shadow-md bg-indigo-50'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {getActionLabel(alt.action)}
                    </div>
                    {alt.reason && (
                      <p className="text-sm text-gray-600 mt-1">
                        {alt.reason}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-mono ${getConfidenceColor(alt.confidence)}`}>
                    {alt.confidence.toFixed(2)}
                  </span>
                </div>

                {selectedAlternative === idx.toString() && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
                      このアクションを適用
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
        <button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
          onClick={() => console.log('Apply decision:', decision)}
        >
          ✓ 推奨アクションを適用
        </button>
        <button
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg"
          onClick={() => console.log('Skip for now')}
        >
          後で決定
        </button>
      </div>
    </div>
  );
}

// Wrapper component for modal usage
export function DecisionExplanationModal({
  decision,
  onClose
}: DecisionExplanationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DecisionExplanation decision={decision} onClose={onClose} />
      </div>
    </div>
  );
}
