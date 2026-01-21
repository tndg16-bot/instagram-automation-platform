import InstagramGraphClient from '../instagramClient';

/**
 * DM送信ノードの入力型
 */
export interface DMNodeInput {
  /**
   * 送信先ユーザーID
   */
  userId: string;

  /**
   * 送信メッセージ本文
   */
  message: string;

  /**
   * 添付画像URL（オプション）
   */
  attachment?: string;

  /**
   * Instagramアカウントのアクセストークン
   */
  accessToken: string;
}

/**
 * DM送信ノードの出力型
 */
export interface DMNodeOutput {
  /**
   * 送信が成功したかどうか
   */
  success: boolean;

  /**
   * 送信結果メッセージ
   */
  message: string;

  /**
   * 送信されたメッセージID（Instagramから返される場合）
   */
  messageId?: string;

  /**
   * エラー詳細（失敗した場合）
   */
  error?: string;
}

class DMNodeService {
  /**
   * DM送信ノードを実行する
   * @param input - DM送信に必要なパラメータ
   * @returns 実行結果
   */
  async execute(input: DMNodeInput): Promise<DMNodeOutput> {
    // バリデーション
    if (!input.userId) {
      return {
        success: false,
        message: '送信先ユーザーIDが指定されていません',
        error: 'MISSING_RECIPIENT_ID'
      };
    }

    if (!input.message) {
      return {
        success: false,
        message: 'メッセージ本文が空です',
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
        console.log(`[DMNode - MOCK MODE] DM送信リクエスト:`);
        console.log(`  送信先: ${input.userId}`);
        console.log(`  メッセージ: ${input.message}`);
        if (input.attachment) {
          console.log(`  添付: ${input.attachment}`);
        }

        return {
          success: true,
          message: 'DM送信完了（モックモード）',
          messageId: `mock_dm_${Date.now()}`
        };
      }

      // 実際のInstagram APIを呼び出し
      await client.sendDM(input.userId, input.message, input.attachment);

      return {
        success: true,
        message: 'DMを正常に送信しました',
        messageId: `dm_${Date.now()}`
      };

    } catch (error: any) {
      console.error('[DMNode] DM送信エラー:', error);

      // Instagram APIのエラーを処理
      let errorMessage = 'DM送信に失敗しました';

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
              errorMessage = '指定されたユーザーが見つかりません';
              break;
            case 32:
              errorMessage = 'DMを送信する権限がありません';
              break;
            case 368:
              errorMessage = '一時的なアクションブロック';
              break;
            case 10:
              errorMessage = 'このユーザーは既にDMを受け取れない設定になっています';
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

export default new DMNodeService();
