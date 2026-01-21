# Phase 5: Member Features & Community - 作業引き継ぎ

## 📅 日付
2026年1月21日（水）

---

## ✅ Phase 4 完了状況

### Terminal 3 (Sub/AI) - 完了
- ✅ Issue #27 [Phase4] Sales FAQ & Recommendation AI (PR #31 マージ済)
- ✅ salesNode.ts - 質問分類ノード（価格、予約方法、サービス内容）
- ✅ recommendationEngine.ts - 製品推薦エンジン
- ✅ products.ts - 製品タイプ定義（5製品）

### Terminal 2 (Backend) - 完了
- ✅ Issue #32 [Phase4] Payment & Order API (クローズ済)
- ✅ Issue #33 [Phase4] Booking Management API (クローズ済)
- ✅ paymentService.ts - Stripeラッパー（モック済）
- ✅ orders.ts - 注文API
- ✅ bookings.ts - 予約API（空き枠確認含む）
- ✅ commerce.ts - 共通型定義

### Terminal 1 (Frontend) - 完了
- ✅ Issue #34 [Phase4] Service Landing Page (クローズ済)
- ✅ Issue #35 [Phase4] Product List & Checkout (クローズ済)
- ✅ services/page.tsx - サービス一覧ページ
- ✅ products/page.tsx - 製品一覧ページ（モック決済）

---

## 📋 Phase 5 作業計画

### GitHub Issues（作成済）

#### Frontend (Issue #36-38)
- #36 [Phase5] Member Dashboard - 会员専用ダッシュボード
- #37 [Phase5] Community Forum UI - コミュニティフォーラムUI
- #38 [Phase5] Event Announcement Page - イベント告知ページ

#### Backend (Issue #39)
- #39 [Phase5] Member & Community API - 会員管理・コミュニティAPI

#### AI (Issue #40)
- #40 [Phase5] AI Moderation & Welcome Node - AIモデレーション・ウェルカムノード

---

## 🎯 TodoList（明日作業）

### Frontend Tasks
1. **P5-1** Member Dashboard
   - Create: `frontend/src/app/dashboard/member/page.tsx`
   - Display purchased content (ebooks, videos, courses)
   - Show membership status and tier
   - Display purchase history
   - Implement access control

2. **P5-2** Community Forum UI
   - Create: `frontend/src/app/community/page.tsx`
   - Create: `frontend/src/app/community/topics/[id]/page.tsx`
   - Topic list with filtering and sorting
   - Thread view with nested replies
   - Post/reply creation
   - Voting and reactions

3. **P5-3** Event Announcement Page
   - Create: `frontend/src/app/events/page.tsx`
   - Event cards with date/time, location, capacity
   - Registration form with required fields
   - Calendar view or list view toggle
   - Event status (upcoming, ongoing, past)
   - My Events section

### Backend Tasks
4. **P5-4** Membership API
   - Create: `backend/src/api/routes/membership.ts`
   - GET /api/membership/status - 会員ステータス取得
   - GET /api/membership/purchases - 購入コンテンツ取得
   - PUT /api/membership/tier - 会員ティア更新
   - Extend user table with membership fields
   - Add membership tier field
   - Add purchase history tracking
   - Implement membership expiration logic

5. **P5-5** Community API
   - Create: `backend/src/api/routes/community.ts`
   - GET /api/community/topics - トピック一覧
   - POST /api/community/topics - トピック作成
   - GET /api/community/topics/:id - トピック詳細
   - POST /api/community/threads/:id/posts - 投稿作成
   - POST /api/community/posts/:id/replies - 返信作成

### AI Tasks
6. **P5-6** Moderation Service
   - Create: `backend/src/services/moderationService.ts`
   - Implement spam detection algorithm
   - Implement inappropriate content filtering
   - Add toxicity score calculation
   - Create moderation action (flag, remove, warn)
   - Moderation dashboard for review

