import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyRegistries } from '../utils/api';
import { Heart, Plus, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [registries, setRegistries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    getMyRegistries()
      .then(setRegistries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading your registries...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">My Registries</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/new"
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Registry</span>
            </Link>
            <button onClick={logout}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {registries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">💍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No registries yet</h2>
            <p className="text-gray-600 mb-6">Create your first wedding registry in under a minute.</p>
            <Link to="/new"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all">
              <Plus className="w-5 h-5" />
              <span>Create Your Registry</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registries.map((reg) => (
              <div key={reg.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: reg.theme_primary_color || '#ec4899' }}>
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {reg.couple_display_name || `${reg.partner1_name} & ${reg.partner2_name}`}
                    </h3>
                    {reg.event_date && (
                      <p className="text-sm text-gray-500">
                        {new Date(reg.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {reg.event_location && (
                  <p className="text-sm text-gray-500 mb-4">{reg.event_location}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className={`text-xs px-2 py-1 rounded-full ${reg.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {reg.is_published ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex space-x-2">
                    <Link to={`/${reg.slug}/admin`}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                      Manage
                    </Link>
                    <Link to={`/${reg.slug}`}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
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
