'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { getAuthToken } from '@/lib/auth';

interface ChildUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildUser[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildUser | null>(null);
  const [newChild, setNewChild] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    checkUserRole();
    fetchChildren();
  }, []);

  const checkUserRole = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role);
        
        if (data.role === 'child') {
          alert('Only parent users can manage child accounts');
          router.push('/dashboard/pos');
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/children`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch child users');
      }

      const data = await response.json();
      setChildren(data);
    } catch (error) {
      console.error('Error fetching children:', error);
      alert('Failed to load child users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newChild.email || !newChild.password || !newChild.firstName || !newChild.lastName) {
      alert('All fields are required');
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/children`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newChild),
      });

      if (!response.ok) {
        throw new Error('Failed to create child user');
      }

      alert('Child user created successfully');
      setNewChild({ email: '', password: '', firstName: '', lastName: '' });
      setIsCreateModalOpen(false);
      fetchChildren();
    } catch (error) {
      console.error('Error creating child:', error);
      alert('Failed to create child user');
    }
  };

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChild) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/children/${selectedChild.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: selectedChild.firstName,
            lastName: selectedChild.lastName,
            isActive: selectedChild.isActive,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update child user');
      }

      alert('Child user updated successfully');
      setIsEditModalOpen(false);
      setSelectedChild(null);
      fetchChildren();
    } catch (error) {
      console.error('Error updating child:', error);
      alert('Failed to update child user');
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child user?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/children/${childId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete child user');
      }

      alert('Child user deleted successfully');
      fetchChildren();
    } catch (error) {
      console.error('Error deleting child:', error);
      alert('Failed to delete child user');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (userRole === 'child') {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black">User Management</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Add Child User
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Child Users</h2>
          {children.length === 0 ? (
            <p className="text-black">No child users yet. Create one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left py-3 px-4 text-black font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-black font-semibold">Created</th>
                    <th className="text-right py-3 px-4 text-black font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => (
                    <tr key={child.id} className="border-b border-black">
                      <td className="py-3 px-4 text-black">{`${child.firstName} ${child.lastName}`}</td>
                      <td className="py-3 px-4 text-black">{child.email}</td>
                      <td className="py-3 px-4 text-black">
                        <Badge variant={child.isActive ? 'success' : 'info'}>
                          {child.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-black">{new Date(child.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedChild(child);
                            setIsEditModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleDeleteChild(child.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Child User"
      >
        <form onSubmit={handleCreateChild} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={newChild.email}
              onChange={(e) => setNewChild({ ...newChild, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={newChild.password}
              onChange={(e) => setNewChild({ ...newChild, password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <Input
              value={newChild.firstName}
              onChange={(e) => setNewChild({ ...newChild, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <Input
              value={newChild.lastName}
              onChange={(e) => setNewChild({ ...newChild, lastName: e.target.value })}
              required
            />
          </div>
          <Button type="submit">Create User</Button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Child User"
      >
        {selectedChild && (
          <form onSubmit={handleUpdateChild} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input value={selectedChild.email} disabled className="bg-black/5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <Input
                value={selectedChild.firstName}
                onChange={(e) =>
                  setSelectedChild({ ...selectedChild, firstName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <Input
                value={selectedChild.lastName}
                onChange={(e) =>
                  setSelectedChild({ ...selectedChild, lastName: e.target.value })
                }
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="edit-isActive"
                type="checkbox"
                checked={selectedChild.isActive}
                onChange={(e) =>
                  setSelectedChild({ ...selectedChild, isActive: e.target.checked })
                }
              />
              <label htmlFor="edit-isActive" className="text-sm font-medium">Active</label>
            </div>
            <Button type="submit">Update User</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
