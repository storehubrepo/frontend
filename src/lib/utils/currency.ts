export enum Currency {
  USD = 'USD',
  LBP = 'LBP',
}

export const EXCHANGE_RATE = 90000; // 1 USD = 90,000 LBP

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === Currency.USD && toCurrency === Currency.LBP) {
    return amount * EXCHANGE_RATE;
  }

  if (fromCurrency === Currency.LBP && toCurrency === Currency.USD) {
    return amount / EXCHANGE_RATE;
  }

  return amount;
}

export interface PriceWithCurrency {
  amount: number;
  currency: Currency;
}

export function convertPrice(
  price: PriceWithCurrency,
  targetCurrency: Currency,
): number {
  return convertCurrency(price.amount, price.currency, targetCurrency);
}

export function formatPrice(
  amount: number,
  currency: Currency,
  locale: string = 'en-US',
): string {
  if (currency === Currency.USD) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  } else {
    // LBP - display with custom formatting
    return `${amount.toLocaleString(locale)} LBP`;
  }
}

export function getCurrencySymbol(currency: Currency): string {
  return currency === Currency.USD ? '$' : 'LBP';
}
