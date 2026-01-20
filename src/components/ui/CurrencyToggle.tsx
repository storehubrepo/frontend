'use client';

import React from 'react';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { Currency, getCurrencySymbol } from '@/lib/utils/currency';
import { Button } from './Button';

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <Button
      onClick={toggleCurrency}
      variant="outline"
      className="flex items-center gap-2"
    >
      <span className="font-semibold">{getCurrencySymbol(currency)}</span>
      <span className="text-sm">
        {currency === Currency.USD ? 'USD' : 'LBP'}
      </span>
    </Button>
  );
}
