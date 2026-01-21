# Phase 4 Kick-off: Webhook送信機能 (Backend)

**あなたはBackend担当です。Phase 4のコア機能である「Webhook送信機能」のバックエンド実装を行います。**

**Task: Issue #21 Webhook送信機能のバックエンド実装**

## 背景
Instagramのイベント（DM受信、コメント、フォローなど）が発生した際、外部サービスに通知を送信するWebhook機能を実装します。

## 要件

### 1. DBスキーマ設計
**ファイル**: `backend/src/config/schema.sql` に追加

```sql
-- Webhookエンドポイント管理テーブル
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  events TEXT[] NOT NULL, -- ['dm.received', 'comment.created', 'follow.new', ...]
  secret VARCHAR(255) NOT NULL, -- HMAC署名用シークレット
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook送信ログテーブル
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  status VARCHAR(50) NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- インデックス作成
CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(sent_at DESC);
```

### 2. Webhook Service実装
**ファイル**: `backend/src/services/webhookService.ts` (新規)

```typescript
// 主な機能:
// 1. createWebhook() - Webhook新規作成
// 2. getWebhooks() - ユーザーのWebhook一覧取得
// 3. updateWebhook() - Webhook更新
// 4. deleteWebhook() - Webhook削除
// 5. triggerWebhooks() - イベント発生時の全Webhook送信トリガー
// 6. sendWebhook() - 個別Webhook送信 + 再試行ロジック
// 7. generateHMACSignature() - 署名生成
```

### 3. Webhook送信エンジン実装
**ファイル**: `backend/src/services/webhookDeliveryEngine.ts` (新規)

**要件**:
- **指数バックオック再試行**: 失敗時に1分、5分、15分...と間隔を伸ばす
- **最大再試行回数**: 5回まで
- **HMAC署名**: リクエストボディのSHA-256署名を `X-Webhook-Signature` ヘッダーに付与
- **タイムスタンプ検証**: `X-Webhook-Timestamp` ヘッダーでリプレイ攻撃を防止（5分以内のみ有効）
- **タイムアウト**: 30秒でHTTPリクエストをタイムアウト

**擬似コード**:
```typescript
async function sendWebhook(webhook: Webhook, event: WebhookEvent): Promise<void> {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < MAX_RETRIES) {
    try {
      const response = await axios.post(webhook.url, event.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': generateHMAC(event.payload, webhook.secret),
          'X-Webhook-Timestamp': Date.now().toString(),
          'X-Webhook-ID': generateUUID()
        },
        timeout: 30000
      });

      if (response.status >= 200 && response.status < 300) {
        // 成功
        await logDelivery(webhook.id, event, 'success', response.status);
        return;
      }
    } catch (error) {
      lastError = error;
      await logDelivery(webhook.id, event, 'retrying', null, error.message);
    }

    retryCount++;
    if (retryCount < MAX_RETRIES) {
      // 指数バックオック: 1分、5分、15分、30分
      const delay = Math.min(60000 * Math.pow(5, retryCount - 1), 1800000);
      await sleep(delay);
    }
  }

  // 全て再試行失敗
  await logDelivery(webhook.id, event, 'failed', null, lastError?.message);
}
```

### 4. APIエンドポイント実装
**ファイル**: `backend/src/api/routes/webhook.ts` (新規)

**エンドポイント**:
```typescript
// Webhook管理 (CRUD)
POST   /api/webhooks          - Webhook新規作成
GET    /api/webhooks          - ユーザーのWebhook一覧取得
GET    /api/webhooks/:id      - Webhook詳細取得
PUT    /api/webhooks/:id      - Webhook更新
DELETE /api/webhooks/:id      - Webhook削除

// テスト送信
POST   /api/webhooks/:id/test - テスト用ダミーペイロード送信

// ログ取得
GET    /api/webhooks/:id/logs - Webhook送信ログ一覧（ページング）
GET    /api/webhooks/:id/logs/:logId - 個別ログ詳細
```

### 5. イベントトリガー実装
**場所**: 既存のサービスから `triggerWebhooks()` を呼び出す

- `dmService.ts`: DM受信時 → `triggerWebhooks(userId, 'dm.received', payload)`
- `commentService.ts`: コメント受信時 → `triggerWebhooks(userId, 'comment.created', payload)`
- `instagramService.ts`: フォロー時 → `triggerWebhooks(userId, 'follow.new', payload)`

### 6. テストスクリプト
**ファイル**: `scripts/test_webhook_logic.ts`

- 単体テスト: `webhookService.ts` のCRUD動作確認
- 送信テスト: Mock Webhook URL（webhook.siteなど）に実際に送信して動作確認
- 再試行テスト: 失敗URLで再試行ロジック動作確認

## 実装手順

1. ✅ DBスキーマ追加 (`schema.sql`)
2. ✅ `webhookService.ts` 実装 (CRUD + HMAC署名)
3. ✅ `webhookDeliveryEngine.ts` 実装 (送信 + 再試行ロジック)
4. ✅ `webhook.ts` APIルート実装
5. ✅ 既存サービスからイベントトリガー呼び出し追加
6. ✅ テストスクリプト作成・実行

まずは「CRUD + HMAC署名」の基本機能を実装してください。再試行ロジックはMock Modeでも動作するようにしてください。
