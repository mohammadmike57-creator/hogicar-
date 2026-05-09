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
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
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
  AUD: 1.51,
  CAD: 1.37,
  JPY: 157.7,
  INR: 83.5,
  CHF: 0.91,
  CNY: 7.25,
  TRY: 32.25,
  NZD: 1.66,
  ZAR: 18.25,
  BRL: 5.15,
  MXN: 16.80,
  SGD: 1.35,
  HKD: 7.81,
};

// Create Context
const CurrencyContext = React.createContext<CurrencyContextType | undefined>(undefined);

// Create Provider
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>('USD');

  const convertPrice = (price: number): number => {
    const rate = CONVERSION_RATES[selectedCurrency] || 1;
    return price * rate;
  };

  const getCurrencySymbol = (): string => {
    return CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$';
  };

  const value = {
    selectedCurrency,
    setSelectedCurrency,
    convertPrice,
    getCurrencySymbol,
    currencies: CURRENCIES,
  };

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
