'use client';

import React from 'react';
import { Input } from './Input';
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
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            disabled={disabled}
            step="0.01"
            min="0"
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
