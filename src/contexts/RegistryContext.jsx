import { createContext, useContext, useState, useEffect } from 'react';
import { getRegistryConfig } from '../utils/api';

const RegistryContext = createContext(null);

export function RegistryProvider({ slug, children }) {
  const [registry, setRegistry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Currency display state
  const [activeCurrency, setActiveCurrency] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getRegistryConfig(slug)
      .then((data) => {
        if (cancelled) return;
        setRegistry(data);
        setActiveCurrency(data.primaryCurrency);

        // Apply theme CSS variables
        document.documentElement.style.setProperty('--color-primary', data.themePrimaryColor || '#ec4899');
        document.documentElement.style.setProperty('--color-secondary', data.themeSecondaryColor || '#f43f5e');
        document.documentElement.style.setProperty('--font-display', `'${data.themeFontFamily || 'Great Vibes'}', cursive`);

        // Update page title
        const names = data.coupleDisplayName || `${data.partner1Name} & ${data.partner2Name}`;
        document.title = `${names} — Wedding Registry`;
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  const toggleCurrency = () => {
    if (!registry?.secondaryCurrency) return;
    setActiveCurrency(prev =>
      prev === registry.primaryCurrency ? registry.secondaryCurrency : registry.primaryCurrency
    );
  };

  const coupleNames = registry
    ? (registry.coupleDisplayName || `${registry.partner1Name} & ${registry.partner2Name}`)
    : '';

  return (
    <RegistryContext.Provider value={{
      registry, loading, error, slug,
      activeCurrency, toggleCurrency,
      coupleNames
    }}>
      {children}
    </RegistryContext.Provider>
  );
}

export function useRegistry() {
  const ctx = useContext(RegistryContext);
  if (!ctx) throw new Error('useRegistry must be used within RegistryProvider');
  return ctx;
}
