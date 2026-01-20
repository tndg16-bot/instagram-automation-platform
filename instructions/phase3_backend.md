# Configuration Update
これからの対話、コードの説明、コミットメッセージは全て **「日本語」** で行ってください。

# Phase 3 Kick-off: Workflow Engine
あなたはBackend担当です。Phase 3のコアとなる「ワークフローエンジン」のAPIとデータ構造を定義します。

**Task: Issue #18 ワークフローAPIとデータ構造の定義**

## 要件
1.  **DBスキーマ設計 (Mock/Real)**: 
    - `workflows` テーブルを想定。
    - カラム: 
        - `id` (UUID)
        - `user_id` (UUID)
        - `name` (String)
        - `nodes` (JSONB) - React Flowのnodesデータ
        - `edges` (JSONB) - React Flowのedgesデータ
        - `is_active` (Boolean)
        - `created_at`, `updated_at`

2.  **API実装**:
    - ファイル: `backend/src/api/routes/workflow.ts` (既存拡張)
    - ファイル: `backend/src/services/workflowService.ts` (新規/拡張)
    - Endpoints:
        - `POST /api/workflows`: 新規作成・更新
        - `GET /api/workflows`: 一覧取得
        - `GET /api/workflows/:id`: 詳細取得
        - `DELETE /api/workflows/:id`: 削除
        - `POST /api/workflows/:id/execute`: (枠だけ作成) 即時実行トリガー

まずはフロントエンドから送られてくるJSONデータをそのまま保存・取得できるCRUDを完璧に実装してください。
バリデーションは最低限で構いません。
