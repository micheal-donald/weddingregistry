import { Heart } from 'lucide-react';
import { useRegistry } from '../contexts/RegistryContext';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { registry, coupleNames, slug } = useRegistry();
  if (!registry) return null;

  const eventDate = registry.eventDate
    ? new Date(registry.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-[var(--color-primary)]/10 py-12 px-4 mt-16">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <Heart className="w-8 h-8 text-[var(--color-primary)]" />
          <h3 className="text-2xl font-bold text-gray-800">Thank You</h3>
          <Heart className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
        <p className="text-gray-600 mb-6">
          {registry.thankYouMessage}
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{coupleNames}</span>
          {eventDate && <><span>•</span><span>{eventDate}</span></>}
          {registry.eventLocation && <><span>•</span><span>{registry.eventLocation}</span></>}
          <span>•</span>
          <Link
            to={`/${slug}/admin`}
            className="text-[var(--color-primary)] hover:text-[var(--color-secondary)] font-medium transition-colors"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}
          >
            For the Lovebirds
          </Link>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          Powered by <Link to="/" className="text-[var(--color-primary)] hover:underline">Gifted</Link>
        </div>
      </div>
    </footer>
  );
}
