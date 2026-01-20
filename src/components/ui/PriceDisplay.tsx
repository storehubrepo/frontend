'use client';

import React from 'react';
import { Currency, convertCurrency, formatPrice } from '@/lib/utils/currency';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface PriceDisplayProps {
  amount: number;
  currency: Currency;
  className?: string;
  showOriginal?: boolean;
}

export function PriceDisplay({ 
  amount, 
  currency, 
  className = '',
  showOriginal = false 
}: PriceDisplayProps) {
  const { currency: displayCurrency } = useCurrency();

  // Convert to display currency
  const displayAmount = convertCurrency(amount, currency, displayCurrency);
  const formattedPrice = formatPrice(displayAmount, displayCurrency);

  return (
    <div className={className}>
      <span className="font-medium">{formattedPrice}</span>
      {showOriginal && displayCurrency !== currency && (
        <span className="text-xs text-gray-500 ml-2">
          ({formatPrice(amount, currency)})
        </span>
      )}
    </div>
  );
}
