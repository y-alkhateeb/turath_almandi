import { Currency } from './enum';

export interface CurrencySettings {
  defaultCurrency: Currency;
  currencies: Currency[];
}

export interface CurrencyWithUsage {
  code: string;
  name_ar: string;
  name_en: string;
  symbol: string;
  isDefault: boolean;
  usage: {
    transactions: number;
    debts: number;
    payments: number;
  };
}

export interface CreateCurrencyInput {
  code: string;
  name_ar: string;
  name_en: string;
  symbol: string;
}

export interface SetDefaultCurrencyInput {
  code: string;
}

export interface AppSettings {
  appName?: string;
  appIconUrl?: string;
  loginBackgroundUrl?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: 'ar' | 'en';
}

export interface UpdateAppSettingsInput {
  loginBackgroundUrl?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: 'ar' | 'en';
}
