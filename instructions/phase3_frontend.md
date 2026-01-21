# Configuration Update
これからの対話、コードの説明、コミットメッセージは全て **「日本語」** で行ってください。

# Phase 3 Kick-off: Workflow Builder
あなたはFrontend担当です。Phase 3の重要機能「ワークフロービルダー」の実装を開始します。

**Task: Issue #15 ワークフロービルダーUIの実装**

## 要件
1.  **ライブラリ導入**: 
    - `React Flow` (or `@xyflow/react`) を使用します。
    - デザインはTailwind CSSで行います。

2.  **ページ作成**: 
    - `frontend/src/app/dashboard/workflows/builder/page.tsx` を新規作成。
    - キャンバス全体を表示するレイアウトにしてください。

3.  **UI機能実装**:
    - **左サイドバー**: 利用可能なノード一覧を表示（Drag & Drop元）。
        - Trigger Node (Start)
        - Action Node (DM Send, Comment Reply)
        - AI Node (Generate Caption, AI Reply)
        - Condition Node (If/Else)
    - **メインエリア**: 無限キャンバス（React Flow）。ノードを配置し、ラインで接続可能にする。
    - **ヘッダー**: 「保存」ボタン。「Back to List」ボタン。
    - **保存処理**: `POST /api/workflows` (Mock) をコールしてJSONを送信。

まずは「ノードを配置して線で繋げるだけのプロトタイプ」を完成させてください。
細かいプロパティ設定画面は後回しで構いません。
