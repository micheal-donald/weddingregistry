import { Heart, Plus } from 'lucide-react';
import { useRegistry } from '../contexts/RegistryContext';
import { useAuth } from '../contexts/AuthContext';
import CurrencyToggle from './CurrencyToggle';
import ShareButton from './ShareButton';

export default function Header({ onAddGift }) {
  const { coupleNames, slug } = useRegistry();
  const { isAuthenticated } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-[var(--color-primary)]/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>
                {coupleNames}
              </h1>
              <p className="text-[var(--color-primary)] font-medium">Wedding Registry</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <CurrencyToggle />
            <ShareButton slug={slug} />

            {isAuthenticated && onAddGift && (
              <button
                onClick={onAddGift}
                className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Gift</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
