# プロジェクト管理・Issue作成ガイド

## 概要
Instagram Automation Platform開発におけるIssue管理、タスク割り振り、マルチAI協業の運用ルールを定義します。

## 役割分担

| 役割 | 担当AIエージェント | 主な責任 | チャンネル |
|--------|------------------|-----------|----------|
| **プロジェクト管理者** | 自分（ユーザー） | 全体調整、Git管理、Issue割り振り、競合防止 | #project-management |
| **フロントエンド担当** | AI Agent 1 | 画面開発、UI/UX、ステート管理 | #frontend |
| **バックエンド担当** | AI Agent 2 | API開発、ビジネスロジック、DB操作 | #backend |
| **インフラ担当** | AI Agent 3 | サーバー、CI/CD、監視、セキュリティ | #infrastructure |
| **アナリティクス担当** | GLM-4.7 | データ分析、テスト、ドキュメント | #analytics |

## Issue作成ルール

### 1. Issue作成タイミング
- **新機能**: 開発前にIssueを作成
- **バグ修正**: 発見時即時Issue作成
- **リファクタ**: 変更前にIssue作成

### 2. Issueタイトル形式
```
[Frontend] コメント自動返信画面の実装
[Backend] Instagram Graph API連携の実装
[Infra] CI/CDパイプラインの設定
[Analytics] 配信効果測定ロジックの実装
```

### 3. Issueラベル
```
frontend    - フロントエンド関連
backend     - バックエンド関連
infrastructure - インフラ関連
analytics   - アナリティクス関連
documentation - ドキュメント関連
high-priority - 高優先度（24時間以内に対応）
Phase 1 - Phase 5 - フェーズ分類
bug         - バグ修正
enhancement  - 機能追加
refactor     - リファクタ
```

### 4. Issue担当者（Assignee）
```
@agent-1       - AI Agent 1（フロントエンド）
@agent-2       - AI Agent 2（バックエンド）
@agent-3       - AI Agent 3（インフラ）
@GLM-4.7       - GLM-4.7（アナリティクス）
```

## タスク割り振り方針

### 基本ルール
1. **1つのIssue = 1つのエージェントが完了まで担当**
2. **フロントエンドとバックエンドは連携が必要な場合、API仕様を合意してから実装**
3. **インフラはエージェントからの要請に応じて対応**
4. **アナリティクスはAPI完成後から着手**
5. **自分（プロジェクト管理者）は全体進捗監視とIssue割り振り**

### 競合防止

#### ブランチ競合の防止
- 各エージェントは担当領域のブランチで作業
- `feature/frontend-*` - AI Agent 1のみ
- `feature/backend-*` - AI Agent 2のみ
- `feature/infra-*` - AI Agent 3のみ
- `feature/analytics-*` - GLM-4.7のみ

#### コミット頻度の調整
- こまめなコミットを勧奨（機能単位）
- 頻繁なプッシュで他エージェントとの競合を回避
- 毎日の定時Syncで最新のコードを取り込む

#### Issueの粒度
- **大すぎるIssue**: 2週間以上かかるものは分割
- **小さすぎるIssue**: 同じ機能の一部はまとめる
- **目安**: 1つのIssueは2-5日で完了できる範囲

## Issue作成コマンド（自分用）

### プロジェクト全体のIssue作成
```bash
# Phase 1のIssue一括作成
gh issue create --title "[Project] Phase 1: MVP開発開始" --body "Phase 1の全Issueを作成します" --label "Phase 1" --assignee @your-username

gh issue create --title "[Frontend] ダッシュボード基盤実装" --label "frontend,Phase 1,enhancement" --assignee @agent-1
gh issue create --title "[Backend] Instagram Graph APIクライアント実装" --label "backend,Phase 1,enhancement" --assignee @agent-2
gh issue create --title "[Infra] 開発環境のDocker構築" --label "infrastructure,Phase 1,enhancement" --assignee @agent-3
gh issue create --title "[Analytics] E2Eテスト計画" --label "analytics,Phase 1,enhancement" --assignee @GLM-4.7
```

### 各担当のIssue作成例

#### フロントエンド用（AI Agent 1）
```bash
# ログイン画面実装
gh issue create \
  --title "[Frontend] ログイン画面の実装" \
  --body "## 説明
ユーザーログイン機能を実装します。

## タスク
- [ ] メール/パスワード入力フォーム
- [ ] Google OAuthボタン
- [ ] バリデーション実装
- [ ] エラーハンドリング

## 関連ファイル
- frontend/src/components/LoginForm.tsx
- frontend/src/pages/login.tsx

## 進捗
- ログイン画面UI: 進行中
- フォームバリデーション: 未実装
" \
  --label "frontend,Phase 1,enhancement" \
  --assignee @agent-1
```

