import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RegistryProvider, useRegistry } from '../contexts/RegistryContext';
import { useAuth } from '../contexts/AuthContext';
import { getReservations } from '../utils/api';
import { Heart, ExternalLink, Settings } from 'lucide-react';
import ShareButton from '../components/ShareButton';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark/50 font-sans">Loading dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-4">Admin Access Required</h2>
          <Link to="/login" className="text-primary font-semibold hover:text-accent transition-colors">Sign in to manage this registry</Link>
        </div>
      </div>
    );
  }

  const uniqueGuests = new Set(reservations.map(r => r.guest_name)).size;
  const totalValue = reservations.reduce((sum, r) => sum + (r.gift_price || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white/80 backdrop-blur-xl border-b border-dark/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-serif italic text-2xl font-bold text-primary">Gifted</Link>
            <span className="text-dark/20">|</span>
            <div>
              <p className="text-sm font-semibold text-dark">{coupleNames}</p>
              <p className="text-xs text-dark/40">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/${slug}`}
              className="text-dark/50 hover:text-dark flex items-center gap-1.5 text-sm font-medium transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              View Registry
            </Link>
            <ShareButton slug={slug} />
            <Link to="/dashboard"
              className="text-dark/50 hover:text-dark text-sm font-medium transition-colors">
              My Registries
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-[2rem] shadow-lg p-6 text-center border border-dark/5">
            <div className="text-3xl font-bold text-dark">{reservations.length}</div>
            <div className="text-dark/50 text-sm mt-1">Total Reservations</div>
          </div>
          <div className="bg-white rounded-[2rem] shadow-lg p-6 text-center border border-dark/5">
            <div className="text-3xl font-bold text-dark">{uniqueGuests}</div>
            <div className="text-dark/50 text-sm mt-1">Unique Guests</div>
          </div>
          <div className="bg-white rounded-[2rem] shadow-lg p-6 text-center border border-dark/5">
            <div className="text-3xl font-bold text-dark">
              {registry?.primaryCurrency} {totalValue.toLocaleString()}
            </div>
            <div className="text-dark/50 text-sm mt-1">Total Value Reserved</div>
          </div>
        </div>
      </section>

      {/* Reservations Table */}
      <section className="py-4 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-dark mb-6 font-serif italic">All Reservations</h2>
          {reservations.length === 0 ? (
            <div className="bg-white rounded-[2rem] shadow-lg p-8 text-center border border-dark/5">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">No Reservations Yet</h3>
              <p className="text-dark/50">When guests reserve gifts, they'll appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-lg overflow-hidden border border-dark/5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-mono font-medium text-dark/50 uppercase tracking-wider">Gift</th>
                      <th className="px-6 py-4 text-left text-xs font-mono font-medium text-dark/50 uppercase tracking-wider">Guest</th>
                      <th className="px-6 py-4 text-left text-xs font-mono font-medium text-dark/50 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-mono font-medium text-dark/50 uppercase tracking-wider">Reserved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark/5">
                    {reservations.map((r) => (
                      <tr key={r.id} className="hover:bg-background/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark">{r.gift_name}</div>
                          <div className="text-xs text-dark/40">{r.gift_category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark">{r.guest_name}</div>
                          {r.guest_email && <div className="text-xs text-dark/40">{r.guest_email}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                          {r.gift_name === 'Money' ? 'Any Amount' : `${registry?.primaryCurrency} ${r.gift_price?.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark/50">
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
