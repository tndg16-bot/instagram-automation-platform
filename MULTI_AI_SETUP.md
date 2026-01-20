# Instagram自動化SaaS マルチAI作業環境セットアップ

## 概要
4つのAIエージェントと1人間が同時に稼働し、Instagram Automation Platform（InstaFlow AI）を開発する環境セットアップ

## 役割分担

| AIエージェント | 役割 | 担当領域 | ターミナル |
|--------------|--------|-----------|----------|
| AI Agent 1 (Frontend) | フロントエンド開発 | React/Next.js, UIコンポーネント | Terminal 1 |
| AI Agent 2 (Backend) | バックエンドAPI開発 | Node.js/Python, Instagram Graph API | Terminal 2 |
| AI Agent 3 (Infra) | インフラ・DevOps | AWS/GCP, CI/CD, Docker | Terminal 3 |
| ユーザー (自分) | プロジェクト管理・統合 | 全体調整、Git管理 | - |
| GLM-4.7 | アナリティクス・テスト | データ分析, E2Eテスト | - |

## タスク割り振り方針

### 分類基準
- **フロントエンド**: 画面開発、UIコンポーネント、ステート管理
- **バックエンド**: APIエンドポイント、ビジネスロジック、DB操作
- **インフラ**: サーバー、データベース、CI/CD、監視
- **アナリティクス/テスト**: データ分析、テスト、ドキュメント

### 競合防止ルール
1. **Issue単位で担当**: 1つのIssueは1つのエージェントが完了まで担当
2. **ブランチ戦略**:
   - `feature/frontend-*`: フロントエンドエージェント
   - `feature/backend-*`: バックエンドエージェント
   - `feature/infra-*`: インフラエージェント
   - `feature/analytics-*`: GLM-4.7
3. **プルリクエストの競合確認**: PR作成前に最新mainをマージ
4. **定時同期**: 毎日1回、各エージェントの進捗を共有

## GitHubリポジトリ構成

```
instagram-automation-platform/
├── frontend/                 # Terminal 1担当
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Terminal 2担当
│   ├── src/
│   │   ├── api/
│   │   ├── services/
│   │   └── models/
│   ├── tests/
│   ├── package.json
│   └── requirements.txt
│
├── infrastructure/             # Terminal 3担当
│   ├── terraform/
│   ├── docker/
│   ├── k8s/
│   └── scripts/
│
├── analytics/                 # GLM-4.7担当
│   ├── dashboard/
│   ├── reports/
│   └── tests/
│
├── docs/                    # 共同管理
│   ├── api/
│   ├── architecture/
│   └── user-guide/
│
├── .github/
│   ├── workflows/
│   └── ISSUE_TEMPLATE/
└── README.md
```

## ブランチ戦略

| ブランチパターン | 用途 | 担当エージェント |
|----------------|------|----------------|
| `main` | 本番ブランチ | プロジェクト管理者（ユーザー） |
| `develop` | 開発統合ブランチ | プロジェクト管理者（ユーザー） |
| `feature/frontend-*` | フロントエンド機能開発 | AI Agent 1 |
| `feature/backend-*` | バックエンド機能開発 | AI Agent 2 |
| `feature/infra-*` | インフラ変更 | AI Agent 3 |
| `feature/analytics-*` | アナリティクス機能 | GLM-4.7 |
| `fix/*` | バグ修正 | 関連エージェント |
| `hotfix/*` | 本番バグ緊急修正 | 関連エージェント |

## Issueタグ管理

| タグ | 意味 | 割り振り |
|------|--------|----------|
| `frontend` | フロントエンド関連 | AI Agent 1 |
| `backend` | バックエンド関連 | AI Agent 2 |
| `infrastructure` | インフラ関連 | AI Agent 3 |
| `analytics` | アナリティクス関連 | GLM-4.7 |
| `documentation` | ドキュメント関連 | ユーザー |
| `high-priority` | 高優先度 | 即時対応 |
| `Phase 1`-`Phase 5` | フェーズ分類 | 全エージェント |

