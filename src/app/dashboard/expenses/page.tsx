'use client';

import React, { useState, useEffect } from 'react';
import { expensesApi, Expense, RecurrenceCycle } from '@/lib/api/expenses';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import ExpenseForm from '@/app/dashboard/expenses/ExpenseForm';
import { getAuthToken } from '@/lib/auth';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRecurrence, setFilterRecurrence] = useState<string>('all');
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  
  useEffect(() => {
    loadExpenses();
    loadExpenseTypes();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, filterType, filterRecurrence]);

  const loadExpenses = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const data = await expensesApi.getAll(token);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenseTypes = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const types = await expensesApi.getTypes(token);
      setExpenseTypes(types);
    } catch (error) {
      console.error('Failed to load expense types:', error);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((expense) => expense.type === filterType);
    }

    // Recurrence filter
    if (filterRecurrence !== 'all') {
      filtered = filtered.filter(
        (expense) => expense.recurrenceCycle === filterRecurrence
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const token = getAuthToken();
      if (!token) return;
      
      await expensesApi.delete(id, token);
      loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    loadExpenses();
    loadExpenseTypes();
  };

  const getRecurrenceBadgeVariant = (cycle: RecurrenceCycle) => {
    if (cycle === RecurrenceCycle.ONCE) return 'default';
    if (cycle === RecurrenceCycle.MONTHLY || cycle === RecurrenceCycle.YEARLY)
      return 'info';
    return 'success';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateMonthlyTotal = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return filteredExpenses.reduce((total, expense) => {
      const expenseDate = new Date(expense.date);
      if (expense.recurrenceCycle === RecurrenceCycle.ONCE) {
        if (expenseDate >= monthStart && expenseDate <= monthEnd) {
          return total + Number(expense.cost);
        }
      } else if (expense.isActive) {
        // For recurring, include if it's active this month
        if (expenseDate <= monthEnd) {
          return total + Number(expense.cost);
        }
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Expenses</h1>
          <p className="text-black">
            Manage your business expenses and track recurring costs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Expenses</p>
                <p className="text-3xl font-bold mt-1">{expenses.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(calculateMonthlyTotal())}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Recurring</p>
                <p className="text-3xl font-bold mt-1">
                  {
                    expenses.filter(
                      (e) => e.recurrenceCycle !== RecurrenceCycle.ONCE
                    ).length
                  }
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Add Button */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder:text-black"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
            >
              <option value="all">All Types</option>
              {expenseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={filterRecurrence}
              onChange={(e) => setFilterRecurrence(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-black"
            >
              <option value="all">All Frequencies</option>
              <option value={RecurrenceCycle.ONCE}>One-time</option>
              <option value={RecurrenceCycle.DAILY}>Daily</option>
              <option value={RecurrenceCycle.WEEKLY}>Weekly</option>
              <option value={RecurrenceCycle.BIWEEKLY}>Bi-weekly</option>
              <option value={RecurrenceCycle.MONTHLY}>Monthly</option>
              <option value={RecurrenceCycle.QUARTERLY}>Quarterly</option>
              <option value={RecurrenceCycle.YEARLY}>Yearly</option>
            </select>
            <Button onClick={handleAdd} className="whitespace-nowrap">
              <span className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Expense
              </span>
            </Button>
          </div>
        </Card>

        {/* Expenses List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredExpenses.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-black mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-black text-lg font-medium">No expenses found</p>
              <p className="text-black mt-2">
                Add your first expense to start tracking costs
              </p>
            </Card>
          ) : (
            filteredExpenses.map((expense) => (
              <Card
                key={expense.id}
                className="hover:shadow-lg transition-all"
                hover
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-black">
                        {expense.description}
                      </h3>
                      <Badge variant="default">{expense.type}</Badge>
                      <Badge
                        variant={getRecurrenceBadgeVariant(
                          expense.recurrenceCycle
                        )}
                      >
                        {expense.recurrenceCycle.replace('_', ' ')}
                      </Badge>
                      {!expense.isActive && (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-black">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(expense.date)}
                      </div>
                      {expense.recurrenceEndDate && (
                        <div className="flex items-center gap-2">
                          <span>Ends: {formatDate(expense.recurrenceEndDate)}</span>
                        </div>
                      )}
                    </div>
                    {expense.notes && (
                      <p className="text-sm text-black mt-2">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-black">
                        {formatCurrency(expense.cost)}
                      </p>
                      {expense.recurrenceCycle !== RecurrenceCycle.ONCE && (
                        <p className="text-xs text-black">
                          per {expense.recurrenceCycle}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
        size="large"
      >
        <ExpenseForm
          expense={editingExpense}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingExpense(null);
          }}
        />
      </Modal>
    </div>
  );
}
