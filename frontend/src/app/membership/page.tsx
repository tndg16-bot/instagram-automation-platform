'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MemberDashboard() {
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch membership status
      const statusResponse = await fetch('http://localhost:8000/api/membership/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const statusData = await statusResponse.json();
      if (statusData.success) {
        setMembership(statusData.data);
      }

      // Fetch purchases
      const purchasesResponse = await fetch('http://localhost:8000/api/membership/purchases', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const purchasesData = await purchasesResponse.json();
      if (purchasesData.success) {
        setPurchases(purchasesData.data);
      }

      // Fetch tiers
      const tiersResponse = await fetch('http://localhost:8000/api/membership/tiers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const tiersData = await tiersResponse.json();
      if (tiersData.success) {
        setTiers(tiersData.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching membership data:', error);
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:8000/api/membership/tier', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tier_id: tierId }),
      });

      const data = await response.json();
      if (data.success) {
        setMembership(data.data);
        alert('Membership upgraded successfully!');
      } else {
        alert(data.error || 'Failed to upgrade membership');
      }
    } catch (error) {
      console.error('Error upgrading membership:', error);
      alert('Failed to upgrade membership');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">InstaFlow AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/community" className="text-gray-600 hover:text-gray-900">
                Community
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  window.location.href = '/login';
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Membership Dashboard
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your subscription and access premium features
              </p>
            </div>
          </div>

          {/* Current Membership Card */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Current Membership
              </h3>
              
              {membership ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Plan</span>
                    <span className="text-sm text-gray-900">{membership.tier_name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      membership.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : membership.status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {membership.status}
                    </span>
                  </div>

                  {membership.end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Renewal Date</span>
                      <span className="text-sm text-gray-900">
                        {new Date(membership.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {membership.tier_features && membership.tier_features.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Features</span>
                      <ul className="mt-2 space-y-1">
                        {membership.tier_features.map((feature: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">
                            • {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No active membership</p>
              )}
            </div>
          </div>

          {/* Upgrade Options */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Upgrade Your Plan
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {tiers.map((tier: any) => (
                  <div
                    key={tier.id}
                    className="border rounded-lg p-4 hover:border-indigo-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{tier.name}</h4>
                      <span className="text-2xl font-bold text-indigo-600">
                        ¥{tier.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      {tier.duration_days} days
                    </div>

                    <ul className="space-y-1">
                      {tier.features.map((feature: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600">
                          ✓ {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(tier.id)}
                      className="mt-4 w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={membership?.tier === tier.id}
                    >
                      {membership?.tier === tier.id ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Purchased Content */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Purchased Content
              </h3>

              {purchases.length > 0 ? (
                <div className="space-y-4">
                  {purchases.map((purchase: any) => (
                    <div key={purchase.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900">
                            {purchase.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {purchase.description}
                          </p>
                        </div>
                        {purchase.file_url && (
                          <a
                            href={purchase.file_url}
                            download
                            className="ml-4 inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Download
                          </a>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Purchased: {new Date(purchase.purchased_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No purchased content</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
