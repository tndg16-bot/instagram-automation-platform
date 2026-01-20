# Configuration Update
これからの対話、コードの説明、コミットメッセージは全て **「日本語」** で行ってください。

# Phase 3: Condition Node Implementation (Backend)
あなたはBackend担当です。
**状況確認**: 
- `workflowService.ts` と `aiNode.ts` は既に(PMによって)実装済みです。これらを破壊しないように注意してください。
- あなたの次の任務は、ワークフロー内での「条件分岐」ロジックの実装です。

**Task: Issue #17 条件分岐ノードの実装**

## 作業ディレクトリ
- `c:\Users\chatg\Obsidian Vault\papa\Apps\Tools\instagram\backend` (ここをルートとして作業してください)

## 要件
1.  **ノードロジック実装**:
    - ファイル: `src/services/nodes/conditionNode.ts` (新規作成)
    - クラス/関数: `executeCondition(input)`
    
2.  **機能**:
    - 入力: 
        - `targetValue`: 判定対象の値 (例: ユーザーの回答テキスト)
        - `operator`: `equals`, `contains`, `greaterThan`, `lessThan` など
        - `comparisonValue`: 比較する値
    - 処理:
        - 入力された演算子に従って真偽判定を行う。
    - 出力: 
        - `result`: Boolean (true/false)
        - `nextPath`: "true_path" or "false_path" (分岐先のEdge ID等を特定するための識別子)

3.  **テスト**:
    - 単体テストスクリプト `../../scripts/test_condition_node.ts` を作成して動作確認してください。
    - 実行は `npx ts-node ../../scripts/test_condition_node.ts` で行います。

実装を開始してください。
