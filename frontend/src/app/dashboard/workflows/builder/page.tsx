'use client';

import { useState, useCallback, useEffect, ChangeEvent } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ノードタイプの定義
interface NodeType {
  id: string;
  type: string;
  label: string;
  color: string;
}

// ノードデータの型定義
interface NodeData extends Record<string, unknown> {
  label: string;
  nodeType?: string;
  targetValue?: string | number | string[] | undefined;
  operator?: string;
  comparisonValue?: string;
  recipient?: string;
  message?: string;
  replyText?: string;
  keywords?: string;
  tone?: string;
  includeHashtags?: boolean;
  promptTemplate?: string;
  model?: string;
  temperature?: number;
}

// 条件ノードのパラメータ
interface ConditionNodeParams {
  targetValue: string;  // 判定対象の値（変数名や固定値）
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  comparisonValue: string;  // 比較する値
}

// DM送信ノードのパラメータ
interface DMSendNodeParams {
  recipient: string;  // 送信先（ユーザー名やセグメント）
  message: string;     // 送信メッセージ
}

// コメント返信ノードのパラメータ
interface CommentReplyNodeParams {
  replyText: string;  // 返信内容
}

// AIキャプションノードのパラメータ
interface AICaptionNodeParams {
  keywords: string;      // キーワード
  tone: string;          // トーン（professional, casual, etc.）
  includeHashtags: boolean;  // ハッシュタグを含めるか
}

// AI返信ノードのパラメータ
interface AIReplyNodeParams {
  promptTemplate: string;  // プロンプトテンプレート
  model: string;          // AIモデル
  temperature?: number;    // 温度パラメータ
}

// 利用可能なノードタイプ
const AVAILABLE_NODE_TYPES: NodeType[] = [
  { id: 'trigger', type: 'trigger', label: 'Trigger (Start)', color: 'bg-green-500' },
  { id: 'dm-send', type: 'dm-send', label: 'Action: DM Send', color: 'bg-blue-500' },
  { id: 'comment-reply', type: 'comment-reply', label: 'Action: Comment Reply', color: 'bg-blue-500' },
  { id: 'ai-caption', type: 'ai-caption', label: 'AI: Generate Caption', color: 'bg-purple-500' },
  { id: 'ai-reply', type: 'ai-reply', label: 'AI: AI Reply', color: 'bg-purple-500' },
  { id: 'condition', type: 'condition', label: 'Condition: If/Else', color: 'bg-orange-500' },
];