7. **P5-7** Welcome Node
   - Create: `backend/src/services/nodes/welcomeNode.ts`
   - Implement automatic DM for new followers
   - Add template-based welcome messages
   - Support personalization (user attributes)
   - Rate limiting to avoid spamming
   - Customizable welcome templates
   - Personalization based on user tags

---

## 🔄 次のアクション

### 明日の開始時

1. **ターミナルの準備**
   - Terminal 1: Frontend（会員専用ダッシュボード）
   - Terminal 2: Backend（会員管理・コミュニティAPI）
   - Terminal 3: Sub/AI（AIモデレーション・ウェルカム）

2. **Issueの確認**
   - 各ターミナルで担当する Issue を確認
   - Issueのサブタスクを確認
   - Issueの受け入れ条件を確認

3. **作業の開始**
   - TodoWrite で P5-1 から開始
   - Git Workflow に従って Issue → ブランチ → 実装 → PR → マージ

4. **各タスクの完了基準**
   - すべての機能が実装されている
   - TypeScript コンパイルエラーなし
   - ファイルがコミットされている
   - PR が作成されマージされている
   - Issue がクローズされている

---

## 📝 コードパターン

### Frontend
- `'use client'` for pages with interactivity
- Tailwind CSS classes for styling
- Lucide React icons
- Responsive design (md:, lg: breakpoints)
- Error handling with try-catch
- Loading states with spinners

### Backend
- TypeScript interfaces for type safety
- Express Router for API routes
- Async/await for async operations
- Error responses with { success, error } structure
- Mock storage (in-memory) for development
- Status codes: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Error)

### AI Services
- Node pattern with execute() method
- Mock logic for development (AI API未接続時）
- Keyword-based classification as fallback
- Template-based responses
- Rate limiting for safety

---

## ⚠️ 注意点

1. **バックエンドAPI連携**
   - Frontend は `http://localhost:8000/api/...` を使用
   - CORS 設定を確認
   - Authorization ヘッダー: `Bearer ${token}`

2. **認証・認可**
   - ログイン済みユーザーのみアクセス可能
   - localStorage.getItem('accessToken') でトークン取得
   - API で認証チェック

3. **既存ファイルとの連携**
   - membershipService.ts, membership.ts 型定義
   - community.ts 型定義
   - moderationService.ts 新規作成
   - welcomeNode.ts 新規作成（既存のノードパターンに準拠）

---

## 🚀 開始コマンド

### Terminal 1 (Frontend)
```bash
cd "c:\Users\chatg\Obsidian Vault\papa\Apps\Tools\instagram\frontend"
git status
git checkout main
git pull
git checkout -b feature/phase5-member-dashboard
```

### Terminal 2 (Backend)
```bash
cd "c:\Users\chatg\Obsidian Vault\papa\Apps\Tools\instagram\backend"
git status
git checkout main
git pull
git checkout -b feature/phase5-membership-community-api
```

### Terminal 3 (Sub/AI)
```bash
cd "c:\Users\chatg\Obsidian Vault\papa\Apps\Tools\instagram\backend"
git status
git checkout main
git pull
git checkout -b feature/phase5-moderation-welcome-node
```

---

## 📊 進捗管理

各タスクが完了したら、TodoWrite で status を 'pending' → 'in_progress' → 'completed' に更新してください。

例：
- TodoWrite: P5-1 を 'in_progress' に設定して実装開始
- 実装完了後: P5-1 を 'completed' に設定
- 次に: P5-2 を 'in_progress' に設定

---

## 🎉 完了時のマイルストン

Phase 5 完了時、以下が実現されます：
- ✅ 会員専用ダッシュボードで購入済みコンテンツ閲覧可能
- ✅ コミュニティフォーラムでトピック、スレッド、投稿管理可能
- ✅ イベントページでイベント一覧と登録が可能
- ✅ バックエンドで会員管理、コミュニティAPIが提供される
- ✅ AIでスパム検出とウェルカムDMが実装される

---

**作成者**: Sisyphus (AI Assistant)
**作成日**: 2026年1月21日
**バージョン**: Phase 5 - 初版
