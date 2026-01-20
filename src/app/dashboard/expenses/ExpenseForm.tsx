'use client';

import React, { useState, useEffect } from 'react';
import { expensesApi, Expense, RecurrenceCycle, CreateExpenseDto } from '@/lib/api/expenses';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { getAuthToken } from '@/lib/auth';
import { PriceInput } from '@/components/ui/PriceInput';
import { Currency } from '@/lib/utils/currency';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateExpenseDto>({
    description: '',
    type: '',
    cost: 0,
    currency: Currency.USD,
    date: new Date().toISOString().split('T')[0],
    recurrenceCycle: RecurrenceCycle.ONCE,
    recurrenceEndDate: undefined,
    isActive: true,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [customType, setCustomType] = useState('');
  const [useCustomType, setUseCustomType] = useState(false);
  const [existingTypes, setExistingTypes] = useState<string[]>([]);
  const [costCurrency, setCostCurrency] = useState<Currency>(Currency.USD);

  useEffect(() => {
    loadExistingTypes();
    if (expense) {
      const expenseCurrency = expense.currency || Currency.USD;
      setCostCurrency(expenseCurrency);
      setFormData({
        description: expense.description,
        type: expense.type,
        cost: expense.cost,
        currency: expenseCurrency,
        date: new Date(expense.date).toISOString().split('T')[0],
        recurrenceCycle: expense.recurrenceCycle,
        recurrenceEndDate: expense.recurrenceEndDate
          ? new Date(expense.recurrenceEndDate).toISOString().split('T')[0]
          : undefined,
        isActive: expense.isActive,
        notes: expense.notes || '',
      });
    }
  }, [expense]);

  const loadExistingTypes = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const types = await expensesApi.getTypes(token);
      setExistingTypes(types);
    } catch (error) {
      console.error('Failed to load expense types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        alert('Please login to continue');
        return;
      }

      const dataToSubmit = {
        ...formData,
        type: useCustomType ? customType : formData.type,
        date: new Date(formData.date).toISOString(),
        recurrenceEndDate: formData.recurrenceEndDate
          ? new Date(formData.recurrenceEndDate).toISOString()
          : undefined,
      };

      if (expense) {
        await expensesApi.update(expense.id, dataToSubmit, token);
      } else {
        await expensesApi.create(dataToSubmit, token);
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const recurrenceOptions = [
    { value: RecurrenceCycle.ONCE, label: 'One-time' },
    { value: RecurrenceCycle.DAILY, label: 'Daily' },
    { value: RecurrenceCycle.WEEKLY, label: 'Weekly' },
    { value: RecurrenceCycle.BIWEEKLY, label: 'Bi-weekly' },
    { value: RecurrenceCycle.MONTHLY, label: 'Monthly' },
    { value: RecurrenceCycle.QUARTERLY, label: 'Quarterly' },
    { value: RecurrenceCycle.YEARLY, label: 'Yearly' },
  ];

  const commonTypes = [
    'Electricity',
    'Water',
    'Internet',
    'Rent',
    'Salaries',
    'Insurance',
    'Maintenance',
    'Supplies',
    'Marketing',
    'Transportation',
    'Equipment',
    'Software',
    'Other',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Description */}
        <div className="md:col-span-2">
          <Input
            label="Description"
            type="text"
            placeholder="e.g., Monthly electricity bill"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </div>

        {/* Type Selection */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-black mb-2">
            Expense Type
          </label>
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={!useCustomType}
                onChange={() => setUseCustomType(false)}
                className="mr-2"
              />
              <span className="text-sm text-black">Select from list</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={useCustomType}
                onChange={() => setUseCustomType(true)}
                className="mr-2"
              />
              <span className="text-sm text-black">Custom type</span>
            </label>
          </div>

          {useCustomType ? (
            <Input
              type="text"
              placeholder="Enter custom type"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              required
            />
          ) : (
            <Select
              options={[
                { value: '', label: 'Select a type' },
                ...commonTypes.map((type) => ({ value: type, label: type })),
                ...existingTypes
                  .filter((type) => !commonTypes.includes(type))
                  .map((type) => ({ value: type, label: type })),
              ]}
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              required
            />
          )}
        </div>

        {/* Cost */}
        <div>
          <PriceInput
            label="Cost"
            value={formData.cost}
            onChange={(value) => setFormData({ ...formData, cost: value })}
            currency={costCurrency}
            onCurrencyChange={(currency) => {
              setCostCurrency(currency);
              setFormData({ ...formData, currency });
            }}
            required
          />
        </div>

        {/* Date */}
        <div>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
            required
          />
        </div>

        {/* Recurrence Cycle */}
        <div>
          <Select
            label="Recurrence"
            options={recurrenceOptions}
            value={formData.recurrenceCycle || RecurrenceCycle.ONCE}
            onChange={(e) =>
              setFormData({
                ...formData,
                recurrenceCycle: e.target.value as RecurrenceCycle,
              })
            }
          />
        </div>

        {/* Recurrence End Date (only if not one-time) */}
        {formData.recurrenceCycle !== RecurrenceCycle.ONCE && (
          <div>
            <Input
              label="End Date (Optional)"
              type="date"
              value={formData.recurrenceEndDate || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recurrenceEndDate: e.target.value || undefined,
                })
              }
              min={formData.date}
            />
          </div>
        )}

        {/* Active Status */}
        <div className="md:col-span-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="mr-3 w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div>
              <span className="text-sm font-medium text-black">
                Active Expense
              </span>
              <p className="text-xs text-black">
                Include this expense in analytics calculations
              </p>
            </div>
          </label>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <Textarea
            label="Notes (Optional)"
            placeholder="Add any additional notes about this expense..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </div>
      </div>

      {/* Info Box for Recurring Expenses */}
      {formData.recurrenceCycle !== RecurrenceCycle.ONCE && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-3 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Recurring Expense
              </p>
              <p className="text-sm text-blue-700 mt-1">
                This expense will be automatically calculated in your analytics based on
                the {formData.recurrenceCycle} frequency. The cost of{' '}
                <strong>${formData.cost || 0}</strong> will be applied for each period.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={loading}>
          {expense ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
