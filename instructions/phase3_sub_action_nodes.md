# Configuration Update
これからの対話、コードの説明、コミットメッセージは全て **「日本語」** で行ってください。

# Phase 3: Action Nodes Implementation (Backend Support)
あなたはSub/AI担当改め、Backendサポート担当です。
**状況確認**: 
- `workflowService.ts` (CRUD) と `aiNode.ts` (AI処理) は実装済みです。
- あなたの任務は、ワークフロー内での「Instagramアクション」を実行するノードロジックの実装です。

**Task: Issue #18 (Subtask) アクションノードの実装**

## 作業ディレクトリ
- `c:\Users\chatg\Obsidian Vault\papa\Apps\Tools\instagram\backend` (ここをルートとして作業してください)

## 要件
既存の `instagramClient.ts` や `dmService` を再利用して、以下のノードロジックファイルを作成してください。

1.  **DM送信ノード**:
    - ファイル: `src/services/nodes/dmNode.ts`
    - 関数: `executeDM(input)`
    - Input: `userId` (宛先), `message` (本文), `attachment?` (画像URLなど)
    - 処理: `instagramClient.sendDM` を呼び出す。

2.  **コメント返信ノード**:
    - ファイル: `src/services/nodes/commentNode.ts`
    - 関数: `executeCommentReply(input)`
    - Input: `commentId` (対象コメント), `message` (返信内容)
    - 処理: `instagramClient.replyToComment` を呼び出す。

3.  **テスト**:
    - 単体テストスクリプト `../../scripts/test_action_nodes_logic.ts` を作成してください。
    - 実行は `npx ts-node ../../scripts/test_action_nodes_logic.ts` で行います。
    - Mockモード(`process.env.MOCK_MODE`)なので、実際にInstagramに送信しなくても「送信しました」というログが出ればOKです。

実装を開始してください。
