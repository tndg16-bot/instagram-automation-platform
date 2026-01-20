# クイックスタート - Multi-AI作業開始手順

## 🎯 概要
4つのAIエージェントと1人のプロジェクト管理者が同時にInstagram Automation Platformを開発するための初期設定ガイドです。

## 📋 事前準備チェクリスト

- [ ] GitHubアカウントを作成済み
- [ ] GitHub CLI (`gh`) をインストール済み
- [ ] Node.js 18+ をインストール済み
- [ ] Docker & Docker Compose をインストール済み
- [ ] Git 2.30+ をインストール済み
- [ ] 3つのターミナルを開いている

## 🚀 クイックスタート手順

### ステップ 1: GitHubリポジトリ作成（5分）

**担当者**: 自分（プロジェクト管理者）

#### 1.1 GitHub CLIでリポジトリ作成
```bash
# GitHubにログイン済みと仮定します
gh repo create instagram-automation-platform \
  --public \
  --description "Instagram Automation Platform with Multi-AI Collaboration" \
  --clone \
  --source=.
```

#### 1.2 リモートURL設定
```bash
cd "C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram"
git remote set-url origin https://github.com/your-username/instagram-automation-platform.git
```

#### 1.3 リモート確認
```bash
git remote -v
# 結果: origin https://github.com/your-username/instagram-automation-platform.git (fetch)
```

### ステップ 2: 全ターミナルのセットアップ実行（15分）

**担当者**: 各AIエージェント

#### 2.1 Terminal 1: フロントエンド
```bash
# Terminal 1で実行
bash "C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram/terminal1_frontend_setup.sh"
```

**完了確認**: `frontend/` ディレクトリが作成され、Next.jsプロジェクトが初期化されている

#### 2.2 Terminal 2: バックエンド
```bash
# Terminal 2で実行
bash "C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram/terminal2_backend_setup.sh"
```

**完了確認**: `backend/` ディレクトリが作成され、Express + TypeScriptプロジェクトが初期化されている

#### 2.3 Terminal 3: インフラ
```bash
# Terminal 3で実行
bash "C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram/terminal3_infra_setup.sh"
```

**完了確認**: `infrastructure/` ディレクトリが作成され、Terraform・Kubernetes設定が準備されている

### ステップ 3: 初期コミットとプッシュ（10分）

**担当者**: 自分（プロジェクト管理者）

```bash
cd "C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram"

# 全エージェントの変更を追加
git add .

# 最初のコミット
git commit -m "chore: multi-AI project initialization

✨ Features:
- Frontend: Next.js + TypeScript setup (AI Agent 1)
- Backend: Express + TypeScript + PostgreSQL setup (AI Agent 2)
- Infrastructure: Terraform + Kubernetes setup (AI Agent 3)

📚 Infrastructure:
- GitHub workflows (CI/CD, PR templates, Issue templates)
- Project structure for multi-AI collaboration
- Branch strategy: feature/{role}-*
- Labeler for automatic PR labeling

📝 Documentation:
- Business Plan (事業計画書.md)
- Requirements Definition (要件定義書.md)
- Development Phases (開発フェーズ計画.md)
- Multi-AI Setup Guide (MULTI_AI_SETUP.md)
- Project Management Guide (PROJECT_MANAGEMENT.md)

🎯 Team Setup:
- AI Agent 1: Frontend (Terminal 1) - Ready to start
- AI Agent 2: Backend (Terminal 2) - Ready to start
- AI Agent 3: Infrastructure (Terminal 3) - Ready to start
- GLM-4.7: Analytics - Ready to start
- Project Manager (自分) - Coordination & GitHub management

🏗 Next Steps:
1. GitHub repository creation
2. Phase 1 Issue creation
3. Start development by agents
"

# mainブランチの作成
git branch -M main

# リモートにプッシュ
git push -u origin main

echo "✅ Initial commit pushed to GitHub!"
```

### ステップ 4: GitHubリポジトリの保護設定（5分）

**担当者**: 自分（プロジェクト管理者）

#### 4.1 ブランチ保護設定
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

