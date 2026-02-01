/**
 * Users Management Page
 * List, create, and manage users
 */

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Lock, Unlock, Key, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useUsers, useLockUser, useUnlockUser, useResetPassword } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  mfaEnabled: boolean;
  lockedAt?: string;
  lastLoginAt?: string;
  iamRoles?: Array<{ name: string }>;
  groups?: Array<{ name: string }>;
}

export function UsersPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = useUsers(tenantId, { page, search: search || undefined });
  const lockUser = useLockUser(tenantId, selectedUser?.id || '');
  const unlockUser = useUnlockUser(tenantId, selectedUser?.id || '');
  const resetPassword = useResetPassword(tenantId, selectedUser?.id || '');

  const columns = [
    {
      key: 'email',
      header: 'User',
      render: (user: User) => (
        <div>
          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <Badge variant="outline">{user.role.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => {
        if (user.lockedAt) {
          return <Badge variant="destructive">Locked</Badge>;
        }
        return user.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        );
      },
    },
    {
      key: 'mfa',
      header: 'MFA',
      render: (user: User) => (
        user.mfaEnabled ? (
          <Badge variant="success">Enabled</Badge>
        ) : (
          <Badge variant="warning">Disabled</Badge>
        )
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (user: User) => (
        <span className="text-sm text-gray-500">
          {user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleDateString()
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (user: User) => (
        <PermissionGate permission={IamPermission.IAM_USER_WRITE}>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(user);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  const handleLock = async () => {
    if (!selectedUser) return;
    try {
      await lockUser.mutateAsync('Locked by administrator');
      toast({ title: 'User locked successfully' });
      setSelectedUser(null);
      refetch();
    } catch {
      toast({ title: 'Failed to lock user', variant: 'destructive' });
    }
  };

  const handleUnlock = async () => {
    if (!selectedUser) return;
    try {
      await unlockUser.mutateAsync();
      toast({ title: 'User unlocked successfully' });
      setSelectedUser(null);
      refetch();
    } catch {
      toast({ title: 'Failed to unlock user', variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const result = await resetPassword.mutateAsync();
      toast({
        title: 'Password reset successfully',
        description: `Temporary password: ${result.temporaryPassword}`,
      });
      setSelectedUser(null);
    } catch {
      toast({ title: 'Failed to reset password', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage user accounts and access</p>
        </div>
        <PermissionGate permission={IamPermission.IAM_USER_WRITE}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={(data?.data as User[]) || []}
        keyField="id"
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      {/* User Actions Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{selectedUser.email}</p>

            <div className="space-y-2">
              {selectedUser.lockedAt ? (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleUnlock}
                  disabled={unlockUser.isPending}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock User
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLock}
                  disabled={lockUser.isPending}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Lock User
                </Button>
              )}

              <PermissionGate permission={IamPermission.IAM_USER_RESET_PASSWORD}>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleResetPassword}
                  disabled={resetPassword.isPending}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </PermissionGate>

              <PermissionGate permission={IamPermission.IAM_ROLE_ASSIGN}>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Navigate to user detail for role assignment
                  }}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Manage Roles
                </Button>
              </PermissionGate>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
