'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  updated_at: string;
  created_at: string;
  ai_rules_count?: number;
  triggers_count?: number;
  actions_count?: number;
}

interface ExecutionLog {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  triggered_by: string;
  nodes_executed: number;
  total_nodes: number;
  error_message?: string;
}

interface AIDecisionRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  confidence_threshold: number;
  last_used: string | null;
}

export default function WorkflowsListPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [aiDecisionRules, setAiDecisionRules] = useState<AIDecisionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'workflows' | 'logs' | 'ai-rules'>('workflows');

  useEffect(() => {
    fetchWorkflows();
    fetchExecutionLogs();
    fetchAIDecisionRules();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/workflows', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }

      const data = await response.json();
      setWorkflows(data.workflows || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError('ワークフローの読み込みに失敗しました');
      setLoading(false);
    }
  };

  const fetchExecutionLogs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/automation/execution-logs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setExecutionLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching execution logs:', error);
    }
  };

  const fetchAIDecisionRules = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/automation/ai-decision-rules', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAiDecisionRules(data.data);
      }
    } catch (error) {
      console.error('Error fetching AI decision rules:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ワークフロー "${name}" を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/workflows/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }

      setMessage('ワークフローを削除しました');
      fetchWorkflows();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting workflow:', err);
      setMessage('削除に失敗しました');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleExecute = async (id: string, name: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/workflows/${id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }

      const data = await response.json();
      setMessage(`実行が開始されました。Execution ID: ${data.execution_id || 'N/A'}`);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error('Error executing workflow:', err);
      setMessage('実行に失敗しました');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const getExecutionStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Running</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">InstaFlow AI</h1>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/analytics" className="text-gray-600 hover:text-gray-900">
                Analytics
              </Link>
              <Link href="/multi-account" className="text-gray-600 hover:text-gray-900">
                Multi-Account
              </Link>
              <Link href="/dashboard/workflows" className="text-gray-900 font-medium">
                Automation
              </Link>
              <div className="flex items-center space-x-4 ml-8 border-l border-gray-300">
                <Link href="/dashboard/workflows/ai-features/nl-generator" className="text-indigo-600 hover:text-indigo-900 font-medium">
                  🤖 AI生成
                </Link>
                <Link href="/dashboard/workflows/ai-features/decisions" className="text-gray-600 hover:text-gray-900">
                  意思決定
                </Link>
                <Link href="/dashboard/workflows/ai-features/recommendations" className="text-gray-600 hover:text-gray-900">
                  推奨
                </Link>
                <Link href="/dashboard/workflows/ai-ai-optimizations" className="text-gray-600 hover:text-gray-900">
                  最適化
                </Link>
                <Link href="/dashboard/workflows/ai-features/conversations" className="text-gray-600 hover:text-gray-900">
                  会話文脈
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
                Automation Workflows
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage workflows, execution logs, and AI decision rules
              </p>
            </div>
            {activeTab === 'workflows' && (
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link
                  href="/dashboard/workflows/builder"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Workflow
                </Link>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 bg-green-50 border border-green-500 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          {/* タブ切り替え */}
          <div className="mt-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('workflows')}
                className={`${
                  activeTab === 'workflows'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Workflows
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`${
                  activeTab === 'logs'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Execution Logs
              </button>
              <button
                onClick={() => setActiveTab('ai-rules')}
                className={`${
                  activeTab === 'ai-rules'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                AI Decision Rules
              </button>
            </nav>
          </div>

          {/* ワークフロータブ */}
          {activeTab === 'workflows' && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
              {workflows.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">ワークフローがまだありません。最初のワークフローを作成してください！</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Components
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workflows.map((workflow) => (
                        <tr key={workflow.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-indigo-600">
                              {workflow.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                              {getStatusLabel(workflow.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {workflow.triggers_count || 0} triggers, {workflow.actions_count || 0} actions, {workflow.ai_rules_count || 0} AI rules
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {workflow.updated_at
                              ? new Date(workflow.updated_at).toLocaleString()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/dashboard/workflows/builder?id=${workflow.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleExecute(workflow.id, workflow.name)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Execute
                              </button>
                              <button
                                onClick={() => handleDelete(workflow.id, workflow.name)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 実行ログタブ */}
          {activeTab === 'logs' && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
              {executionLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No execution logs yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Workflow
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Triggered By
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Started
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {executionLogs.map((log) => {
                        const duration = log.completed_at
                          ? new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()
                          : null;
                        return (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {log.workflow_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getExecutionStatusBadge(log.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.nodes_executed}/{log.total_nodes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.triggered_by}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(log.started_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {duration ? `${Math.floor(duration / 1000)}s` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* AI決定ルールタブ */}
          {activeTab === 'ai-rules' && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  AI Decision Rules
                </h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  Add Rule
                </button>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {aiDecisionRules.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No AI decision rules yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {aiDecisionRules.map((rule) => (
                      <div key={rule.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {rule.name}
                          </h4>
                          <span className={`text-xs font-medium ${getConfidenceColor(rule.confidence_threshold)}`}>
                            {rule.confidence_threshold}%
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div>
                            <span className="text-xs text-gray-500">Condition:</span>
                            <p className="text-sm text-gray-700">{rule.condition}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Action:</span>
                            <p className="text-sm text-gray-700">{rule.action}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            Last used: {rule.last_used ? new Date(rule.last_used).toLocaleString() : 'Never'}
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button className="flex-1 text-xs text-indigo-600 hover:text-indigo-900">
                            Edit
                          </button>
                          <button className="flex-1 text-xs text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
