import { useRegistry } from '../contexts/RegistryContext';

const FLAG_MAP = {
  KES: 'ke', DKK: 'dk', USD: 'us', EUR: 'eu', GBP: 'gb',
  NGN: 'ng', JPY: 'jp', BRL: 'br', INR: 'in', AUD: 'au', CAD: 'ca',
};

export default function CurrencyToggle() {
  const { registry, activeCurrency, toggleCurrency } = useRegistry();

  if (!registry?.secondaryCurrency) return null;

  const primary = registry.primaryCurrency;
  const secondary = registry.secondaryCurrency;
  const other = activeCurrency === primary ? secondary : primary;

  return (
    <button
      onClick={toggleCurrency}
      className="bg-white/90 backdrop-blur-sm border-2 border-[var(--color-primary)]/20 px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2 group"
      title={`Switch to ${other}`}
    >
      <div className="flex items-center space-x-2">
        {FLAG_MAP[activeCurrency] && (
          <img
            src={`https://flagcdn.com/w40/${FLAG_MAP[activeCurrency]}.png`}
            alt={activeCurrency}
            className="w-6 h-4 object-cover rounded-sm shadow-sm"
          />
        )}
        <span className="text-sm font-bold text-gray-700">{activeCurrency}</span>
      </div>
      <span className="text-xs text-gray-400 group-hover:text-[var(--color-primary)] transition-colors">→</span>
      {FLAG_MAP[other] && (
        <img
          src={`https://flagcdn.com/w40/${FLAG_MAP[other]}.png`}
          alt={other}
          className="w-5 h-3.5 object-cover rounded-sm opacity-40 group-hover:opacity-60 transition-opacity"
        />
      )}
    </button>
  );
}
