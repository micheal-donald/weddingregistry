import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createRegistry } from '../utils/api';
import { Heart } from 'lucide-react';

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

      navigate(`/${result.registry.slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Your Registry</h1>
          <p className="text-gray-600">Step {step} of 2</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner 1 Name</label>
              <input type="text" value={form.partner1Name} onChange={(e) => update('partner1Name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="First name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner 2 Name</label>
              <input type="text" value={form.partner2Name} onChange={(e) => update('partner2Name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="First name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wedding Date (optional)</label>
              <input type="date" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (optional)</label>
              <input type="text" value={form.eventLocation} onChange={(e) => update('eventLocation', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="City, Country" />
            </div>

            {slug && (
              <p className="text-sm text-gray-500">
                Your registry URL: <span className="font-mono text-pink-600">/{slug}</span>
              </p>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!form.partner1Name || !form.partner2Name}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 mt-4">
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Currency</label>
              <select value={form.primaryCurrency} onChange={(e) => update('primaryCurrency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Currency (optional)</label>
              <select value={form.secondaryCurrency} onChange={(e) => update('secondaryCurrency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                <option value="">None</option>
                {CURRENCY_OPTIONS.filter(c => c !== form.primaryCurrency).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">For international couples — guests can toggle between currencies</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
            )}

            <div className="flex space-x-4 pt-4">
              <button onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Registry'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
