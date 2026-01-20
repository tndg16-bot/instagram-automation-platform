'use client';

import React, { useState } from 'react';
import { BookOpen, Video, ShoppingCart, Check, Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  type: 'ebook' | 'video' | 'course';
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  image?: string;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Instagram成長戦略ガイドブック',
    description: 'Instagramでのアカウント成長に必要な全ての戦略を網羅した電子書籍。基礎から応用まで、実践的なテクニックを50ページ以上にわたって解説。',
    price: '¥5,000',
    type: 'ebook',
    features: [
      'アカウント最適化のステップ',
      'コンテンツ戦略の立案方法',
      'エンゲージメントを高めるテクニック',
      'ハッシュタグ活用ガイド',
      '成功事例10選',
      'チェックリスト付'
    ],
    icon: React.createElement(BookOpen, { className: "h-6 w-6" }),
    popular: true
  },
  {
    id: '2',
    name: 'DM自動化マスターコース',
    description: 'InstaFlowを使ったDM自動化の全てを学ぶ動画コース。ワークフローの設計から実装、トラブルシューティングまでを網羅。',
    price: '¥15,000',
    type: 'video',
    features: [
      '5時間以上の動画コンテンツ',
      '10以上の実践的なワークフロー例',
      'A/Bテストの実施方法',
      'セグメンテーション戦略',
      'トラブルシューティングガイド',
      'コミュニティアクセス'
    ],
    icon: React.createElement(Video, { className: "h-6 w-6" })
  },
  {
    id: '3',
    name: 'コンテンツ制作テンプレートセット',
    description: 'プロ仕様のInstagram投稿テンプレート50点。キャプションテンプレート付きで、即座に高品質な投稿を作成可能。',
    price: '¥3,000',
    type: 'course',
    features: [
      '50点のFigmaテンプレート',
      'キャプションテンプレート20種類',
      'カラーパレットガイド',
      'フォント使用ガイド',
      '商用利用可能',
      '定期的なアップデート'
    ],
    icon: React.createElement(ShoppingCart, { className: "h-6 w-6" })
  },
  {
    id: '4',
    name: 'インフルエンサーマーケティング入門',
    description: 'インフルエンサーとの連携方法から、効果測定までを体系的に学ぶ電子書籍。',
    price: '¥7,000',
    type: 'ebook',
    features: [
      'インフルエンサー選定方法',
      '契約・交渉のコツ',
      'キャンペーン設計',
      'ROI測定方法',
      'トラブル回避ガイド',
      '契約書テンプレート'
    ],
    icon: React.createElement(BookOpen, { className: "h-6 w-6" })
  },
  {
    id: '5',
    name: 'Instagram広告完全攻略',
    description: 'Instagram広告の効果的な運用方法を学ぶ包括的な動画コース。',
    price: '¥20,000',
    type: 'video',
    features: [
      '広告アカウントの設定方法',
      'ターゲティング戦略',
      'クリエイティブ制作',
      '予算配分の最適化',
      'A/Bテスト実践',
      '成功事例15選',
      '30日間メールサポート'
    ],
    icon: React.createElement(Video, { className: "h-6 w-6" }),
    popular: true
  },
  {
    id: '6',
    name: 'リール制作マニュアル',
    description: 'Instagramリールでバズるための制作マニュアル。トレンド分析から編集テクニックまで。',
    price: '¥4,000',
    type: 'ebook',
    features: [
      'リールのアルゴリズム解説',
      'トレンドキャッチアップ方法',
      '編集テクニック集',
      '音楽選びのコツ',
      '効果的なフックの作り方',
      '分析ツール活用ガイド'
    ],
    icon: React.createElement(BookOpen, { className: "h-6 w-6" })
  }
];

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const handleBuyProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowCheckoutModal(true);
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!selectedProduct) return;

    try {
      const token = localStorage.getItem('accessToken');

      // 価格文字列から数値を抽出
      const price = parseInt(selectedProduct.price.replace(/[¥,]/g, ''), 10);

      // APIリクエスト
      const response = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId: token ? 'current-user' : `guest-${Date.now()}`,
          amount: price,
          currency: 'JPY',
          items: [{
            id: selectedProduct.id,
            productId: selectedProduct.id,
            quantity: 1,
            price: price,
            name: selectedProduct.name,
          }],
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCheckoutModal(false);
        alert('ご購入ありがとうございます！\n\n注文ID: ' + (result.order?.id || 'N/A') + '\n\n購入内容をメールでお送りしました。');
      } else {
        throw new Error(result.error || '購入処理に失敗しました');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('購入処理に失敗しました。もう一度お試しください。\n\nエラー: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-2xl font-bold text-gray-900">InstaFlow</h1>
              </div>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
              <a href="/services" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Services</a>
              <a href="/products" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-md text-sm font-medium">Products</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            インスタグラム運用に必要な全てのリソース
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            電子書籍、動画コース、テンプレートなど、Instagram成功に必要なリソースをご提供。
            すぐに実践できる実用的なコンテンツばかりです。
          </p>
        </div>

        <div className="flex justify-center mb-8 space-x-4">
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium">すべて</button>
          <button className="px-6 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100">電子書籍</button>
          <button className="px-6 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100">動画コース</button>
          <button className="px-6 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100">テンプレート</button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className={`relative bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                product.popular ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              {product.popular && (
                <div className="absolute top-4 right-4">
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    人気
                  </span>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <div className="text-indigo-600">{product.icon}</div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {product.type === 'ebook' && '電子書籍'}
                    {product.type === 'video' && '動画コース'}
                    {product.type === 'course' && 'テンプレート'}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{product.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-indigo-600">{product.price}</div>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {product.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-600">{feature}</span>
                    </li>
                  ))}
                  {product.features.length > 4 && (
                    <li className="text-xs text-indigo-600 font-medium">+ 他 {product.features.length - 4} 件</li>
                  )}
                </ul>

                <button
                  onClick={() => handleBuyProduct(product)}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    product.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  購入する
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold text-center mb-8">購入者限定の特典</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-semibold mb-2">継続的アップデート</h4>
              <p className="text-indigo-100 text-sm">Instagramのアルゴリズム変更に合わせて、コンテンツを継続的に更新</p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-semibold mb-2">専用コミュニティ</h4>
              <p className="text-indigo-100 text-sm">購入者限定のコミュニティで情報交換・質問が可能</p>
            </div>
            <div className="text-center">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-semibold mb-2">30日間メールサポート</h4>
              <p className="text-indigo-100 text-sm">専任スタッフが30日間、メールで質問に対応</p>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">お客様の声</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
              <p className="text-gray-700 mb-4">「DM自動化マスターコースは最高でした！ワークフローの設計方法がしっかり理解でき、エンゲージメントが300%向上しました。」</p>
              <p className="text-sm text-gray-500 font-medium">— 田中様 / ファッションブランド運営</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
              <p className="text-gray-700 mb-4">「コンテンツ制作テンプレートセットのおかげで、投稿の質が劇的に向上。フォロワー数が2ヶ月で倍増しました。」</p>
              <p className="text-sm text-gray-500 font-medium">— 佐藤様 / 個人インフルエンサー</p>
            </div>
          </div>
        </div>
      </main>

      {showCheckoutModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">購入確認</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-900 mb-1">{selectedProduct.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">合計金額</span>
                <span className="text-2xl font-bold text-indigo-600">{selectedProduct.price}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPurchase}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">お名前 *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="山田 太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <button type="submit" className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                購入を確定する
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">※ 決済はクレジットカードで処理されます</p>
              <p className="text-xs text-gray-500 mt-1">※ 購入内容はメールにてお送りいたします</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