#### バックエンド用（AI Agent 2）
```bash
# DM一斉配信API実装
gh issue create \
  --title "[Backend] DM一斉配信APIの実装" \
  --body "## 説明
Instagram Graph APIを使用して、一斉DM送信機能を実装します。

## タスク
- [ ] Instagram Graph APIクライアント作成
- [ ] レート制限ハンドリング実装
- [ ] 配信エンジン実装
- [ ] エラーハンドリング
- [ ] 単体テスト作成

## APIエンドポイント
- POST /api/dm/broadcast
- GET /api/dm/campaigns/:id

## レート制限
- 1日あたり: 最大1,000件
- 1分あたり: 最大100件

## 進捗
- APIクライアント: 進行中
- 配信エンジン: 未実装
" \
  --label "backend,Phase 1,enhancement" \
  --assignee @agent-2
```

#### インフラ用（AI Agent 3）
```bash
# CI/CDパイプライン構築
gh issue create \
  --title "[Infra] GitHub Actions CI/CDパイプライン構築" \
  --body "## 説明
開発から本番までのCI/CDパイプラインを構築します。

## タスク
- [ ] テストジョブ作成（lint, unit test）
- [ ] Dockerイメージビルド
- [ ] ECRへのプッシュ
- [ ] ECSへデプロイ
- [ ] 本番デプロイワークフロー（手動トリガー）

## パイプライン段階
1. テスト実行
2. Dockerイメージビルド
3. ECRプッシュ
4. ECSデプロイ

## 進捗
- GitHub Actionsワークフロー: 未作成
- ECR設定: 未実装
" \
  --label "infrastructure,Phase 1,enhancement" \
  --assignee @agent-3
```

#### アナリティクス用（GLM-4.7）
```bash
# E2Eテストシナリオ作成
gh issue create \
  --title "[Analytics] E2Eテストシナリオの作成" \
  --body "## 説明
主要ユーザーフローのE2Eテストシナリオを作成します。

## テストシナリオ
1. **ユーザー登録 → ログイン → ダッシュボード**
2. **Instagramアカウント連携**
3. **DM作成 → スケジュール設定 → 配信実行**
4. **コメント監視 → 自動返信確認**
5. **アナリティクス確認 → レポート出力**

## タスク
- [ ] テストケース定義
- [ ] Playwrightスクリプト作成
- [ ] テストデータ準備
- [ ] CI連携

## カバレッジ目標
- 全体: 80%以上
- 主要フロー: 90%以上

## 進捗
- シナリオ1: 定義完了
- シナリオ2-5: 未定義
" \
  --label "analytics,Phase 1,enhancement" \
  --assignee @GLM-4.7
```

## 進捗管理

### 1日3回のSync（18:00 JST）

#### フォーマット
```markdown
## 📊 進捗共有会議 - [日付]

**日時**: 2026年1月20日 18:00
**参加者**: 自分, AI Agent 1, AI Agent 2, AI Agent 3, GLM-4.7

---

### 1. プロジェクト全体

| Phase | 予定 | 実績 | 遅延 | 障害 |
|--------|--------|--------|--------|--------|
| Phase 1 | 3ヶ月 | - | - | - |

### 2. 各エージェントの進捗

#### AI Agent 1 (Frontend)
- **担当Issue**: #[番号] [タイトル]
- **状態**: 進行中 / 完了 / ブロッキング
- **進捗率**: XX%
- **今日の成果**: [箇条書き]
- **明日の予定**: [箇条書き]
- **ブロッキング課題**: [あれば詳細]

#### AI Agent 2 (Backend)
- **担当Issue**: #[番号] [タイトル]
- **状態**: 進行中 / 完了 / ブロッキング
- **進捗率**: XX%
- **今日の成果**: [箇条書き]
- **明日の予定**: [箇条書き]
- **ブロッキング課題**: [あれば詳細]

#### AI Agent 3 (Infrastructure)
- **担当Issue**: #[番号] [タイトル]
- **状態**: 進行中 / 完了 / ブロッキング
- **進捗率**: XX%
- **今日の成果**: [箇条書き]
- **明日の予定**: [箇条書き]
- **ブロッキング課題**: [あれば詳細]

#### GLM-4.7 (Analytics)
- **担当Issue**: #[番号] [タイトル]
- **状態**: 進行中 / 完了 / ブロッキング
- **進捗率**: XX%
- **今日の成果**: [箇条書き]
- **明日の予定**: [箇条書き]
- **ブロッキング課題**: [あれば詳細]

### 3. プロジェクト管理者（自分）からの連絡事項

#### 進捗良好
- ✅ 週次目標達成見込み
- ✅ ブロッキング課題なし

#### 対応が必要
- ⚠️ **Issue名**: [詳細]
  - 課題: [説明]
  - 期待する対応: [具体的なアクション]
  - 期限: [日時]

#### 次回Sync
- **次回日時**: 2026年1月21日 18:00
- **議題**: [確認したい事項]

---

## 次回Action Item
1. [ ] AI Agent 1: [アクション]
2. [ ] AI Agent 2: [アクション]
3. [ ] AI Agent 3: [アクション]
4. [ ] GLM-4.7: [アクション]
```

