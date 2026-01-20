import InstagramGraphClient from '../instagramClient';

/**
 * コメント返信ノードの入力型
 */
export interface CommentNodeInput {
  /**
   * 返信対象のコメントID
   */
  commentId: string;

  /**
   * 返信メッセージ本文
   */
  message: string;

  /**
   * Instagramアカウントのアクセストークン
   */
  accessToken: string;
}

/**
 * コメント返信ノードの出力型
 */
export interface CommentNodeOutput {
  /**
   * 返信が成功したかどうか
   */
  success: boolean;

  /**
   * 返信結果メッセージ
   */
  message: string;

  /**
   * 作成された返信ID（Instagramから返される場合）
   */
  replyId?: string;

  /**
   * エラー詳細（失敗した場合）
   */
  error?: string;
}

class CommentNodeService {
  /**
   * コメント返信ノードを実行する
   * @param input - コメント返信に必要なパラメータ
   * @returns 実行結果
   */
  async execute(input: CommentNodeInput): Promise<CommentNodeOutput> {
    // バリデーション
    if (!input.commentId) {
      return {
        success: false,
        message: '返信対象のコメントIDが指定されていません',
        error: 'MISSING_COMMENT_ID'
      };
    }

    if (!input.message) {
      return {
        success: false,
        message: '返信メッセージが空です',
        error: 'EMPTY_MESSAGE'
      };
    }

    if (!input.accessToken) {
      return {
        success: false,
        message: 'アクセストークンが指定されていません',
        error: 'MISSING_ACCESS_TOKEN'
      };
    }

    try {
      // Instagram Graph APIクライアントを作成
      const client = new InstagramGraphClient(input.accessToken);

      // モックモードの場合
      if (process.env.MOCK_MODE === 'true') {
        console.log('[CommentNode - MOCK MODE] コメント返信リクエスト:');
        console.log(`  コメントID: ${input.commentId}`);
        console.log(`  返信内容: ${input.message}`);

        return {
          success: true,
          message: 'コメント返信完了（モックモード）',
          replyId: `mock_reply_${Date.now()}`
        };
      }

      // 実際のInstagram APIを呼び出す
      await client.replyToComment(input.commentId, input.message);

      return {
        success: true,
        message: 'コメントを正常に返信しました',
        replyId: `reply_${Date.now()}`
      };

    } catch (error: any) {
      console.error('[CommentNode] コメント返信エラー:', error);

      // Instagram APIのエラーを処理
      let errorMessage = 'コメント返信に失敗しました';

      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data as any;

        // エラーメッセージを解析
        if (errorData && errorData.error) {
          const errorCode = errorData.error.code;
          const errorMsg = errorData.error.message;

          switch (errorCode) {
            case 4:
              errorMessage = 'アプリの権限が不足しています';
              break;
            case 17:
              errorMessage = '指定されたコメントが見つかりません';
              break;
            case 18:
              errorMessage = 'コメント返信の権限がありません';
              break;
            case 190:
              errorMessage = 'アクセストークンが無効または期限切れです';
              break;
            case 100:
              errorMessage = '指定されたパラメータが無効です';
              break;
            default:
              errorMessage = errorMsg || 'Instagram APIエラーが発生しました';
          }
        } else {
          // ステータスコードに基づく一般的なエラー
          switch (status) {
            case 401:
              errorMessage = 'アクセストークンが無効または期限切れです';
              break;
            case 403:
              errorMessage = 'コメント返信の権限がありません';
              break;
            case 429:
              errorMessage = 'レートリミットを超えました。しばらくお待ちください';
              break;
            case 500:
            case 502:
            case 503:
              errorMessage = 'Instagramで一時的な問題が発生しています';
              break;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
}

export default new CommentNodeService();
