export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'VND', name: 'Vietnamese Dong (₫)', symbol: '₫' },
  { code: 'SGD', name: 'Singapore Dollar (S$)', symbol: 'S$' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
];

// Reference rates for sensible defaults (Reference only, not live market rates)
export const REFERENCE_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  SGD: {
    VND: 19000,
    USD: 0.746,
    SGD: 1,
  },
  USD: {
    VND: 25400,
    SGD: 1.34,
    USD: 1,
  },
  VND: {
    SGD: 1 / 19000,
    USD: 1 / 25400,
    VND: 1,
  },
};

export function getCurrencySymbol(currency: string = 'VND'): string {
  const curr = (currency || 'VND').toUpperCase();
  switch (curr) {
    case 'VND':
      return '₫';
    case 'SGD':
      return 'S$';
    case 'USD':
      return '$';
    default:
      return curr;
  }
}

export function formatCurrency(amount: number, currency: string = 'VND'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }
  const curr = (currency || 'VND').toUpperCase();
  if (curr === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  if (curr === 'SGD') {
    const num = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `S$${num}`;
  }
  if (curr === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  } catch {
    return `${amount} ${curr}`;
  }
}

export function getReferenceRate(fromCurrency: string, toCurrency: string): number {
  const from = (fromCurrency || 'VND').toUpperCase();
  const to = (toCurrency || 'VND').toUpperCase();
  if (from === to) return 1.0;
  return REFERENCE_EXCHANGE_RATES[from]?.[to] ?? 1.0;
}
