'use client';

import { useState } from 'react';
import { Check, Calendar, MessageSquare, TrendingUp, Shield, Clock } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

const services: Service[] = [
  {
    id: '1',
    name: 'Instagram Growth Coaching',
    description: '専門家と一緒にInstagramアカウントの成長戦略を立案・実行。分析、戦略立案、コンテンツ計画まで包括的にサポート。',
    price: '¥50,000',
    duration: '4週間',
    features: [
      '週1回の1on1コーチングセッション（60分）',
      'アカウント分析と戦略策定',
      'コンテンツカレンダーの作成',
      '成長トラッキングとフィードバック',
      'DM応答テンプレートの提供'
    ],
    icon: <TrendingUp className="h-6 w-6" />,
    popular: true
  },
  {
    id: '2',
    name: 'Automation Strategy Consulting',
    description: 'InstaFlowのツールを最大限活用するための導入支援。既存のワークフロー最適化から新規自動化の設計まで。',
    price: '¥80,000',
    duration: '2週間',
    features: [
      '現在の運用状況の分析',
      'カスタムワークフローの設計・実装',
      'セグメンテーション戦略の策定',
      'チーム向けトレーニング',
      '30日間のサポート付き'
    ],
    icon: <Clock className="h-6 w-6" />
  },
  {
    id: '3',
    name: 'Content Production Package',
    description: 'コンテンツ制作から投稿スケジューリングまでを一括管理。高品質な投稿の継続的な配信をサポート。',
    price: '¥100,000/月',
    duration: '継続',
    features: [
      '月20本の高品質投稿制作',
      'キャプションの作成',
      'ハッシュタグ最適化',
      '投稿スケジューリング',
      'エンゲージメント管理'
    ],
    icon: <MessageSquare className="h-6 w-6" />
  },
  {
    id: '4',
    name: 'Success Audit & Roadmap',
    description: '現在のアカウント状況を徹底分析し、成功への道筋を策定。改善点を特定し、具体的なアクションプランを提供。',
    price: '¥30,000',
    duration: '1回',
    features: [
      'アカウントの包括的分析',
      '競合調査',
      '改善点の特定と優先順位付け',
      '詳細なロードマップの提供',
      '30日間のメールサポート'
    ],
    icon: <Shield className="h-6 w-6" />
  },
  {
    id: '5',
    name: 'Monthly Retainer',
    description: '月次定額で専任のInstagramエキスパートが付属。戦略から実行まで全てをお任せ。',
    price: '¥200,000/月',
    duration: '継続',
    features: [
      '専任エキスパートの常駐',
      'コンテンツ企画・制作',
      'コミュニティ管理',
      '月次レポート',
      '優先サポート'
    ],
    icon: <Calendar className="h-6 w-6" />
  }
];

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService) return;

    try {
      const token = localStorage.getItem('accessToken');

      // 価格文字列から数値を抽出
      const price = parseInt(selectedService.price.replace(/[¥,\/月]/g, ''), 10);

      // APIリクエスト（Services用のBooking API）
      const response = await fetch('http://localhost:8000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId: token ? 'current-user' : `guest-${Date.now()}`,
          serviceId: selectedService.id,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後を仮設定
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowBookingModal(false);
        alert('ご予約ありがとうございます！\n\n予約ID: ' + result.booking?.id + '\n\n担当者より24時間以内にご連絡いたします。');
      } else {
        throw new Error(result.error || '予約処理に失敗しました');
      }
    } catch (error) {
      console.error('Booking failed:', error);
      alert('予約処理に失敗しました。もう一度お試しください。\n\nエラー: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  InstaFlow
                </h1>
              </div>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="/services" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-md text-sm font-medium">
                Services
              </a>
              <a href="/products" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Products
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            プロフェッショナルなInstagram運用サポート
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Instagramでのビジネス成長を加速させる包括的なサービスをご提供。
            あなたの目標達成を全力でサポートします。
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className={`relative bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow ${
                service.popular ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    人気プラン
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <div className="text-indigo-600">
                    {service.icon}
                  </div>
                </div>
                <span className="text-sm text-gray-500">{service.duration}</span>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {service.name}
              </h3>

              <p className="text-gray-600 text-sm mb-4">
                {service.description}
              </p>

              <div className="text-3xl font-bold text-gray-900 mb-4">
                {service.price}
              </div>

              <ul className="space-y-3 mb-6">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBookService(service)}
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  service.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                予約する
              </button>
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            なぜInstaFlowのサービスを選ぶべきか
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">実績豊富</h4>
              <p className="text-gray-600">
                500以上のアカウントで実証済みの成長戦略
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">安心・安全</h4>
              <p className="text-gray-600">
                Instagramのガイドラインに準拠した安全な運用
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">継続的サポート</h4>
              <p className="text-gray-600">
                長期的な成長を見据えた継続的なサポート体制
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-indigo-600 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            不明な点はありますか？
          </h3>
          <p className="text-indigo-100 mb-6">
            お気軽にお問い合わせください。専任のコンサルタントがご対応いたします。
          </p>
          <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            お問い合わせ
          </button>
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">サービス予約</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-900 mb-1">{selectedService.name}</h4>
              <p className="text-sm text-gray-600">{selectedService.duration}</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">{selectedService.price}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmBooking(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    お名前 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="山田 太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    希望連絡方法
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="email">メール</option>
                    <option value="phone">電話</option>
                    <option value="video">ビデオ通話</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ご質問・ご要望（任意）
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ご質問やご要望がございましたらお知らせください"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                予約を確定する
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              ※ 実際の決済は後日お知らせいたします
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
