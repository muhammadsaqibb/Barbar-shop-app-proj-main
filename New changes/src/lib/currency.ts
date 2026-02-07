// Supported currencies with their symbols and formatting
export const CURRENCIES = {
    USD: { symbol: '$', code: 'USD', name: 'US Dollar', locale: 'en-US' },
    EUR: { symbol: '€', code: 'EUR', name: 'Euro', locale: 'de-DE' },
    GBP: { symbol: '£', code: 'GBP', name: 'British Pound', locale: 'en-GB' },
    PKR: { symbol: 'PKR', code: 'PKR', name: 'Pakistani Rupee', locale: 'en-PK' },
    INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', locale: 'en-IN' },
    AED: { symbol: 'AED', code: 'AED', name: 'UAE Dirham', locale: 'ar-AE' },
    SAR: { symbol: 'SAR', code: 'SAR', name: 'Saudi Riyal', locale: 'ar-SA' },
    CAD: { symbol: 'CA$', code: 'CAD', name: 'Canadian Dollar', locale: 'en-CA' },
    AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar', locale: 'en-AU' },
    JPY: { symbol: '¥', code: 'JPY', name: 'Japanese Yen', locale: 'ja-JP' },
    CNY: { symbol: '¥', code: 'CNY', name: 'Chinese Yuan', locale: 'zh-CN' },
    CHF: { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
    SEK: { symbol: 'kr', code: 'SEK', name: 'Swedish Krona', locale: 'sv-SE' },
    NZD: { symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar', locale: 'en-NZ' },
    SGD: { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar', locale: 'en-SG' },
    HKD: { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar', locale: 'en-HK' },
    NOK: { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone', locale: 'nb-NO' },
    KRW: { symbol: '₩', code: 'KRW', name: 'South Korean Won', locale: 'ko-KR' },
    TRY: { symbol: '₺', code: 'TRY', name: 'Turkish Lira', locale: 'tr-TR' },
    BRL: { symbol: 'R$', code: 'BRL', name: 'Brazilian Real', locale: 'pt-BR' },
    ZAR: { symbol: 'R', code: 'ZAR', name: 'South African Rand', locale: 'en-ZA' },
    MXN: { symbol: 'MX$', code: 'MXN', name: 'Mexican Peso', locale: 'es-MX' },
    THB: { symbol: '฿', code: 'THB', name: 'Thai Baht', locale: 'th-TH' },
    MYR: { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit', locale: 'ms-MY' },
    IDR: { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah', locale: 'id-ID' },
    VND: { symbol: '₫', code: 'VND', name: 'Vietnamese Dong', locale: 'vi-VN' },
    PHP: { symbol: '₱', code: 'PHP', name: 'Philippine Peso', locale: 'en-PH' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/**
 * Format price with currency symbol
 * @param amount - The numeric amount to format
 * @param currencyCode - The currency code (defaults to PKR)
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(amount: number, currencyCode: CurrencyCode = 'PKR'): string {
    const currency = CURRENCIES[currencyCode] || CURRENCIES.PKR;

    // For currencies with symbols before amount (USD, EUR, GBP, etc.)
    if (['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'BRL', 'MXN'].includes(currencyCode)) {
        return `${currency.symbol}${amount.toLocaleString()}`;
    }

    // For currencies with symbols after amount (PKR, AED, SAR, etc.)
    return `${currency.symbol} ${amount.toLocaleString()}`;
}

/**
 * Get currency symbol only
 * @param currencyCode - The currency code (defaults to PKR)
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyCode: CurrencyCode = 'PKR'): string {
    return CURRENCIES[currencyCode]?.symbol || 'PKR';
}

/**
 * Get all available currencies as an array
 * @returns Array of currency objects
 */
export function getAllCurrencies() {
    return Object.entries(CURRENCIES).map(([currencyCode, currency]) => ({
        code: currencyCode as CurrencyCode,
        symbol: currency.symbol,
        name: currency.name,
        locale: currency.locale,
    }));
}