echo "✅ Main branch protection configured"
```

#### 4.2 developブランチの作成と保護
```bash
# developブランチ作成
git checkout -b develop
git push -u origin develop

# developブランチの保護
gh api -X PUT repos/your-username/instagram-automation-platform/branches/develop/protection \
  --body '{
    "required_status_checks": ["ci/cd"],
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1
    }
  }'

echo "✅ Develop branch created and protected"
```

### ステップ 5: Phase 1のIssue一括作成（10分）

**担当者**: 自分（プロジェクト管理者）

GitHub CLIで一括作成:
```bash
cd "C:/Users/chatg/Obsidian Vault/papa/Apps/Tools/instagram"

# Phase 1メインIssue
gh issue create \
  --title "[Project] Phase 1: MVP開発開始" \
  --body "Phase 1の全タスクを管理する親Issueです。" \
  --label "Phase 1"

# AI Agent 1用Issue
gh issue create --title "[Frontend] ダッシュボード基盤実装" --label "frontend,Phase 1" --assignee @agent-1
gh issue create --title "[Frontend] ログイン画面実装" --label "frontend,Phase 1" --assignee @agent-1
gh issue create --title "[Frontend] Instagramアカウント連携画面" --label "frontend,Phase 1" --assignee @agent-1

# AI Agent 2用Issue
gh issue create --title "[Backend] Instagram Graph APIクライアント実装" --label "backend,Phase 1" --assignee @agent-2
gh issue create --title "[Backend] DM一斉配信機能実装" --label "backend,Phase 1" --assignee @agent-2
gh issue create --title "[Backend] コメント自動返信機能実装" --label "backend,Phase 1" --assignee @agent-2

# AI Agent 3用Issue
gh issue create --title "[Infra] 開発環境Docker構築" --label "infrastructure,Phase 1" --assignee @agent-3
gh issue create --title "[Infra] CI/CDパイプライン設定" --label "infrastructure,Phase 1" --assignee @agent-3

# GLM-4.7用Issue
gh issue create --title "[Analytics] 基本アナリティクス計画" --label "analytics,Phase 1" --assignee @GLM-4.7

echo "✅ Phase 1 issues created successfully!"
```

### ステップ 6: GitHub Projectsの設定（5分）

**担当者**: 自分（プロジェクト管理者）

```bash
# プロジェクト作成
PROJECT_ID=$(gh project create \
  --owner your-username \
  --title "Instagram Automation Development" \
  --public)

echo "Project ID: $PROJECT_ID"

# カラム作成
gh project column create --project-id $PROJECT_ID --title "To Do"
gh project column create --project-id $PROJECT_ID --title "In Progress"
gh project column create --project-id $PROJECT_ID --title "In Review"
gh project column create --project-id $PROJECT_ID --title "Done"

echo "✅ GitHub Projects configured"
```

### ステップ 7: チャンネル作成（5分）

**担当者**: 自分（プロジェクト管理者）

```bash
# プロジェクト管理用チャンネル
gh issue create --title "[Project] チャンネル作成" \
  --body "## チャンネル一覧
- #project-management: 全体進捗管理
- #emergency: 緊急時の連絡用

各エージェントは適切なチャンネルを使用してください。" \
  --label "documentation"