### GitHub Projectsによる管理

#### ボード構成
```
[To Do]
├── Phase 1 Issues (未着手)
│   ├── #1 プロジェクトセットアップ (frontend)
│   ├── #2 プロジェクトセットアップ (backend)
│   ├── #3 プロジェクトセットアップ (infrastructure)
│   └── #4 Instagram Graph API連携 (backend)

[In Progress]
├── #5 ダッシュボード実装 (frontend)
└── #6 認証機能実装 (backend)

[In Review]
├── #7 ログイン画面 (PR #10)
└── #8 APIクライアント (PR #12)

[Done]
├── #1 プロジェクトセットアップ (frontend) ✓
├── #2 プロジェクトセットアップ (backend) ✓
└── #3 プロジェクトセットアップ (infrastructure) ✓
```

## ブロッキング課題の報告フロー

### 1. ブロッキングの定義
以下のどれかに当てはる場合、即時報告：
- **技術的なブロッキング**: 他エージェントの作業が待ていない
- **API仕様未定**: バックエンドAPIが決まっていない
- **インフラ未準備**: 開発環境が整っていない
- **優先度変更**: より重要なタスクが発生

### 2. 報告方法

#### 即時報告（チャンネル #emergency）
```
🚨 緊急: ブロッキング報告

**担当者**: AI Agent X
**担当Issue**: #[番号]
**課題**: [詳細]

**期待する対応**:
- [ ] 問題確認（他エージェント）
- [ ] 解決案提示
- [ ] タスク調整

**期限**: 1時間以内に対応
```

#### 非緊急（次回Sync）
```
⚠️ ブロッキング課題報告

**担当者**: AI Agent X
**担当Issue**: #[番号]
**課題**: [詳細]

**対処方針**:
1. 次回Syncで検討
2. 必要に応じてIssue調整
3. スケジュール再調整

```

## PR（プルリクエスト）管理

### 1. PR作成ルール
- **同一IssueのPR**: 1つのPRは1つのIssueを解決
- **タイトル形式**: `[Frontend] Issueタイトル (#Issue番号)`
- **説明**: テンプレートを使用（.github/PULL_REQUEST_TEMPLATE.md）
- **レビュアー**: 他のエージェントと自分をレビュアーに設定
- **ラベル**: `ready-for-review`, `wip`

### 2. レビューフロー

```
担当エージェント
    ↓
PR作成（Draft or Ready for Review）
    ↓
自動テスト実行（CI/CD）
    ↓
レビュアーにタグ付与（@mention）
    ↓
他エージェントによるレビュー
    ↓
修正リクエスト（あれば）
    ↓
承認後、developブランチへマージ
```

### 3. レビュー観点チェックリスト

#### 機能面
- [ ] 仕様通りに動作するか
- [ ] エッジケースを考慮しているか
- [ ] ユーザーフレンドリーになっているか

#### コード品質
- [ ] Lintチェックを通過しているか
- [ ] 型チェック（TypeScript）を通過しているか
- [ ] コードが読みやすく、再利用可能か
- [ ] 適切な変数名、関数名を使用しているか
- [ ] コメントが十分か

#### パフォーマンス
- [ ] APIレスポンスタイムは許容範囲内か
- [ ] データベースクエリは最適化されているか
- [ ] フロントエンドのレンダリングはスムーズか

#### セキュリティ
- [ ] 入力値のバリデーションがあるか
- [ ] 認証・認可が適切か
- [ ] 機密情報が適切に扱われているか
- [ ] SQLインジェクション対策があるか

#### テスト
- [ ] ユニットテストが十分か（80%以上）
- [ ] インテグレーションテストがあるか
- [ ] テストが通過しているか

## GitHubリポジトリ作成手順

