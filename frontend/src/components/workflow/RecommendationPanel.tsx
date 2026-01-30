'use client';

import { useState, useEffect } from 'react';
import RecommendationCard from './RecommendationCard';

export interface WorkflowRecommendation {
  workflow: any;
  reason: string;
  expectedImpact: {
    timeSaved: number;
    engagementIncrease: number;
  };
  difficulty: 'easy' | 'medium' | 'advanced';
  tags: string[];
}

interface RecommendationPanelProps {
  userId?: string;
}

export default function RecommendationPanel({ userId }: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<WorkflowRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/workflows/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.data || []);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      setMessage('推奨の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (recommendation: WorkflowRecommendation) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: recommendation.workflow.name,
          nodes: recommendation.workflow.nodes,
          edges: recommendation.workflow.edges,
          is_active: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply recommendation');
      }

      const data = await response.json();
      setMessage('推奨を適用しました！');
      setTimeout(() => window.location.href = `/dashboard/workflows/builder?id=${data.data.id}`, 2000);
    } catch (error) {
      console.error('Error applying recommendation:', error);
      setMessage('適用に失敗しました');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDismiss = async (recommendationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`/api/workflows/recommendations/${recommendationId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ dismissed: true })
      });

      // Refresh recommendations
      fetchRecommendations();
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  const getDifficultyLabel = (difficulty: string): string => {
    const labels: Record<string, string> = {
      'easy': '簡単',
      'medium': '中程度',
      'advanced': '高度'
    };
    return labels[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-gray-600">推奨を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        💡 あなたへのおすすめ
      </h3>

      {message && (
        <div className="bg-blue-50 border border-blue-500 text-blue-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">
            推奨を作成するには、さらにアクティビティが必要です。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.workflow.id}
              recommendation={rec}
              onApply={() => handleApply(rec)}
              onDismiss={() => handleDismiss(rec.workflow.id)}
              getDifficultyLabel={getDifficultyLabel}
              getDifficultyColor={getDifficultyColor}
            />
          ))}
        </div>
      )}

      {/* Tips section */}
      <div className="bg-gray-50 p-4 rounded-lg mt-6">
        <h4 className="font-medium text-gray-900 mb-2">
          💬 推奨の活用方法
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 予想される時間節約を確認してください</li>
          <li>• 難易度を確認して、自分のスキルに合わせてください</li>
          <li>• タグを参照して、目的に合った推奨を選んでください</li>
          <li>• 不要な推奨は「却下」して、より良い推奨を受け取りましょう</li>
        </ul>
      </div>
    </div>
  );
}
