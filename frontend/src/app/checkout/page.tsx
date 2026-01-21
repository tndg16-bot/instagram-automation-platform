'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, Check, ArrowLeft, Loader2 } from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  priceDisplay: string;
  quantity: number;
}

type CheckoutStep = 'cart' | 'customer' | 'payment' | 'success' | 'error';

export default function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });

  useEffect(() => {
    loadCartFromStorage();
  }, []);

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartItems(cart);
      } else {
        setStep('error');
        setError('カートが空です。商品ページから商品を選択してください。');
      }
    } catch (e) {
      setStep('error');
      setError('カートの読み込みに失敗しました。');
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    if (updatedCart.length === 0) {
      setStep('error');
      setError('カートが空です。商品ページから商品を選択してください。');
    }
  };

  const handleCustomerSubmit = () => {
    if (!customerInfo.name || !customerInfo.email) {
      setError('お名前とメールアドレスを入力してください。');
      return;
    }
    setError('');
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');

      const items = cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name
      }));

      const response = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId: token ? 'current-user' : `guest-${Date.now()}`,
          amount: totalAmount,
          currency: 'JPY',
          items,
          customerInfo,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOrderId(result.order.id);
        localStorage.removeItem('cart');
        setStep('success');
      } else {
        throw new Error(result.error || '購入処理に失敗しました');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err instanceof Error ? err.message : '購入処理に失敗しました');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">InstaFlow</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <a
                href="/products"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                商品ページへ戻る
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">InstaFlow</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ご購入ありがとうございます！</h2>
              <p className="text-gray-600 mb-4">注文ID: {orderId}</p>
              <p className="text-gray-600 mb-6">
                購入内容をメールでお送りしました。<br />
                近日中に担当者よりご連絡いたします。
              </p>
              <div className="space-y-3">
                <a
                  href="/dashboard"
                  className="block w-full rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-center text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  ダッシュボードへ
                </a>
                <a
                  href="/products"
                  className="block w-full rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  商品一覧へ
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">InstaFlow</h1>
              </div>
              <div className="ml-8 flex items-center space-x-2 text-sm text-gray-500">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  step === 'cart' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                }`}>1</span>
                <span>カート</span>
                <span className="mx-1">→</span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  step === 'customer' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                }`}>2</span>
                <span>情報</span>
                <span className="mx-1">→</span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  step === 'payment' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                }`}>3</span>
                <span>決済</span>
              </div>
            </div>
            <a href="/products" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-1" />
              商品一覧へ戻る
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step === 'cart' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <ShoppingBag className="h-6 w-6 mr-2 text-indigo-600" />
                  ショッピングカート
                </h2>

                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">カートが空です</p>
                    <a
                      href="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      商品を探す
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.priceDisplay}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center border rounded-md">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                              >
                                -
                              </button>
                              <span className="px-2 py-1 min-w-[40px] text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="font-semibold text-gray-900">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setStep('customer')}
                        disabled={cartItems.length === 0}
                        className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        次へ
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 'customer' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">お客様情報</h2>

                <form onSubmit={handleCustomerSubmit}>
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="山田 太郎"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="example@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        電話番号（任意）
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="090-1234-5678"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => setStep('cart')}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      戻る
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      次へ
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="h-6 w-6 mr-2 text-indigo-600" />
                  決済情報
                </h2>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    ⚠️ これはデモ環境です。実際の決済は行われません。
                  </p>
                </div>

                <form onSubmit={handlePaymentSubmit}>
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        カード番号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentInfo.cardNumber}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        カード名義人 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentInfo.cardName}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="TARO YAMADA"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          有効期限 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentInfo.cardExpiry}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, cardExpiry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVC <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentInfo.cardCvc}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, cardCvc: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="000"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => setStep('customer')}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      戻る
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          処理中...
                        </>
                      ) : (
                        '購入を確定する'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">注文内容</h3>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">小計</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">消費税</span>
                  <span>{formatPrice(0)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-lg">合計</span>
                    <span className="font-bold text-lg text-indigo-600">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>※ 価格はすべて税込み表示です</p>
                <p className="mt-2">※ デモ環境のため、実際の決済は行われません</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
