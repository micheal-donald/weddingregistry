import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyRegistries } from '../utils/api';
import { Heart, Plus, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [registries, setRegistries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyRegistries()
      .then(setRegistries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-dark/50 font-sans">Loading your registries...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white/80 backdrop-blur-xl border-b border-dark/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-serif italic text-2xl font-bold text-primary">Gifted</Link>
            <span className="text-dark/20">|</span>
            <span className="text-sm text-dark/50">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/new"
              className="bg-primary text-background px-5 py-2.5 rounded-full font-semibold hover:shadow-lg magnetic-transform hover:scale-105 transition-all flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              <span>New Registry</span>
            </Link>
            <button onClick={logout}
              className="text-dark/50 hover:text-dark font-medium transition-colors text-sm">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-dark mb-8 font-serif italic">My Registries</h1>

        {registries.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-lg p-12 text-center border border-dark/5">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-dark mb-2">No registries yet</h2>
            <p className="text-dark/50 mb-6">Create your first wedding registry in under a minute.</p>
            <Link to="/new"
              className="inline-flex items-center gap-2 bg-primary text-background px-8 py-3.5 rounded-full font-semibold hover:shadow-lg magnetic-transform hover:scale-[1.02] transition-all">
              <Plus className="w-5 h-5" />
              <span>Create Your Registry</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registries.map((reg) => (
              <div key={reg.id} className="bg-white rounded-[2rem] shadow-lg p-6 hover:shadow-xl transition-shadow border border-dark/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: reg.theme_primary_color || '#66507A' }}>
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark">
                      {reg.couple_display_name || `${reg.partner1_name} & ${reg.partner2_name}`}
                    </h3>
                    {reg.event_date && (
                      <p className="text-sm text-dark/50">
                        {new Date(reg.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {reg.event_location && (
                  <p className="text-sm text-dark/50 mb-4">{reg.event_location}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-dark/5">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${reg.is_published ? 'bg-sage/20 text-sage' : 'bg-accent/20 text-accent'}`}>
                    {reg.is_published ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex gap-3">
                    <Link to={`/${reg.slug}/admin`}
                      className="text-sm text-primary hover:text-accent font-semibold transition-colors">
                      Manage
                    </Link>
                    <Link to={`/${reg.slug}`}
                      className="text-sm text-dark/40 hover:text-dark/70 flex items-center gap-1 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                      <span>View</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