echo "✅ Channels created"
```

## 🎯 作業開始！

### 各エージェントの最初のタスク

#### AI Agent 1 (Frontend)
```bash
# Terminal 1で実行
cd frontend
git checkout -b feature/frontend-1-dashboard-base
npm run dev
```

**Issueを確認**: GitHubの"[Frontend] ダッシュボード基盤実装" Issueに取り組む

#### AI Agent 2 (Backend)
```bash
# Terminal 2で実行
cd backend
git checkout -b feature/backend-1-instagram-client
npm run dev
```

**Issueを確認**: GitHubの"[Backend] Instagram Graph APIクライアント実装" Issueに取り組む

#### AI Agent 3 (Infrastructure)
```bash
# Terminal 3で実行
cd infrastructure
git checkout -b feature/infra-1-terraform-setup
terraform init
terraform plan
```

**Issueを確認**: GitHubの"[Infra] 開発環境Docker構築" Issueに取り組む

#### GLM-4.7 (Analytics)
**Issueを確認**: GitHubの"[Analytics] 基本アナリティクス計画" Issueに取り組む

### 自分（プロジェクト管理者）の役割

#### 1. 進捗監視
- GitHub Projectsの「To Do」→「In Progress」→「Done」へのカード移動
- 各エージェントのブランチを監視

#### 2. 競合防止
- 同じ領域の作業が重複していないか確認
- 必要に応じてIssueの調整・統合

#### 3. コミュニケーション
- 18:00 JSTに進捗共有会議を開催
- ブロッキング課題の即時共有

## 📊 作業フローの可視化

```
┌─────────────────────────────────────────────────────────┐
│            プロジェクト管理（自分）              │
│         ┌──────────────────────────────┐          │
│         │  GitHub Repository & Projects │          │
│         └───────────────┬──────────┘          │
│                       │                       │
┌──────────────────────┼──────────────────────┐    │
│        AI Agent 1      │    AI Agent 2          │    │
│   (Frontend)        │   (Backend)           │    │
│                      │                        │    │
│  ┌──────────────────┐ │  ┌──────────────────┐ │    │
│  │  GitHub Issues    │ │  │  GitHub Issues    │ │    │
│  │  (feature/)      │ │  │  (feature/)      │ │    │
│  │  Pull Requests   │ │  │  Pull Requests   │ │    │
│  └──────────────────┘ │  └──────────────────┘ │    │
└──────────────────────┼──────────────────────────────┘    │
                       │                              │
┌──────────────────────┼──────────────────────┐      │
│        AI Agent 3      │    GLM-4.7          │      │
│  (Infrastructure)     │  (Analytics)          │      │
│                      │                        │      │
│  ┌──────────────────┐ │  ┌──────────────────┐ │      │
│  │  GitHub Issues    │ │  │  GitHub Issues    │ │      │
│  │  (feature/)      │ │  │  (feature/)      │ │      │
│  │  Pull Requests   │ │  │  Pull Requests   │ │      │
│  └──────────────────┘ │  └──────────────────┘ │      │
└────────────────────────────────────────────────────┘    │
                                                       │
                                                 ▼
                                      ┌─────────────────────────┐
                                      │   Completed Product   │
                                      │  Instagram Platform   │
                                      └─────────────────────────┘
```

## 🔍 トラブルシューティング

### 問題: GitHubプッシュできない
```bash
# 認証を確認
gh auth status

# 再認証
gh auth login
```

### 問題: ブランチが見つからない
```bash
# 全ブランチを取得
git branch -a

# リモートブランチを取得
git fetch --all
```

### 問題: Dockerコンテナが起動しない
```bash
# ログ確認
docker-compose logs

# 再ビルド
docker-compose build --no-cache

# コンテナ削除と再作成
docker-compose down -v
docker-compose up -d
```

## ✅ セットアップ完了チェックリスト

- [ ] GitHubリポジトリが作成された
- [ ] リモートURLが設定された
- [ ] Terminal 1が実行され、フロントエンド環境が準備された
- [ ] Terminal 2が実行され、バックエンド環境が準備された
- [ ] Terminal 3が実行され、インフラ環境が準備された
- [ ] 初期コミットがGitHubにプッシュされた
- [ ] ブランチ保護が設定された
- [ ] Phase 1のIssueが作成された
- [ ] GitHub Projectsが設定された

## 📞 次のアクション

### 自分（プロジェクト管理者）
1. ✅ 全チェックリストの完了を確認
2. ✅ #project-management チャンネルで「セットアップ完了」を報告
3. 📅 18:00 JSTに最初の進捗共有会議を開催
4. 📝 次回会議（18:00）のアジェンダを準備

### 各AIエージェント
1. 🎯 担当のIssueをGitHubで確認
2. 🔀 ブランチを作成（`feature/{role}-{issue-number}-{description}`）
3. 💻 環境を起動（npm run dev 等）
4. 🚀 開発を開始
5. 💬 進捗をチャンネルで共有（定時）

---

**準備完了！4つのAIエージェントと一緒にInstagram Automation Platformを構築しましょう！🚀**
