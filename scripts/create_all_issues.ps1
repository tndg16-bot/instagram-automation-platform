$issues = @(
    @{
        title = "Issue #2: 認証・ユーザー管理機能開発"
        body = "Phase 1: MVP開発`n`n- ユーザー登録・認証機能`n- Instagramアカウント連携機能`n- ユーザー管理UI開発"
        labels = "Phase 1,backend,frontend"
    },
    @{
        title = "Issue #3: Instagram Graph API連携"
        body = "Phase 1: MVP開発`n`n- APIクライアントライブラリ構築`n- Webhook受信機能"
        labels = "Phase 1,backend"
    },
    @{
        title = "Issue #4: DM一斉配信機能開発"
        body = "Phase 1: MVP開発`n`n- 配信管理機能`n- 配信実行エンジン`n- 配信UI開発"
        labels = "Phase 1,backend,frontend"
    },
    @{
        title = "Issue #5: コメント自動返信機能開発"
        body = "Phase 1: MVP開発`n`n- コメント監視機能`n- 返信生成機能（シンプル版）`n- コメント管理UI"
        labels = "Phase 1,backend,frontend"
    },
    @{
        title = "Issue #6: テスト・品質保証"
        body = "Phase 1: MVP開発`n`n- ユニットテスト`n- インテグレーションテスト`n- E2Eテスト"
        labels = "Phase 1,QA"
    },
    @{
        title = "Issue #7: MVPリリース準備"
        body = "Phase 1: MVP開発`n`n- ドキュメント作成`n- セキュリティチェック`n- リリース"
        labels = "Phase 1,release"
    },
    @{
        title = "Issue #8: いいね返し機能開発"
        body = "Phase 2: 機能拡張`n`n- いいね自動化エンジン`n- いいね管理UI"
        labels = "Phase 2,backend,frontend"
    },
    @{
        title = "Issue #9: 自動フォロー機能開発"
        body = "Phase 2: 機能拡張`n`n- フォロー自動化エンジン`n- フォロー管理UI"
        labels = "Phase 2,backend,frontend"
    },
    @{
        title = "Issue #10: 自動投稿機能開発"
        body = "Phase 2: 機能拡張`n`n- 投稿管理機能`n- マルチフォーマット対応`n- 投稿UI開発"
        labels = "Phase 2,backend,frontend"
    },
    @{
        title = "Issue #11: キャプションAI生成機能"
        body = "Phase 2: 機能拡張`n`n- AI連携実装`n- 生成機能開発`n- AI UI開発"
        labels = "Phase 2,AI,frontend"
    },
    @{
        title = "Issue #12: アナリティクス機能開発"
        body = "Phase 2: 機能拡張`n`n- データ収集・集計`n- ダッシュボード開発`n- レポート機能"
        labels = "Phase 2,analytics,frontend"
    },
    @{
        title = "Issue #13: セグメント配信強化"
        body = "Phase 2: 機能拡張`n`n- セグメント機能拡張`n- セグメントUI改善"
        labels = "Phase 2,backend,frontend"
    },
    @{
        title = "Issue #14: v1.0リリース準備"
        body = "Phase 2: 機能拡張`n`n- 機能統合テスト`n- マーケティング準備`n- リリース"
        labels = "Phase 2,release"
    },
    @{
        title = "Issue #15: ワークフロービルダー開発"
        body = "Phase 3: AI連携強化`n`n- キャンバスエンジン`n- ノードライブラリ`n- ビルダーUI開発"
        labels = "Phase 3,frontend"
    },
    @{
        title = "Issue #16: AIステップノード開発"
        body = "Phase 3: AI連携強化`n`n- AI連携強化`n- AIステップ実装`n- AI管理UI"
        labels = "Phase 3,AI,backend"
    },
    @{
        title = "Issue #17: 条件分岐・ループ機能"
        body = "Phase 3: AI連携強化`n`n- 条件分岐実装`n- ループ機能`n- 高度なノード"
        labels = "Phase 3,backend"
    },
    @{
        title = "Issue #18: ワークフロー実行エンジン"
        body = "Phase 3: AI連携強化`n`n- 実行システム`n- 監視・デバッグ"
        labels = "Phase 3,backend"
    },
    @{
        title = "Issue #19: テンプレートライブラリ"
        body = "Phase 3: AI連携強化`n`n- テンプレート管理`n- テンプレートUI"
        labels = "Phase 3,frontend,backend"
    },
    @{
        title = "Issue #20: v2.0リリース"
        body = "Phase 3: AI連携強化`n`n- 総合テスト`n- ドキュメント・マーケティング`n- リリース"
        labels = "Phase 3,release"
    },
    @{
        title = "Issue #21: Webhook送信機能"
        body = "Phase 4: API連携`n`n- Webhook管理`n- Webhook UI"
        labels = "Phase 4,backend,frontend"
    },
    @{
        title = "Issue #22: Zapier連携"
        body = "Phase 4: API連携`n`n- Zapier App作成`n- ドキュメント・申請"
        labels = "Phase 4,integration"
    },
    @{
        title = "Issue #23: Make連携"
        body = "Phase 4: API連携`n`n- Make App作成`n- テスト・リリース"
        labels = "Phase 4,integration"
    },
    @{
        title = "Issue #24: n8n連携"
        body = "Phase 4: API連携`n`n- n8nノード開発`n- n8nコミュニティ"
        labels = "Phase 4,integration"
    },
    @{
        title = "Issue #25: Meta Tech Provider認定"
        body = "Phase 4: API連携`n`n- 要件確認・準備`n- 申請・審査"
        labels = "Phase 4,compliance"
    }
)

# Get existing issues to prevent duplicates
Write-Host "Fetching existing issues..."
$existingIssuesJson = gh issue list --state all --limit 100 --json title
$existingTitles = @()

if ($existingIssuesJson) {
    $existingIssues = $existingIssuesJson | ConvertFrom-Json
    $existingTitles = $existingIssues | ForEach-Object { $_.title }
}

Write-Host "Found $($existingTitles.Count) existing issues."

foreach ($issue in $issues) {
    if ($existingTitles -contains $issue.title) {
        Write-Host "Skipping '$($issue.title)' (already exists)" -ForegroundColor Yellow
        continue
    }

    Write-Host "Creating '$($issue.title)'..." -ForegroundColor Green
    try {
        gh issue create --title $issue.title --body $issue.body --label $issue.labels
        Start-Sleep -Seconds 2
    } catch {
        Write-Error "Failed to create issue '$($issue.title)': $_"
    }
}
