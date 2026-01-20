'use client';

import React from 'react';
import { Currency } from '@/lib/utils/currency';

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  label?: string;
  disabled?: boolean;
}

export function CurrencySelector({ value, onChange, label, disabled }: CurrencySelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value={Currency.USD}>USD ($)</option>
        <option value={Currency.LBP}>LBP (LBP)</option>
      </select>
    </div>
  );
}
