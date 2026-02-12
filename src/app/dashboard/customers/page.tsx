'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customersApi, Customer, CreateCustomerDto } from '@/lib/api/customers';
import { getAuthToken } from '@/lib/auth';
import theme from '@/styles/theme';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CreateCustomerDto>({
    name: '',
    description: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }
      const data = await customersApi.getAll(token);
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    setSaving(true);
    try {
      const token = getAuthToken();
      if (!token) return;
      await customersApi.create({
        name: newCustomer.name.trim(),
        description: newCustomer.description?.trim() || undefined,
        phone: newCustomer.phone?.trim() || undefined,
        email: newCustomer.email?.trim() || undefined,
      }, token);
      setShowAddModal(false);
      setNewCustomer({ name: '', description: '', phone: '', email: '' });
      loadCustomers();
    } catch (error) {
      console.error('Failed to add customer:', error);
      alert('Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const token = getAuthToken();
      if (!token) return;
      await customersApi.delete(id, token);
      loadCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl animate-pulse" style={{ color: '#000000' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: theme.colors.background.secondary }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: '#000000' }}>
              Customers
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#000000' }}>
              {customers.length} total customers
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl hover:opacity-90 transition-opacity font-semibold"
            style={{ background: theme.colors.primary.black, color: 'white' }}
          >
            + Add Customer
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{
              background: theme.colors.background.card,
              border: `1px solid ${theme.colors.border}`,
              color: '#000000',
            }}
          />
        </div>

        {/* Customer List */}
        {filtered.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: theme.colors.background.card, border: `1px solid ${theme.colors.border}` }}
          >
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>
              {searchQuery ? 'No customers found' : 'No customers yet'}
            </p>
            <p className="text-sm" style={{ color: '#000000' }}>
              {searchQuery ? 'Try a different search term' : 'Add your first customer to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(customer => (
              <div
                key={customer.id}
                className="rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                style={{
                  background: theme.colors.background.card,
                  border: `1px solid ${theme.colors.border}`,
                }}
                onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ background: theme.colors.accent.blue + '20', color: theme.colors.accent.blue }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: '#000000' }}>
                      {customer.name}
                    </div>
                    <div className="flex gap-4 text-sm" style={{ color: '#666' }}>
                      {customer.phone && <span>📱 {customer.phone}</span>}
                      {customer.email && <span>📧 {customer.email}</span>}
                    </div>
                    {customer.description && (
                      <p className="text-sm mt-1" style={{ color: '#888' }}>
                        {customer.description.length > 80 ? customer.description.slice(0, 80) + '...' : customer.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    style={{ color: theme.colors.accent.red }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                  <span style={{ color: '#ccc' }}>›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-8 max-w-md w-full"
            style={{ background: theme.colors.background.card }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#000000' }}>
              Add New Customer
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Phone</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Email address"
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>Description</label>
                <textarea
                  value={newCustomer.description}
                  onChange={(e) => setNewCustomer({ ...newCustomer, description: e.target.value })}
                  placeholder="Notes about this customer..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg resize-none"
                  style={{
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    color: '#000000',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCustomer({ name: '', description: '', phone: '', email: '' });
                }}
                className="flex-1 px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                style={{
                  background: theme.colors.background.secondary,
                  border: `1px solid ${theme.colors.border}`,
                  color: '#000000',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={!newCustomer.name.trim() || saving}
                className="flex-1 px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: theme.colors.primary.black, color: 'white' }}
              >
                {saving ? 'Adding...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
