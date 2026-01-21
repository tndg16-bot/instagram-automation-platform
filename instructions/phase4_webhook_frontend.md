# Phase 4 Kick-off: Webhook UI (Frontend)

**あなたはFrontend担当です。Phase 4の「Webhook送信機能」のUI実装を行います。**

**Task: Issue #21 Webhook送信機能のフロントエンド実装**

## 背景
ユーザーがInstagramイベントを外部サービスに連携するためのWebhook設定画面と、送信ログ閲覧画面を実装します。

## 要件

### 1. ページ構成
**作成するページ**:
```
frontend/src/app/dashboard/integrations/
├── page.tsx                    - インテグレーション一覧画面 (Webhookタブ)
├── webhooks/
│   ├── page.tsx                - Webhook一覧画面
│   ├── create/page.tsx          - Webhook新規作成画面
│   └── [id]/
│       ├── page.tsx             - Webhook詳細画面
│       └── logs/
│           └── page.tsx         - Webhook送信ログ画面
```

### 2. 共通コンポーネント実装
**ファイル**: `frontend/src/components/webhooks/` (新規ディレクトリ)

- `WebhookList.tsx` - Webhook一覧リスト
- `WebhookCard.tsx` - 個別Webhookカード
- `EventSelector.tsx` - イベント種別選択チェックボックス
- `WebhookStatusBadge.tsx` - 有効/無効ステータスバッジ
- `LogStatusBadge.tsx` - 成功/失敗/再試行中ステータスバッジ

### 3. Webhook一覧画面 (`webhooks/page.tsx`)

**UI要素**:
- ヘッダー: "Webhook設定" タイトル + "新規Webhook作成" ボタン
- Webhookリスト:
  - カード表示: 名前、URL、イベント種別、有効/無効ステータス
  - アクションボタン: 編集、削除、ログ閲覧、テスト送信
- フィルター: 有効のみ / 全て表示

**データ取得**: `GET /api/webhooks`

### 4. Webhook新規作成/編集画面 (`webhooks/create/page.tsx`)

**UI要素**:
- フォーム項目:
  - **名前**: テキスト入力 (必須)
  - **URL**: URL入力 (必須、バリデーション: https://始まり)
  - **イベント**: チェックボックス (必須1つ以上)
    - ☑ DM受信
    - ☑ コメント受信
    - ☑ フォロー新規
    - ☑ いいね
    - ☑ メンション
  - **有効/無効**: トグルスイッチ

- アクションボタン: "保存"、"キャンセル"

**API呼び出し**:
- 新規作成: `POST /api/webhooks`
- 編集: `PUT /api/webhooks/:id`

### 5. Webhook送信ログ画面 (`webhooks/[id]/logs/page.tsx`)

**UI要素**:
- ヘッダー: Webhook名 + "ログ" タイトル
- ログテーブル:
  - 列: 時間、イベント種別、ステータス、HTTPステータスコード、再試行回数、エラーメッセージ、詳細ボタン
  - ページング: 20件/ページ

- ステータスフィルター: 成功 / 失敗 / 全て

**データ取得**: `GET /api/webhooks/:id/logs?page=1&limit=20`

- ログ詳細モーダル:
  - リクエストペイロード表示 (JSONフォーマット)
  - レスポンスボディ表示
  - エラーメッセージ詳細

### 6. APIフック実装
**ファイル**: `frontend/src/hooks/useWebhooks.ts` (新規)

```typescript
interface UseWebhooksReturn {
  webhooks: Webhook[];
  loading: boolean;
  error: string | null;
  createWebhook: (data: CreateWebhookData) => Promise<void>;
  updateWebhook: (id: string, data: UpdateWebhookData) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
  testWebhook: (id: string) => Promise<TestResult>;
}

// 実装するフック
export function useWebhooks(): UseWebhooksReturn { ... }
export function useWebhookLogs(webhookId: string): { logs: WebhookLog[]; ... } { ... }
```

### 7. データ型定義
**ファイル**: `frontend/src/types/webhooks.ts` (新規)

```typescript
export interface Webhook {
  id: string;
  user_id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  secret: string; // 表示時はマスク
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type WebhookEventType =
  | 'dm.received'
  | 'comment.created'
  | 'follow.new'
  | 'like.created'
  | 'mention.created';

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  error_message: string | null;
  retry_count: number;
  sent_at: string;
  completed_at: string | null;
}
```

### 8. デザイン要件

- **カラースキーム**:
  - 成功: 緑 (`bg-green-100 text-green-800`)
  - 失敗: 赤 (`bg-red-100 text-red-800`)
  - 再試行中: 黄色 (`bg-yellow-100 text-yellow-800`)
  - 待機中: グレー (`bg-gray-100 text-gray-800`)

- **レスポンシブデザイン**:
  - モバイル: 1列カード表示
  - タブレット: 2列カード表示
  - デスクトップ: 3列カード表示 / テーブル形式

- **インタラクション**:
  - 保存成功: トースト通知 + 一覧へ遷移
  - 削除確認: モーダルで確認
  - テスト送信成功: 成功メッセージ表示

## 実装手順

1. ✅ 型定義 (`types/webhooks.ts`)
2. ✅ 共通コンポーネント (`components/webhooks/`)
3. ✅ APIフック (`hooks/useWebhooks.ts`)
4. ✅ Webhook一覧画面 (`webhooks/page.tsx`)
5. ✅ Webhook新規作成画面 (`webhooks/create/page.tsx`)
6. ✅ Webhook送信ログ画面 (`webhooks/[id]/logs/page.tsx`)
7. ✅ インテグレーション一覧画面にWebhookタブ追加

まずは「一覧画面 + 新規作成画面」の基本機能を実装してください。ログ画面はバックエンドの送信エンジン実装後に追加でOKです。
