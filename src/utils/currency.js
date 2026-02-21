const CURRENCY_SYMBOLS = {
  KES: 'KES',
  DKK: 'kr',
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  JPY: '¥',
  BRL: 'R$',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
};

const CURRENCY_LOCALES = {
  KES: 'en-KE',
  DKK: 'da-DK',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  NGN: 'en-NG',
  JPY: 'ja-JP',
  BRL: 'pt-BR',
  INR: 'en-IN',
  AUD: 'en-AU',
  CAD: 'en-CA',
};

export function formatPrice(price, currency = 'USD', exchangeRate = null, targetCurrency = null) {
  let displayPrice = price;
  let displayCurrency = currency;

  if (targetCurrency && exchangeRate && targetCurrency !== currency) {
    displayPrice = price * exchangeRate;
    displayCurrency = targetCurrency;
  }

  const symbol = CURRENCY_SYMBOLS[displayCurrency] || displayCurrency;
  const locale = CURRENCY_LOCALES[displayCurrency] || 'en-US';
  const formatted = Math.round(displayPrice).toLocaleString(locale);

  // Place symbol before or after based on convention
  if (['DKK'].includes(displayCurrency)) {
    return `${formatted} ${symbol}`;
  }
  return `${symbol} ${formatted}`;
}

export function getCurrencySymbol(currency = 'USD') {
  return CURRENCY_SYMBOLS[currency] || currency;
}
