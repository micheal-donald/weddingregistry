import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(email, password, displayName);
      navigate('/new');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-serif italic text-4xl font-bold text-primary">Gifted</Link>
          <p className="text-dark/60 mt-3 font-sans">Start building your dream registry</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-lg p-8 border border-dark/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-2">Your Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors"
                placeholder="Your name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark/70 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors"
                placeholder="you@example.com" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark/70 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-dark/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background/50 transition-colors"
                placeholder="At least 8 characters" required minLength={8} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-background py-3.5 rounded-full font-semibold hover:shadow-lg magnetic-transform hover:scale-[1.02] transition-all disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-dark/50 mt-6 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:text-accent transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