## 作業フロー

### 1. Issue作成と割り振り
```
ユーザー（自分）
  ↓
GitHub Issue作成（適切なタグ付与）
  ↓
担当エージェントのメンション
  ↓
担当エージェントがIssue確認
  ↓
ブランチ作成（feature/{role}-{issue-number}-{description}）
```

### 2. 開発作業
```
担当エージェント
  ↓
ターミナルでブランチ作成・切替
  ↓
開発作業（該当ターミナル）
  ↓
コミット・プッシュ
```

### 3. プルリクエスト
```
担当エージェント
  ↓
PR作成（テンプレート使用）
  ↓
自動テスト実行（CI/CD）
  ↓
他エージェントのレビュー依頼
  ↓
承認後、developブランチへマージ
```

### 4. 定時同期
```
毎日18:00 JST
  ↓
Slack/チャットで進捗共有
  ↓
各エージェントが本日の成果報告
  ↓
ブロッキング課題の特定・解決
```

## コミュニケーションルール

### Issue報告フォーマット
```markdown
## Issue 状況報告 - [日付]

**担当エージェント**: [名前]
**対象Issue**: #[番号]
**現在の進捗**: [進行中/完了/ブロッキング]

### 本日の作業内容
- [箇条書き]

### 明日の予定
- [箇条書き]

### ブロッキング課題
- （あれば詳細）

### 必要なリソース
- （あれば詳細）
```

### PRレビューフォーマット
```markdown
## レビュー依頼 - PR #[番号]

**担当エージェント**: [名前]
**関連Issue**: #[番号]
**変更点**: [要約]

### 主な変更
- [箇条書き]

### テスト状況
- [ ] ユニットテスト: パス/失敗
- [ ] インテグレーションテスト: パス/失敗
- [ ] E2Eテスト: パス/失敗

### レビュー観点
- [ ] 機能仕様合致
- [ ] コード品質
- [ ] パフォーマンス
- [ ] セキュリティ

### その他
[自由記述]
```

## タスク管理ツール設定

### GitHub Projects
1. プロジェクトボード作成: "Instagram Automation Development"
2. カラム設定:
   - To Do
   - In Progress
   - In Review
   - Done
3. 各エージェントに権限付与

### ラベル自動割り振り
GitHub Actionsで自動ラベル付与を設定:

```yaml
name: Auto Label

on:
  pull_request:
    types: [opened, edited]

jobs:
  auto-label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          configuration-path: .github/labeler.yml
```

## 開発環境

### ローカル開発環境
- **フロントエンド**: `http://localhost:3000` (Terminal 1)
- **バックエンド**: `http://localhost:8000` (Terminal 2)
- **インフラ**: Docker Compose (Terminal 3)
- **アナリティクス**: `http://localhost:4000` (GLM-4.7)

### 共有データベース
- 開発用DB: PostgreSQL (インフラ担当がセットアップ)
- テストDB: PostgreSQL (自動でリセット)
- キャッシュ: Redis

## 成功指標（KPI）

| KPI | 目標 | 測定頻度 |
|------|--------|-----------|
| Issue解決数/週 | 10件以上 | 週次 |
| PRマージ率 | 90%以上 | 週次 |
| ブロッキング課題数 | 1件以下 | 日次 |
| コードカバレッジ | 80%以上 | 週次 |
| 平均PRレビュー時間 | 24時間以内 | 週次 |

## 緊急時の対応フロー

1. **バグ発見**: Issueを`hotfix/*`ブランチで作成
2. **システム障害**: #emergency チャンネルで即時報告
3. **APIエラー**: 監視システムが自動通知
4. **リリース停止**: チャンネルで全員周知

---

このセットアップに基づき、各ターミナル用の初期化スクリプトを作成します。
