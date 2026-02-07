'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { formatPrice as formatPriceLib, getCurrencySymbol as getCurrencySymbolLib, CurrencyCode, CURRENCIES } from '@/lib/currency';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ShopSettings } from '@/types';

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => void;
    formatPrice: (amountInPKR: number) => string;
    getCurrencySymbol: () => string;
    baseCurrency: string;
    conversionRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'preferred_currency';

// Default rates (relative to 1 unit of currency vs PKR)
// Converted Value = PKR / rate
const DEFAULT_RATES: Record<string, number> = {
    USD: 280,
    EUR: 300,
    GBP: 350,
    PKR: 1,
    INR: 3.3,
    AED: 76,
    SAR: 74,
    CAD: 205,
    AUD: 185,
    JPY: 1.85,
    CNY: 38,
    CHF: 310,
    SEK: 26,
    NZD: 170,
    SGD: 205,
    HKD: 35,
    NOK: 26,
    KRW: 0.21,
    TRY: 8.6,
    BRL: 55,
    ZAR: 15,
    MXN: 16.5,
    THB: 7.8,
    MYR: 60,
    IDR: 0.018,
    VND: 0.011,
    PHP: 5,
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { firestore } = useFirebase();

    // Fetch shop settings for custom rates
    const settingsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'shopSettings', 'config') : null),
        [firestore]
    );
    const { data: settings } = useDoc<ShopSettings>(settingsRef);

    // Initialize from localStorage or default to PKR
    const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && stored in CURRENCIES) {
                return stored as CurrencyCode;
            }
        }
        return 'PKR';
    });

    // Get current rate
    const currentRate = useMemo(() => {
        const customRates = settings?.currencySettings?.rates;
        if (customRates && customRates[currency]) {
            return customRates[currency];
        }
        return DEFAULT_RATES[currency] || 1;
    }, [settings, currency]);

    // Persist currency selection to localStorage
    const setCurrency = (newCurrency: CurrencyCode) => {
        setCurrencyState(newCurrency);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, newCurrency);
        }
    };

    const formatPrice = (amountInPKR: number) => {
        // formula: Converted Value = Base PKR Amount / Exchange Rate
        const convertedAmount = currency === 'PKR' ? amountInPKR : amountInPKR / currentRate;
        return formatPriceLib(convertedAmount, currency);
    };

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                setCurrency,
                formatPrice,
                getCurrencySymbol: () => getCurrencySymbolLib(currency),
                baseCurrency: 'PKR',
                conversionRate: currentRate,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within CurrencyProvider');
    }
    return context;
}
