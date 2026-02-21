import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RegistryProvider, useRegistry } from '../contexts/RegistryContext';
import { useAuth } from '../contexts/AuthContext';
import { getReservations } from '../utils/api';
import { Heart } from 'lucide-react';

function AdminContent() {
  const { registry, coupleNames, slug, loading: configLoading } = useRegistry();
  const { isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !isAuthenticated) return;

    getReservations(slug)
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, isAuthenticated]);

  if (configLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
          <Link to="/login" className="text-pink-600 font-medium hover:text-pink-700">Sign in to manage this registry</Link>
        </div>
      </div>
    );
  }

  const uniqueGuests = new Set(reservations.map(r => r.guest_name)).size;
  const totalValue = reservations.reduce((sum, r) => sum + (r.gift_price || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-display)' }}>
                Admin Dashboard
              </h1>
              <p className="text-[var(--color-primary)] font-medium">{coupleNames}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to={`/${slug}`} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              View Registry
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-800 font-medium">
              My Registries
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-2xl mb-2">🎁</div>
            <div className="text-2xl font-bold text-gray-800">{reservations.length}</div>
            <div className="text-gray-600">Total Reservations</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-2xl font-bold text-gray-800">{uniqueGuests}</div>
            <div className="text-gray-600">Unique Guests</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-2xl font-bold text-gray-800">
              {registry?.primaryCurrency} {totalValue.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Value Reserved</div>
          </div>
        </div>
      </section>

      {/* Reservations Table */}
      <section className="py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Reservations</h2>
          {reservations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reservations Yet</h3>
              <p className="text-gray-600">When guests reserve gifts, they'll appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gift</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reservations.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{r.gift_name}</div>
                          <div className="text-sm text-gray-500">{r.gift_category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{r.guest_name}</div>
                          {r.guest_email && <div className="text-sm text-gray-500">{r.guest_email}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {r.gift_name === 'Money' ? 'Any Amount' : `${registry?.primaryCurrency} ${r.gift_price?.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(r.reserved_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { slug } = useParams();
  return (
    <RegistryProvider slug={slug}>
      <AdminContent />
    </RegistryProvider>
  );
}
