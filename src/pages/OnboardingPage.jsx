import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createRegistry } from '../utils/api';

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'KES', 'DKK', 'NGN', 'JPY', 'BRL', 'INR', 'AUD', 'CAD'];

export default function OnboardingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    partner1Name: '',
    partner2Name: '',
    eventDate: '',
    eventLocation: '',
    primaryCurrency: 'USD',
    secondaryCurrency: '',
  });

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const slug = form.partner1Name && form.partner2Name
    ? `${form.partner1Name}-and-${form.partner2Name}`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
    : '';

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await createRegistry({
        slug,
        partner1Name: form.partner1Name,
        partner2Name: form.partner2Name,
        eventDate: form.eventDate || null,
        eventLocation: form.eventLocation || null,
        primaryCurrency: form.primaryCurrency,
        secondaryCurrency: form.secondaryCurrency || null,
      });

      navigate(`/${result.registry.slug}/admin`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <Link to="/" className="font-serif italic text-4xl font-bold text-primary">Gifted</Link>
          <p className="text-dark/60 mt-3 font-sans">Step {step} of 2</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-lg p-8 border border-dark/5">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-dark mb-1">Tell us about you two</h2>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-2">Partner 1 Name</label>
                <input type="text" value={form.partner1Name} onChange={(e) => update('partner1Name', e.target.value)}
                  className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors"
                  placeholder="First name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-2">Partner 2 Name</label>
                <input type="text" value={form.partner2Name} onChange={(e) => update('partner2Name', e.target.value)}
                  className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors"
                  placeholder="First name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-2">Wedding Date (optional)</label>
                <input type="date" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)}
                  className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-2">Location (optional)</label>
                <input type="text" value={form.eventLocation} onChange={(e) => update('eventLocation', e.target.value)}
                  className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors"
                  placeholder="City, Country" />
              </div>

              {slug && (
                <p className="text-sm text-dark/50">
                  Your registry URL: <span className="font-mono text-primary font-semibold">/{slug}</span>
                </p>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!form.partner1Name || !form.partner2Name}
                className="w-full bg-primary text-background py-3.5 rounded-full font-semibold hover:shadow-lg magnetic-transform hover:scale-[1.02] transition-all disabled:opacity-50 mt-2">
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-dark mb-1">Choose your currencies</h2>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-2">Primary Currency</label>
                <select value={form.primaryCurrency} onChange={(e) => update('primaryCurrency', e.target.value)}
                  className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors">
                  {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-2">Secondary Currency (optional)</label>
                <select value={form.secondaryCurrency} onChange={(e) => update('secondaryCurrency', e.target.value)}
                  className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors">
                  <option value="">None</option>
                  {CURRENCY_OPTIONS.filter(c => c !== form.primaryCurrency).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-xs text-dark/40 mt-1.5">For international couples — guests can toggle between currencies</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3.5 border border-dark/10 text-dark/70 rounded-full font-semibold hover:bg-dark/5 transition-colors">
                  Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 px-6 py-3.5 bg-primary text-background rounded-full font-semibold hover:shadow-lg magnetic-transform hover:scale-[1.02] transition-all disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Registry'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
