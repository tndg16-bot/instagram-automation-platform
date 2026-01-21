# Configuration Update
これからの対話、コードの説明、コミットメッセージは全て **「日本語」** で行ってください。

# Phase 3 Kick-off: AI Nodes
あなたはAIノード担当です。ワークフロー内で使用する「AI処理部品」のロジックを作成します。

**Task: Issue #16 AIステップノードのロジック開発**

## 背景
ワークフローの中で「AIに判断させる」「AIに文章を作らせる」といったステップが必要になります。
以前作成した `aiService.ts` をラップして、ワークフローエンジンから呼び出せる形にします。

## 要件
1.  **ノードロジック実装**:
    - ファイル: `backend/src/services/nodes/aiNode.ts` (新規)
    - クラス/関数: `executeAIProcess(inputContext)` like function.

2.  **機能**:
    - 入力: `prompt_template` (Ex: "{{username}}への返信を考えて"), `variables` (Ex: {username: "taro"})
    - 処理: 
        1. プロンプト変数を展開。
        2. `aiService.generateCaption` または新規追加する `aiService.completeText` を呼び出す。
    - 出力: 生成されたテキストを返す。

3.  **テスト**:
    - 単体で呼び出して動作するスクリプト `scripts/test_ai_node.js` も作成してください。

まずは「固定の入力を受け取って、AIサービス経由でテキストを返す」シンプルな関数を作ってください。
