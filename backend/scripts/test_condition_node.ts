/**
 * Condition Node Test Script
 *
 * conditionNode.ts の動作確認テストスクリプトです。
 * 実行方法: npx ts-node scripts/test_condition_node.ts
 */

import conditionNode, { ConditionInput } from '../src/services/nodes/conditionNode';

/**
 * テストケースの型定義
 */
interface TestCase {
    name: string;
    input: ConditionInput;
    expectedResult: boolean;
    expectedNextPath: 'true_path' | 'false_path';
}

/**
 * テストケース一覧
 */
const testCases: TestCase[] = [
    // equals テスト
    {
        name: 'equals: 文字列が一致する場合',
        input: {
            targetValue: 'hello',
            operator: 'equals',
            comparisonValue: 'hello'
        },
        expectedResult: true,
        expectedNextPath: 'true_path'
    },
    {
        name: 'equals: 文字列が一致しない場合',
        input: {
            targetValue: 'hello',
            operator: 'equals',
            comparisonValue: 'world'
        },
        expectedResult: false,
        expectedNextPath: 'false_path'
    },
    {
        name: 'equals: 数値の等値判定',
        input: {
            targetValue: 42,
            operator: 'equals',
            comparisonValue: 42
        },
        expectedResult: true,
        expectedNextPath: 'true_path'
    },

    // contains テスト
    {
        name: 'contains: 部分文字列を含む場合',
        input: {
            targetValue: 'Hello, World!',
            operator: 'contains',
            comparisonValue: 'World'
        },
        expectedResult: true,
        expectedNextPath: 'true_path'
    },
    {
        name: 'contains: 部分文字列を含まない場合',
        input: {
            targetValue: 'Hello, World!',
            operator: 'contains',
            comparisonValue: 'Goodbye'
        },
        expectedResult: false,
        expectedNextPath: 'false_path'
    },
    {
        name: 'contains: 大文字小文字を区別しない',
        input: {
            targetValue: 'Hello, World!',
            operator: 'contains',
            comparisonValue: 'world'
        },
        expectedResult: true,
        expectedNextPath: 'true_path'
    },

    // greaterThan テスト
    {
        name: 'greaterThan: より大きい数値',
        input: {
            targetValue: 100,
            operator: 'greaterThan',
            comparisonValue: 50
        },
        expectedResult: true,
        expectedNextPath: 'true_path'
    },
    {
        name: 'greaterThan: より小さい数値',
        input: {
            targetValue: 30,
            operator: 'greaterThan',
            comparisonValue: 50
        },
        expectedResult: false,
        expectedNextPath: 'false_path'
    },
    {
        name: 'greaterThan: 等しい場合 (false)',
        input: {
            targetValue: 50,
            operator: 'greaterThan',
            comparisonValue: 50
        },
        expectedResult: false,
        expectedNextPath: 'false_path'
    },
    {
        name: 'greaterThan: 文字列は数値に変換される',
        input: {
            targetValue: '100',
            operator: 'greaterThan',
            comparisonValue: '50'
        },
        expectedResult: true,
        expectedNextPath: 'true_path'
    },

    // lessThan テスト
    {
        name: 'lessThan: より小さい数値',
        input: {
            targetValue: 30,
            operator: 'lessThan',
            comparisonValue: 50
        },
        expectedResult: true,
        expectedNextPath: 'true_path'
    },
    {
        name: 'lessThan: より大きい数値',
        input: {
            targetValue: 100,
            operator: 'lessThan',
            comparisonValue: 50
        },
        expectedResult: false,
        expectedNextPath: 'false_path'
    },
    {
        name: 'lessThan: 等しい場合 (false)',
        input: {
            targetValue: 50,
            operator: 'lessThan',
            comparisonValue: 50
        },
        expectedResult: false,
        expectedNextPath: 'false_path'
    },
];

/**
 * テスト結果の出力フォーマット
 */
function formatResult(
    passed: boolean,
    testCase: TestCase,
    actualResult: { result: boolean; nextPath: 'true_path' | 'false_path' }
): string {
    const statusIcon = passed ? '✅' : '❌';
    const resultIcon = actualResult.result ? 'true' : 'false';

    return `
${statusIcon} ${testCase.name}
   Input: ${JSON.stringify(testCase.input)}
   Expected: result=${testCase.expectedResult}, nextPath=${testCase.expectedNextPath}
   Actual:   result=${resultIcon}, nextPath=${actualResult.nextPath}`;
}

/**
 * テストを実行します。
 */
function runTests() {
    console.log('='.repeat(60));
    console.log('Condition Node テスト実行中...');
    console.log('='.repeat(60));

    let passedCount = 0;
    let failedCount = 0;

    for (const testCase of testCases) {
        try {
            const result = conditionNode.execute(testCase.input);
            const passed = result.result === testCase.expectedResult &&
                          result.nextPath === testCase.expectedNextPath;

            if (passed) {
                passedCount++;
                console.log(formatResult(true, testCase, result));
            } else {
                failedCount++;
                console.log(formatResult(false, testCase, result));
            }
        } catch (error) {
            failedCount++;
            console.log(`❌ ${testCase.name}`);
            console.log(`   Error: ${error}`);
        }
    }

    console.log('='.repeat(60));
    console.log('テスト結果サマリー:');
    console.log(`   合計: ${testCases.length}`);
    console.log(`   成功: ${passedCount}`);
    console.log(`   失敗: ${failedCount}`);
    console.log(`   成功率: ${((passedCount / testCases.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (failedCount > 0) {
        process.exit(1);
    }
}

// テストを実行
runTests();
