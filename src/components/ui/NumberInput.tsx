import React, { useState, useEffect } from 'react';
import { formatInputNumber, parseFormattedNumber } from '@/lib/utils/numberFormat';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> {
  value: number | string | undefined;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  allowDecimals?: boolean;
  allowNegative?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  label,
  min,
  max,
  allowDecimals = true,
  allowNegative = false,
  className = '',
  placeholder = '0',
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      // When not focused, show formatted value
      if (value === undefined || value === null || value === '') {
        setDisplayValue('');
      } else {
        setDisplayValue(formatInputNumber(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Remove all commas for processing
    inputValue = inputValue.replace(/,/g, '');

    // Validate input
    if (inputValue === '' || inputValue === '-') {
      setDisplayValue(inputValue);
      if (inputValue === '') {
        onChange(0);
      }
      return;
    }

    // Check for negative numbers
    if (!allowNegative && inputValue.startsWith('-')) {
      return;
    }

    // Check for decimals
    if (!allowDecimals && inputValue.includes('.')) {
      return;
    }

    // Validate it's a valid number format
    const validPattern = allowDecimals 
      ? /^-?\d*\.?\d*$/
      : /^-?\d*$/;

    if (!validPattern.test(inputValue)) {
      return;
    }

    // Update display value (without formatting while typing)
    setDisplayValue(inputValue);

    // Parse and send to parent
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      // Check min/max constraints
      if (min !== undefined && numValue < min) return;
      if (max !== undefined && numValue > max) return;
      
      onChange(numValue);
    } else if (inputValue === '' || inputValue === '-') {
      onChange(0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // On blur, format the number
    if (displayValue && displayValue !== '-') {
      const numValue = parseFormattedNumber(displayValue);
      
      // Apply min/max constraints
      let finalValue = numValue;
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;
      
      if (finalValue !== numValue) {
        onChange(finalValue);
      }
      
      setDisplayValue(formatInputNumber(finalValue));
    } else {
      setDisplayValue('');
      onChange(0);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Remove commas when focused for easier editing
    const cleanValue = displayValue.replace(/,/g, '');
    setDisplayValue(cleanValue);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
};
