# Configuration Update
これからの対話、コードの説明、コミットメッセージは全て **「日本語」** で行ってください。

# Phase 3: Workflow List Implementation (Frontend)
あなたはFrontend担当です。
**状況確認**: 
- `WorkflowBuilderPage` (`.../builder/page.tsx`) は完成しています。
- しかし、そこから戻る場所である「一覧画面」がまだありません。

**Task: ワークフロー一覧・管理画面の実装**

## 作業ディレクトリ
- `c:\Users\chatg\Obsidian Vault\papa\Apps\Tools\instagram\frontend` (ここをルートとして作業してください)

## 要件
1.  **ページ作成**:
    - ファイル: `src/app/dashboard/workflows/page.tsx`
    
2.  **機能**:
    - **一覧表示**: `GET /api/workflows` をコールしてワークフロー一覧を表示。
        - 項目: 名前, 更新日時, ステータス(Active/Inactive)
    - **新規作成ボタン**: クリックすると `.../builder` へ遷移（IDなし）。
    - **編集ボタン**: 各行に配置。クリックすると `.../builder?id={id}` へ遷移。
    - **削除ボタン**: `DELETE /api/workflows/{id}` をコール。
    - **実行ボタン (Test)**: `POST /api/workflows/{id}/execute` をコールし、結果（executionIdなど）をトーストかアラートで表示。
    
3.  **デザイン**:
    - Tailwind CSSを使用し、既存のダッシュボードとトンマナを合わせる（シンプルでOK）。

実装を開始してください。
