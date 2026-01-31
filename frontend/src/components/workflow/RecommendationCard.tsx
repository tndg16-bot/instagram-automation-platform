'use client';

import { WorkflowRecommendation } from './RecommendationPanel';

interface RecommendationCardProps {
  recommendation: WorkflowRecommendation;
  onApply: () => void;
  onDismiss: () => void;
  getDifficultyLabel: (difficulty: string) => string;
  getDifficultyColor: (difficulty: string) => string;
}

export default function RecommendationCard({
  recommendation,
  onApply,
  onDismiss,
  getDifficultyLabel,
  getDifficultyColor
}: RecommendationCardProps) {
  const { workflow, reason, expectedImpact, difficulty, tags } = recommendation;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {workflow.name}
          </h4>
          <p className="text-sm text-gray-600 line-clamp-2">
            {workflow.description}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(difficulty)}`}>
          {getDifficultyLabel(difficulty)}
        </span>
      </div>

      {/* Reason */}
      <div className="mb-3">
        <p className="text-sm text-gray-700">
          {reason}
        </p>
      </div>

      {/* Expected impact */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <h5 className="text-xs font-medium text-gray-700 mb-2">
          📊 期待される効果
        </h5>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              時間節約
            </span>
            <span className="text-xs font-medium text-green-600">
              {expectedImpact.timeSaved} 分/週
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              エンゲージメント向上
            </span>
            <span className="text-xs font-medium text-blue-600">
              +{(expectedImpact.engagementIncrease * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full inline-block"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex space-x-2">
        <button
          onClick={onApply}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-3 rounded-md"
        >
          ✓ 適用
        </button>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 text-sm"
          title="却下"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
