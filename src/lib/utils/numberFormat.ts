/**
 * Number formatting utilities for consistent number handling across the application
 */

/**
 * Format a number with thousand separators for display
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with thousand separators
 */
export const formatNumberWithCommas = (value: number | string | undefined, decimals: number = 2): string => {
  if (value === undefined || value === null || value === '') return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

/**
 * Format a number as currency with thousand separators
 * @param value - The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '$0.00';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numValue);
};

/**
 * Parse a formatted number string (with commas) back to a number
 * @param value - The formatted string to parse
 * @returns The parsed number
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value || value === '') return 0;
  
  // Remove commas and parse
  const cleanValue = value.replace(/,/g, '');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format input value as user types (adds commas on blur or change)
 * @param value - The input value
 * @returns Formatted value for display in input
 */
export const formatInputNumber = (value: string | number): string => {
  if (value === '' || value === undefined || value === null) return '';
  
  const stringValue = String(value);
  
  // If it's being typed (contains decimal point at end), preserve it
  if (stringValue.endsWith('.')) return stringValue;
  
  // Remove any existing commas
  const cleanValue = stringValue.replace(/,/g, '');
  
  // If it's not a valid number, return as is
  if (isNaN(parseFloat(cleanValue))) return '';
  
  // Split into integer and decimal parts
  const parts = cleanValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Reconstruct with decimal if exists
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }
  
  return formattedInteger;
};

/**
 * Validate if a string can be a valid number input
 * @param value - The string to validate
 * @returns true if valid number format
 */
export const isValidNumberInput = (value: string): boolean => {
  if (value === '' || value === '-') return true;
  
  // Allow numbers with optional decimal point and commas
  const numberPattern = /^-?\d{1,3}(,\d{3})*(\.\d*)?$|^-?\d+(\.\d*)?$/;
  return numberPattern.test(value);
};