export default function WorkflowBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [workflowName, setWorkflowName] = useState('新規ワークフロー');
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ワークフロー読み込み
  useEffect(() => {
    const loadWorkflow = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (!id) return;

      setLoading(true);
      setWorkflowId(id);

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.warn('認証トークンが見つかりません');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/api/workflows/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const workflow = result.data;

          if (workflow) {
            setNodes(workflow.nodes || []);
            setEdges(workflow.edges || []);
            setWorkflowName(workflow.name || '新規ワークフロー');
          }
        }
      } catch (error) {
        console.error('ワークフロー読み込みエラー:', error);
        setSaveMessage('ワークフローの読み込みに失敗しました');
        setTimeout(() => setSaveMessage(''), 3000);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflow();
  }, [setNodes, setEdges]);

  // キーボードショートカット（削除）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        e.preventDefault();
        handleDeleteNode(selectedNode.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode]);

  // 新しいノードを作成する関数
  const createNode = useCallback(
    (nodeType: NodeType, position: { x: number; y: number }): Node => {
      const newNode: Node = {
        id: `${nodeType.type}-${Date.now()}`,
        type: 'default',
        position,
        data: {
          label: nodeType.label,
          nodeType: nodeType.type,
        },
        style: {
          background: nodeType.color.replace('bg-', '').replace('-500', '') === 'green'
            ? '#22c55e'
            : nodeType.color.replace('bg-', '').replace('-500', '') === 'blue'
            ? '#3b82f6'
            : nodeType.color.replace('bg-', '').replace('-500', '') === 'purple'
            ? '#a855f7'
            : '#f97316',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          minWidth: '200px',
          textAlign: 'center',
          cursor: 'pointer',
        },
      };

      // ノードタイプに応じてデフォルトデータを設定
      switch (nodeType.type) {
        case 'condition':
          newNode.data = {
            label: nodeType.label,
            nodeType: nodeType.type,
            targetValue: '',
            operator: 'equals' as const,
            comparisonValue: '',
          };
          break;
        case 'dm-send':
          newNode.data = {
            label: nodeType.label,
            nodeType: nodeType.type,
            recipient: '',
            message: '',
          };
          break;
        case 'comment-reply':
          newNode.data = {
            label: nodeType.label,
            nodeType: nodeType.type,
            replyText: '',
          };
          break;
        case 'ai-caption':
          newNode.data = {
            label: nodeType.label,
            nodeType: nodeType.type,
            keywords: '',
            tone: 'professional',
            includeHashtags: true,
          };
          break;
        case 'ai-reply':
          newNode.data = {
            label: nodeType.label,
            nodeType: nodeType.type,
            promptTemplate: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
          };
          break;
        default:
          // Triggerノードなど
          newNode.data = {
            label: nodeType.label,
            nodeType: nodeType.type,
          };
      }

      return newNode;
    },
    []
  );

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, nodeType: NodeType) => {
    setIsDragging(true);
    setDraggedNodeType(nodeType);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // ドラッグ中
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // ドロップ
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (!draggedNodeType) return;

      const reactFlowBounds = (e.target as HTMLElement).getBoundingClientRect();
      const position = {
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      };

      const newNode = createNode(draggedNodeType, position);
      setNodes((nds) => [...nds, newNode as Node<NodeData>]);
      setDraggedNodeType(null);
    },
    [draggedNodeType, createNode, setNodes]
  );

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedNodeType(null);
  }, []);

  // エッジ接続
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // ノード選択
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node as Node<NodeData>);
  }, []);

  // バックグラウンドクリックで選択解除
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ノード削除
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // 保存機能 (Backend API)
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setSaveMessage('認証トークンが見つかりません。ログインしてください。');
        setTimeout(() => setSaveMessage(''), 3000);
        setSaving(false);
        return;
      }

      // ワークフローデータの準備
      const workflowData = {
        name: workflowName,
        nodes,
        edges,
        is_active: false,
      };

      // 保存または更新
      const url = workflowId
        ? `http://localhost:8000/api/workflows/${workflowId}`
        : 'http://localhost:8000/api/workflows';
      const method = workflowId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存に失敗しました');
      }

      const result = await response.json();

      // 新規作成の場合、ワークフローIDを設定
      if (!workflowId && result.data?.id) {
        setWorkflowId(result.data.id);
        // URLを更新（リダイレクトしない）
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', result.data.id);
        window.history.replaceState({}, '', newUrl.toString());
      }

      console.log('保存結果:', result);
      setSaveMessage('ワークフローを保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '保存に失敗しました。';
      setSaveMessage(errorMessage);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [nodes, edges, workflowName, workflowId]);

  // ノードタイプのスタイル
  const nodeTypeStyle = (nodeType: NodeType) => {
    const colorMap: Record<string, string> = {
      green: 'bg-green-500 hover:bg-green-600',
      blue: 'bg-blue-500 hover:bg-blue-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
    };

    const colorKey = nodeType.color.replace('bg-', '').replace('-500', '');
    return `cursor-move ${colorMap[colorKey]} text-white p-3 rounded-lg shadow-md transition-colors`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard/workflows"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              一覧に戻る
            </a>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-xl font-bold text-gray-900 border-none bg-transparent focus:outline-none focus:ring-0 w-64"
                placeholder="ワークフロー名"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {saveMessage && (
              <div className="text-sm text-green-600">{saveMessage}</div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || nodes.length === 0}
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左サイドバー */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            利用可能なノード
          </h2>
          <div className="space-y-3">
            {AVAILABLE_NODE_TYPES.map((nodeType) => (
              <div
                key={nodeType.id}
                draggable
                onDragStart={(e) => handleDragStart(e, nodeType)}
                className={nodeTypeStyle(nodeType)}
              >
                <div className="text-sm font-medium">{nodeType.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-xs text-gray-500">
            <p className="font-semibold mb-2">操作方法:</p>
            <ul className="space-y-1">
              <li>• 左のノードをキャンバスにドラッグ</li>
              <li>• ノードの端から線を引いて接続</li>
              <li>• ノードをクリックして選択</li>
              <li>• Deleteキーでノード削除</li>
            </ul>
          </div>
        </div>

        {/* React Flow キャンバス */}
        <div
          className="flex-1 bg-gray-100"
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  ノードを追加してください
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  左のサイドバーからノードをドラッグしてキャンバスにドロップしてください
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 右パネル - 選択中のノード情報 */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">ノードプロパティ</h3>
            <div className="space-y-4">
              {/* 共通フィールド */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedNode.id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイプ
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedNode.data.nodeType || selectedNode.type}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ラベル
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.label || ''}
                  onChange={(e) => {
                    if (!selectedNode) return;
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, label: e.target.value } }
                          : node
                      )
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 条件ノードのパラメータ */}
              {selectedNode.data.nodeType === 'condition' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-3">条件設定</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        判定対象の値
                      </label>
                      <input
                        type="text"
                        value={String(selectedNode.data.targetValue || '')}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, targetValue: e.target.value } }
                                : node
                            )
                          );
                        }}
                        placeholder="例: user.message または 固定値"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        演算子
                      </label>
                      <select
                        value={selectedNode.data.operator || 'equals'}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, operator: e.target.value as ConditionNodeParams['operator'] } }
                                : node
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="equals">等しい (equals)</option>
                        <option value="contains">含む (contains)</option>
                        <option value="greaterThan">より大きい (greaterThan)</option>
                        <option value="lessThan">より小さい (lessThan)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        比較する値
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data?.comparisonValue || ''}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, comparisonValue: e.target.value as string } }
                                : node
                            )
                          );
                        }}
                        placeholder="例: yes または 固定値"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DM送信ノードのパラメータ */}
              {selectedNode.data.nodeType === 'dm-send' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-3">DM設定</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        送信先
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data?.recipient || ''}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, recipient: e.target.value as string } }
                                : node
                            )
                          );
                        }}
                        placeholder="ユーザー名またはセグメント"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        メッセージ
                      </label>
                      <textarea
                        value={selectedNode.data.message || ''}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, message: e.target.value } }
                                : node
                            )
                          );
                        }}
                        rows={3}
                        placeholder="送信するメッセージを入力..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* コメント返信ノードのパラメータ */}
              {selectedNode.data.nodeType === 'comment-reply' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-3">返信設定</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        返信内容
                      </label>
                      <textarea
                        value={selectedNode.data.replyText || ''}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, replyText: e.target.value } }
                                : node
                            )
                          );
                        }}
                        rows={3}
                        placeholder="返信内容を入力..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AIキャプションノードのパラメータ */}
              {selectedNode.data.nodeType === 'ai-caption' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-3">AIキャプション設定</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        キーワード
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data.keywords || ''}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, keywords: e.target.value } }
                                : node
                            )
                          );
                        }}
                        placeholder="キーワード（カンマ区切り）"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        トーン
                      </label>
                      <select
                        value={selectedNode.data.tone || 'professional'}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, tone: e.target.value } }
                                : node
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="professional">プロフェッショナル</option>
                        <option value="casual">カジュアル</option>
                        <option value="friendly">フレンドリー</option>
                        <option value="humorous">ユーモラス</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="includeHashtags"
                        checked={selectedNode.data.includeHashtags !== false}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, includeHashtags: e.target.checked } }
                                : node
                            )
                          );
                        }}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="includeHashtags" className="ml-2 text-xs text-gray-700">
                        ハッシュタグを含める
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* AI返信ノードのパラメータ */}
              {selectedNode.data.nodeType === 'ai-reply' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-xs font-semibold text-gray-900 mb-3">AI返信設定</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        プロンプトテンプレート
                      </label>
                      <textarea
                        value={selectedNode.data.promptTemplate || ''}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, promptTemplate: e.target.value } }
                                : node
                            )
                          );
                        }}
                        rows={3}
                        placeholder="{{user_message}} に返信してください..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        AIモデル
                      </label>
                      <select
                        value={selectedNode.data.model || 'gpt-3.5-turbo'}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, model: e.target.value } }
                                : node
                            )
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-3.5">GPT-3.5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        温度: {selectedNode.data.temperature || 0.7}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={selectedNode.data.temperature || 0.7}
                        onChange={(e) => {
                          if (!selectedNode) return;
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, temperature: parseFloat(e.target.value) } }
                                : node
                            )
                          );
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0 (厳密)</span>
                        <span>1</span>
                        <span>2 (創造的)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 位置情報（すべてのノードに共通） */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  位置
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}
                </div>
              </div>

              {/* 削除ボタン */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  ノードを削除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
