/**
 * Condition Node - 条件分岐ノード
 *
 * ワークフロー内での条件分岐ロジックを担当します。
 * 演算子に従って真偽判定を行い、次のパスを決定します。
 */

export type ConditionOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan';

export interface ConditionInput {
    targetValue: string | number;    // 判定対象の値
    operator: ConditionOperator;      // 演算子
    comparisonValue: string | number; // 比較する値
}

export interface ConditionOutput {
    result: boolean;  // 判定結果
    nextPath: 'true_path' | 'false_path';  // 分岐先の識別子
}

class ConditionNodeService {
    /**
     * 条件分岐を実行します。
     *
     * @param input - 条件判定の入力値
     * @returns 判定結果と次のパス情報
     */
    execute(input: ConditionInput): ConditionOutput {
        const result = this.evaluateCondition(input);
        const nextPath: 'true_path' | 'false_path' = result ? 'true_path' : 'false_path';

        return {
            result,
            nextPath
        };
    }

    /**
     * 条件式を評価します。
     *
     * @param input - 条件判定の入力値
     * @returns 判定結果 (true/false)
     * @private
     */
    private evaluateCondition(input: ConditionInput): boolean {
        const { targetValue, operator, comparisonValue } = input;

        switch (operator) {
            case 'equals':
                return this.equals(targetValue, comparisonValue);
            case 'contains':
                return this.contains(targetValue, comparisonValue);
            case 'greaterThan':
                return this.greaterThan(targetValue, comparisonValue);
            case 'lessThan':
                return this.lessThan(targetValue, comparisonValue);
            default:
                console.warn(`Unknown operator: ${operator}. Defaulting to false.`);
                return false;
        }
    }

    /**
     * 等値判定
     */
    private equals(target: string | number, comparison: string | number): boolean {
        return String(target) === String(comparison);
    }

    /**
     * 包含判定 (部分文字列マッチ)
     */
    private contains(target: string | number, comparison: string | number): boolean {
        const targetStr = String(target).toLowerCase();
        const comparisonStr = String(comparison).toLowerCase();
        return targetStr.includes(comparisonStr);
    }

    /**
     * 大小判定 (より大きい)
     */
    private greaterThan(target: string | number, comparison: string | number): boolean {
        const targetNum = Number(target);
        const comparisonNum = Number(comparison);

        if (isNaN(targetNum) || isNaN(comparisonNum)) {
            console.warn(`greaterThan comparison requires numbers. Received: target=${target}, comparison=${comparison}`);
            return false;
        }

        return targetNum > comparisonNum;
    }

    /**
     * 大小判定 (より小さい)
     */
    private lessThan(target: string | number, comparison: string | number): boolean {
        const targetNum = Number(target);
        const comparisonNum = Number(comparison);

        if (isNaN(targetNum) || isNaN(comparisonNum)) {
            console.warn(`lessThan comparison requires numbers. Received: target=${target}, comparison=${comparison}`);
            return false;
        }

        return targetNum < comparisonNum;
    }
}

export default new ConditionNodeService();
