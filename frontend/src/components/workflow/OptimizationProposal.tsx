'use client';

import { useState } from 'react';

interface WorkflowOptimization {
  workflowId: string;
  originalMetrics: {
    totalRuns: number;
    successRate: number;
    averageExecutionTime: number;
    averageCost: number;
  };
  proposedChanges: ProposedChange[];
  expectedImprovement: {
    efficiency: number;
    successRate: number;
    cost: number;
  };
  confidence: number;
}

interface ProposedChange {
  nodeId: string;
  changeType: 'add' | 'remove' | 'modify' | 'reorder';
  description: string;
  reason: string;
  newConfig?: any;
  expectedImpact?: {
    timeSaved: number;
    costReduction: number;
    successIncrease: number;
  };
}

interface OptimizationProposalProps {
  optimization: WorkflowOptimization | null;
  onApply?: () => void;
  onReject?: () => void;
  onClose?: () => void;
}

export default function OptimizationProposal({
  optimization,
  onApply,
  onReject,
  onClose
}: OptimizationProposalProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');

  if (!optimization) {
    return null;
  }

  const { originalMetrics, proposedChanges, expectedImprovement, confidence } = optimization;

  const getChangeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'add': '追加',
      'remove': '削除',
      'modify': '変更',
      'reorder': '並べ替え'
    };
    return labels[type] || type;
  };

  const getChangeTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'add': 'bg-green-100 text-green-800',
      'remove': 'bg-red-100 text-red-800',
      'modify': 'bg-yellow-100 text-yellow-800',
      'reorder': 'bg-blue-100 text-blue-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            ⚡ ワークフロー最適化提案
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            AIによるパフォーマンス改善の提案
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'summary' ? 'details' : 'summary')}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            {viewMode === 'summary' ? '詳細を表示' : 'サマリーを表示'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Summary view */}
      {viewMode === 'summary' && (
        <div className="space-y-6">
          {/* Confidence score */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                提案の信頼度
              </span>
              <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
                {confidence.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  confidence >= 0.8 ? 'bg-green-500' :
                  confidence >= 0.6 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Expected improvement */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">効率向上</div>
              <div className="text-2xl font-bold text-blue-700">
                {(expectedImprovement.efficiency * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">成功率向上</div>
              <div className="text-2xl font-bold text-green-700">
                {(expectedImprovement.successRate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">コスト削減</div>
              <div className="text-2xl font-bold text-purple-700">
                {(expectedImprovement.cost * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Proposed changes count */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                提案される変更
              </span>
              <span className="text-2xl font-bold text-indigo-700">
                {proposedChanges.length}
              </span>
            </div>
          </div>

          {/* Original metrics */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              📊 現在の指標
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">実行回数</span>
                <span className="text-sm font-medium text-gray-900">{originalMetrics.totalRuns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">成功率</span>
                <span className="text-sm font-medium text-gray-900">
                  {(originalMetrics.successRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">平均実行時間</span>
                <span className="text-sm font-medium text-gray-900">
                  {(originalMetrics.averageExecutionTime / 1000).toFixed(2)}秒
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">平均コスト</span>
                <span className="text-sm font-medium text-gray-900">
                  ${originalMetrics.averageCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details view */}
      {viewMode === 'details' && (
        <div className="space-y-6">
          {/* Proposed changes */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              🔧 提案される変更 ({proposedChanges.length}件)
            </h4>
            <div className="space-y-3">
              {proposedChanges.map((change, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getChangeTypeColor(change.changeType)}`}>
                        {getChangeTypeLabel(change.changeType)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {change.nodeId}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-900 mb-2">
                    {change.description}
                  </p>

                  <p className="text-xs text-gray-600 mb-2">
                    理由: {change.reason}
                  </p>

                  {change.expectedImpact && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="space-y-1">
                        {change.expectedImpact.timeSaved > 0 && (
                          <div className="flex items-center text-xs">
                            <span className="text-gray-600">時間節約: </span>
                            <span className="font-medium text-green-600 ml-1">
                              {change.expectedImpact.timeSaved}秒
                            </span>
                          </div>
                        )}
                        {change.expectedImpact.costReduction > 0 && (
                          <div className="flex items-center text-xs">
                            <span className="text-gray-600">コスト削減: </span>
                            <span className="font-medium text-purple-600 ml-1">
                              ${(change.expectedImpact.costReduction * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {change.expectedImpact.successIncrease > 0 && (
                          <div className="flex items-center text-xs">
                            <span className="text-gray-600">成功率向上: </span>
                            <span className="font-medium text-blue-600 ml-1">
                              +{(change.expectedImpact.successIncrease * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Expected improvement breakdown */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              📈 期待される改善効果
            </h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">効率向上</span>
                  <span className="font-medium text-indigo-700">
                    {(expectedImprovement.efficiency * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${expectedImprovement.efficiency * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">成功率向上</span>
                  <span className="font-medium text-green-700">
                    {(expectedImprovement.successRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${expectedImprovement.successRate * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">コスト削減</span>
                  <span className="font-medium text-purple-700">
                    {(expectedImprovement.cost * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${expectedImprovement.cost * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200 mt-6">
        <button
          onClick={onApply}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg"
        >
          ⚡ 最適化を適用
        </button>
        <button
          onClick={onReject}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg"
        >
          ✕ 却下
        </button>
      </div>
    </div>
  );
}