### 1. リポジトリ作成
```bash
# GitHub CLIで作成（ghコマンド使用）
gh repo create instagram-automation-platform \
  --public \
  --description "Instagram Automation Platform with Multi-AI Collaboration" \
  --clone \
  --source=.

# またはGitHub Webから作成
# 1. GitHubにログイン
# 2. 右上の「+」→「New repository」
# 3. Repository name: instagram-automation-platform
# 4. Description: Instagram Automation Platform with Multi-AI Collaboration
# 5. Visibility: Public or Private
# 6. Initialize with: README.md
# 7. 「Create repository」
```

### 2. リモートURL設定
```bash
cd instagram-automation-platform

# リモートURL設定（ダミーURLを実際のURLに置換）
git remote set-url origin https://github.com/your-username/instagram-automation-platform.git

# 確認
git remote -v
```

### 3. 保護ルール設定
```bash
# mainブランチの保護
gh api -X PUT repos/your-username/instagram-automation-platform/branches/main/protection \
  --body '{
    "required_status_checks": [],
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1
    },
    "restrictions": {
      "users": [],
      "teams": ["core-team"]
    }
  }'

# developブランチの保護
gh api -X PUT repos/your-username/repository-name/branches/develop/protection \
  --body '{
    "required_status_checks": ["ci/cd"],
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1
    }
  }'
```

## GitHub Projects設定

### 1. プロジェクトボード作成
```bash
# GitHub CLIでプロジェクト作成
gh project create --owner your-username \
  --title "Instagram Automation Development" \
  --public \
  --description "Main development board for Instagram Automation Platform"

# カラム作成
gh project column create --project-id PROJECT_ID --title "To Do"
gh project column create --project-id PROJECT_ID --title "In Progress"
gh project column create --project-id PROJECT_ID --title "In Review"
gh project column create --project-id PROJECT_ID --title "Done"
```

### 2. Issueとプロジェクトの連携
```bash
# Issue作成時にプロジェクトカードも作成
gh issue create \
  --title "Issueタイトル" \
  --body "Issue説明" \
  --label "frontend" \
  --assignee @agent-1 \
  --project "Instagram Automation Development"
```

## 自分（プロジェクト管理者）の役割

### 1. 進捗監視
- 毎日の進捗共有会議の主催
- 各エージェントの進捗率の確認
- ブロッキング課題の特定・解決
- マイルストーンの進捗管理

### 2. Issue管理
- PhaseごとのIssue一括作成
- Issueの担当者割り振り
- Issueの優先度調整
- 重複Issueの統合・分離

### 3. コード統合
- 各エージェントのPRレビュー
- developブランチへのマージ判断
- ブランチ保護ルールの適用
- マージコンフリクトの解決支援

### 4. リリース管理
- リリースノートの作成
- Gitタグの作成
- GitHubリリースの作成
- リリース後のアナウンス

### 5. コミュニケーション
- 各エージェントとの頻繁なコミュニケーション
- 進捗共有会議のスケジューリング
- ドキュメントの更新管理
- チャンネルでの情報共有

## 定期作業スケジュール

### 毎日
- **18:00 JST**: 進捗共有会議（30分〜1時間）
- **19:00 JST**: 次日のIssue確認・タスク調整

### 毎週
- **金曜日**: 週次進捗確認と振り返り
- **週次KPI確認**: Issue解決数、PRマージ率、コードカバレッジ

### マイルストーンごとの確認
- **Phase 1完了時**: Phase 2のIssue作成とキックオフ
- **MVPリリース時**: ユーザーフィードバック収集とPhase 2の開始
- **v1.0リリース時**: 全体機能確認とPhase 3の開始

## 緊急時の対応フロー

### システム障害
1. **発見**: 監視システムが検知
2. **報告**: #emergencyチャンネルで即時報告
3. **対応**: 該当エージェント（AI Agent 3）が調査・対応
4. **復旧**: 復旧後、全チームで振り返り
5. **事後**: 後レビューを実施

### APIダウン
1. **発見**: ユーザーからの報告または監視検知
2. **調査**: バックエンド担当が原因特定
3. **対処**: 修正とデプロイ
4. **通知**: 全チームに復旧通知

### データベース障害
1. **発見**: アプリケーションからのエラー
2. **調査**: インフラ担当が原因特定
3. **対処**: 復旧またはフェイルオーバー
4. **検証**: 全体テスト実施

---

このドキュメントに基づき、プロジェクトを効率的に進めます。
4つのAIエージェントと自分が連携し、Instagram Automation Platformを完成させましょう！🚀
