import * as React from 'react';

// Define types
interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencyContextType {
  selectedCurrency: string; // e.g. "USD"
  setSelectedCurrency: (currency: string) => void;
  convertPrice: (price: number) => number;
  getCurrencySymbol: () => string;
  currencies: Currency[];
}

// Mock Data
const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JOD' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

const CONVERSION_RATES: { [key: string]: number } = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JOD: 0.71,
  AED: 3.67,
  AUD: 1.51,
  CAD: 1.37,
  JPY: 157.7,
  INR: 83.5,
  CHF: 0.91,
  CNY: 7.25,
  NZD: 1.66,
  ZAR: 18.25,
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
