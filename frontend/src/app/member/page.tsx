'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Membership {
  id: string;
  tier: {
    name: string;
    display_name: string;
    max_instagram_accounts: number;
    max_dm_per_day: number;
    max_workflows: number;
    ai_credits_per_month: number;
    priority_support: boolean;
  };
  status: string;
  expires_at?: string;
  auto_renew: boolean;
}

interface PurchasedContent {
  id: string;
  content_type: string;
  title: string;
  thumbnail_url?: string;
  purchased_at: string;
}

export default function MemberDashboardPage() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [purchases, setPurchases] = useState<PurchasedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembership();
    fetchPurchases();
  }, []);

  const fetchMembership = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/membership/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch membership');
      
      const data = await response.json();
      setMembership(data.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/membership/purchases', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch purchases');
      
      const data = await response.json();
      setPurchases(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Member Dashboard</h1>
        
        {/* Membership Status Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Membership Status</h2>
          </div>
          <div className="p-6">
            {membership ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Current Plan</p>
                  <p className="text-2xl font-bold text-blue-900">{membership.tier?.display_name || 'Free'}</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Status</p>
                  <p className="text-2xl font-bold text-green-900 capitalize">{membership.status}</p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">AI Credits</p>
                  <p className="text-2xl font-bold text-purple-900">{membership.tier?.ai_credits_per_month || 0}/month</p>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600 font-medium">Expires</p>
                  <p className="text-lg font-bold text-orange-900">
                    {membership.expires_at ? new Date(membership.expires_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Unable to load membership information</p>
            )}
            
            <div className="mt-6 flex gap-4">
              <Link href="/member/upgrade" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Upgrade Plan
              </Link>
              <Link href="/member/history" className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
                View History
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        {membership?.tier && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Plan Features</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{membership.tier.max_instagram_accounts}</p>
                  <p className="text-sm text-gray-600">Instagram Accounts</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{membership.tier.max_dm_per_day}</p>
                  <p className="text-sm text-gray-600">DMs per Day</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{membership.tier.max_workflows}</p>
                  <p className="text-sm text-gray-600">Workflows</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">
                    {membership.tier.priority_support ? '✓' : '—'}
                  </p>
                  <p className="text-sm text-gray-600">Priority Support</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/community" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Forum</h3>
            <p className="text-gray-600">Join discussions with other members</p>
          </Link>
          
          <Link href="/events" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Events</h3>
            <p className="text-gray-600">Upcoming webinars and workshops</p>
          </Link>
          
          <Link href="/dashboard" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instagram Dashboard</h3>
            <p className="text-gray-600">Manage your Instagram automation</p>
          </Link>
        </div>

        {/* Purchased Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Purchased Content</h2>
          </div>
          <div className="p-6">
            {purchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchases.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    {item.thumbnail_url && (
                      <img src={item.thumbnail_url} alt={item.title} className="w-full h-32 object-cover rounded mb-3" />
                    )}
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500 capitalize">{item.content_type}</p>
                    <p className="text-xs text-gray-400">
                      Purchased: {new Date(item.purchased_at).toLocaleDateString()}
                    </p>
                    <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No purchased content yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
