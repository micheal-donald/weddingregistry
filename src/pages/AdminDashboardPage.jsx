import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RegistryProvider, useRegistry } from '../contexts/RegistryContext';
import { useAuth } from '../contexts/AuthContext';
import { getReservations, updateRegistrySettings } from '../utils/api';
import { Heart, ExternalLink, Settings, BarChart3 } from 'lucide-react';
import ShareButton from '../components/ShareButton';

function AdminContent() {
  const { registry, coupleNames, slug, loading: configLoading } = useRegistry();
  const { isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-white rounded-full p-1 border border-dark/5 w-fit">
          <button onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-primary text-background' : 'text-dark/50 hover:text-dark'}`}>
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>
          <button onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-primary text-background' : 'text-dark/50 hover:text-dark'}`}>
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <OverviewTab reservations={reservations} uniqueGuests={uniqueGuests} totalValue={totalValue} registry={registry} />
      )}
      {activeTab === 'settings' && (
        <SettingsTab registry={registry} slug={slug} />
      )}
    </div>
  );
}

function OverviewTab({ reservations, uniqueGuests, totalValue, registry }) {
  return (
    <>
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
    </>
  );
}

function SettingsTab({ registry, slug }) {
  const [form, setForm] = useState({
    partner1Name: registry?.partner1Name || '',
    partner2Name: registry?.partner2Name || '',
    eventDate: registry?.eventDate ? registry.eventDate.split('T')[0] : '',
    eventLocation: registry?.eventLocation || '',
    heroHeading: registry?.heroHeading || '',
    heroSubheading: registry?.heroSubheading || '',
    thankYouMessage: registry?.thankYouMessage || '',
    primaryCurrency: registry?.primaryCurrency || 'USD',
    secondaryCurrency: registry?.secondaryCurrency || '',
    exchangeRate: registry?.exchangeRate || '',
    themePrimaryColor: registry?.themePrimaryColor || '#ec4899',
    themeSecondaryColor: registry?.themeSecondaryColor || '#f43f5e',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateRegistrySettings(slug, {
        partner1Name: form.partner1Name,
        partner2Name: form.partner2Name,
        eventDate: form.eventDate || null,
        eventLocation: form.eventLocation || null,
        heroHeading: form.heroHeading || null,
        heroSubheading: form.heroSubheading || null,
        thankYouMessage: form.thankYouMessage || null,
        primaryCurrency: form.primaryCurrency,
        secondaryCurrency: form.secondaryCurrency || null,
        exchangeRate: form.exchangeRate ? parseFloat(form.exchangeRate) : null,
        themePrimaryColor: form.themePrimaryColor,
        themeSecondaryColor: form.themeSecondaryColor,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors";

  return (
    <section className="py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[2rem] shadow-lg p-8 border border-dark/5 space-y-6">
          <h2 className="text-2xl font-bold text-dark font-serif italic">Registry Settings</h2>

          {/* Couple Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-medium text-dark/50 uppercase tracking-wider">Couple Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Partner 1</label>
                <input type="text" value={form.partner1Name} onChange={(e) => update('partner1Name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Partner 2</label>
                <input type="text" value={form.partner2Name} onChange={(e) => update('partner2Name', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Event Date</label>
                <input type="date" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Location</label>
                <input type="text" value={form.eventLocation} onChange={(e) => update('eventLocation', e.target.value)} className={inputClass} placeholder="City, Country" />
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-medium text-dark/50 uppercase tracking-wider">Page Copy</h3>
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-1">Hero Heading</label>
              <input type="text" value={form.heroHeading} onChange={(e) => update('heroHeading', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-1">Hero Subheading</label>
              <textarea value={form.heroSubheading} onChange={(e) => update('heroSubheading', e.target.value)} className={inputClass} rows="2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-1">Thank You Message</label>
              <textarea value={form.thankYouMessage} onChange={(e) => update('thankYouMessage', e.target.value)} className={inputClass} rows="2" />
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-medium text-dark/50 uppercase tracking-wider">Currency</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Primary</label>
                <input type="text" value={form.primaryCurrency} onChange={(e) => update('primaryCurrency', e.target.value)} className={inputClass} maxLength={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Secondary</label>
                <input type="text" value={form.secondaryCurrency} onChange={(e) => update('secondaryCurrency', e.target.value)} className={inputClass} maxLength={3} placeholder="Optional" />
              </div>
            </div>
            {form.secondaryCurrency && (
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Exchange Rate (1 {form.primaryCurrency} = ? {form.secondaryCurrency})</label>
                <input type="number" step="any" value={form.exchangeRate} onChange={(e) => update('exchangeRate', e.target.value)} className={inputClass} />
              </div>
            )}
          </div>

          {/* Theme */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-medium text-dark/50 uppercase tracking-wider">Theme Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.themePrimaryColor} onChange={(e) => update('themePrimaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-dark/10 cursor-pointer" />
                  <input type="text" value={form.themePrimaryColor} onChange={(e) => update('themePrimaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-dark/10 rounded-lg bg-background/50 text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">Secondary Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.themeSecondaryColor} onChange={(e) => update('themeSecondaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-dark/10 cursor-pointer" />
                  <input type="text" value={form.themeSecondaryColor} onChange={(e) => update('themeSecondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-dark/10 rounded-lg bg-background/50 text-sm font-mono" />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-primary text-background py-3.5 rounded-full font-semibold hover:shadow-lg magnetic-transform hover:scale-[1.02] transition-all disabled:opacity-50">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </section>
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
