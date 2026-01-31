'use client';

import { useState, useEffect } from 'react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'ai';
  label: string;
  config: any;
  position: { x: number; y: number };
  next?: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  is_active: boolean;
  created_at: string;
}

export default function WorkflowBuilderPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/workflows', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: 'new',
      name: '新規ワークフロー',
      nodes: [],
      is_active: false,
      created_at: new Date().toISOString(),
    };
    setSelectedWorkflow(newWorkflow);
    setNodes([]);
    setShowBuilder(true);
  };

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      label: getNodeLabel(type),
      config: {},
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 50 },
    };
    
    if (nodes.length > 0) {
      const updatedNodes = [...nodes];
      updatedNodes[updatedNodes.length - 1].next = newNode.id;
      updatedNodes.push(newNode);
      setNodes(updatedNodes);
    } else {
      setNodes([newNode]);
    }
  };

  const getNodeLabel = (type: string) => {
    const labels: Record<string, string> = {
      trigger: 'トリガー',
      action: 'アクション',
      condition: '条件分岐',
      delay: '遅延',
      ai: 'AI処理',
    };
    return labels[type] || type;
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      trigger: 'bg-green-100 border-green-400',
      action: 'bg-blue-100 border-blue-400',
      condition: 'bg-yellow-100 border-yellow-400',
      delay: 'bg-purple-100 border-purple-400',
      ai: 'bg-pink-100 border-pink-400',
    };
    return colors[type] || 'bg-gray-100';
  };

  const saveWorkflow = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          name: selectedWorkflow?.name,
          description: selectedWorkflow?.description,
          nodes: nodes,
        }),
      });

      if (response.ok) {
        fetchWorkflows();
        setShowBuilder(false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">ワークフロービルダー</h1>
          <button
            onClick={createNewWorkflow}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + 新規ワークフロー
          </button>
        </div>

        {!showBuilder ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg"
                onClick={() => {
                  setSelectedWorkflow(workflow);
                  setNodes(workflow.nodes);
                  setShowBuilder(true);
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{workflow.name}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${workflow.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {workflow.is_active ? '有効' : '無効'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">{workflow.description || '説明なし'}</p>
                <div className="text-sm text-gray-400">
                  ノード数: {workflow.nodes.length}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {/* Builder Header */}
            <div className="border-b p-4 flex justify-between items-center">
              <input
                type="text"
                className="text-xl font-semibold border-none focus:outline-none"
                value={selectedWorkflow?.name || ''}
                onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow!, name: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBuilder(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveWorkflow}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>

            {/* Builder Canvas */}
            <div className="flex">
              {/* Sidebar */}
              <div className="w-64 border-r p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">ノード追加</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => addNode('trigger')}
                    className="w-full text-left px-4 py-2 bg-green-100 rounded hover:bg-green-200"
                  >
                    🚀 トリガー
                  </button>
                  <button
                    onClick={() => addNode('action')}
                    className="w-full text-left px-4 py-2 bg-blue-100 rounded hover:bg-blue-200"
                  >
                    ⚡ アクション
                  </button>
                  <button
                    onClick={() => addNode('condition')}
                    className="w-full text-left px-4 py-2 bg-yellow-100 rounded hover:bg-yellow-200"
                  >
                    🔀 条件分岐
                  </button>
                  <button
                    onClick={() => addNode('delay')}
                    className="w-full text-left px-4 py-2 bg-purple-100 rounded hover:bg-purple-200"
                  >
                    ⏱️ 遅延
                  </button>
                  <button
                    onClick={() => addNode('ai')}
                    className="w-full text-left px-4 py-2 bg-pink-100 rounded hover:bg-pink-200"
                  >
                    🤖 AI処理
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 p-8 min-h-[600px] relative bg-gray-50">
                {nodes.length === 0 ? (
                  <div className="text-center text-gray-400 mt-20">
                    左側のメニューからノードを追加してください
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nodes.map((node, index) => (
                      <div key={node.id} className="flex items-center gap-4">
                        <div className={`p-4 rounded-lg border-2 ${getNodeColor(node.type)} w-64`}>
                          <div className="font-medium">{node.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{node.type}</div>
                        </div>
                        {index < nodes.length - 1 && (
                          <div className="text-2xl text-gray-400">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
