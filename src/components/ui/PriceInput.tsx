'use client';

import React from 'react';
import { NumberInput } from './NumberInput';
import { CurrencySelector } from './CurrencySelector';
import { Currency } from '@/lib/utils/currency';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PriceInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  label,
  placeholder,
  disabled,
  required,
}: PriceInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <NumberInput
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            min={0}
            allowDecimals={true}
            allowNegative={false}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black placeholder:text-gray-400"
          />
        </div>
        <div className="w-32">
          <CurrencySelector
            value={currency}
            onChange={onCurrencyChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
