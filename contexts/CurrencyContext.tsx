import * as React from 'react';

// Define types
interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

interface CurrencyContextType {
  selectedCurrency: string; // e.g. "USD"
  setSelectedCurrency: (currency: string) => void;
  convertPrice: (price: number) => number;
  getCurrencySymbol: () => string;
  currencies: Currency[];
}

// Mock Data
export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD', flag: '🇯🇴' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR', flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', flag: '🇶🇦' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'RO', flag: '🇴🇲' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', flag: '🇰🇼' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', flag: '🇲🇦' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA', flag: '🇩🇿' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', flag: '🇹🇳' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD', flag: '🇱🇾' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', flag: '🇮🇱' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
];

const CONVERSION_RATES: { [key: string]: number } = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JOD: 0.71,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  BHD: 0.38,
  OMR: 0.38,
  EGP: 47.30,
  KWD: 0.31,
  MAD: 10.10,
  DZD: 134.50,
  TND: 3.12,
  LYD: 4.85,
  TRY: 32.25,
  AUD: 1.51,
  CAD: 1.37,
  JPY: 157.7,
  INR: 83.5,
  CHF: 0.91,
  CNY: 7.25,
  RUB: 92.50,
  KRW: 1365,
  SGD: 1.35,
  HKD: 7.81,
  NZD: 1.66,
  THB: 36.60,
  MYR: 4.74,
  IDR: 16050,
  PHP: 57.80,
  VND: 25450,
  PKR: 278.50,
  BDT: 110.00,
  ZAR: 18.25,
  BRL: 5.15,
  MXN: 16.80,
  ILS: 3.72,
  PLN: 3.98,
  SEK: 10.82,
  NOK: 10.75,
  DKK: 6.91,
  CZK: 23.05,
  HUF: 362.50,
};

// Create Context
const CurrencyContext = React.createContext<CurrencyContextType | undefined>(undefined);

// Create Provider
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>('USD');

  const convertPrice = React.useCallback((price: number): number => {
    const rate = CONVERSION_RATES[selectedCurrency] || 1;
    return price * rate;
  }, [selectedCurrency]);

  const getCurrencySymbol = React.useCallback(() => {
    return CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$';
  }, [selectedCurrency]);

  const value = React.useMemo(() => ({
    selectedCurrency,
    setSelectedCurrency,
    convertPrice,
    getCurrencySymbol,
    currencies: CURRENCIES,
  }), [selectedCurrency, convertPrice, getCurrencySymbol]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

// Create Hook
export const useCurrency = (): CurrencyContextType => {
  const context = React.useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
