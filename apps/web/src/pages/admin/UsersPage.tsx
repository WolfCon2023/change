/**
 * Users Management Page
 * List, create, and manage users
 */

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Lock, Unlock, Key, UserCog, Pencil, Copy, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useLockUser,
  useUnlockUser,
  useResetPassword,
  useDeleteUser,
  usePermanentDeleteUser,
} from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission, PrimaryRole, PrimaryRoleLabels } from '@change/shared';

interface User {
  id?: string;
  _id?: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  role: string;
  primaryRole?: string;
  isActive: boolean;
  mfaEnabled: boolean;
  mfaEnforced?: boolean;
  lockedAt?: string;
  lastLoginAt?: string;
  iamRoles?: Array<{ id?: string; _id?: string; name: string }>;
  groups?: Array<{ id?: string; _id?: string; name: string }>;
}

// Helper to get user ID (handles both id and _id)
function getUserId(user: User): string {
  return user.id || user._id || '';
}

// Get display label for primary role
function getRoleLabel(role?: string): string {
  if (!role) return 'Unknown';
  return PrimaryRoleLabels[role as keyof typeof PrimaryRoleLabels] || role.replace(/_/g, ' ');
}

// Get badge variant based on role
function getRoleBadgeVariant(role?: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (role) {
    case PrimaryRole.IT_ADMIN:
      return 'destructive';
    case PrimaryRole.MANAGER:
      return 'info';
    case PrimaryRole.ADVISOR:
      return 'warning';
    case PrimaryRole.CUSTOMER:
    default:
      return 'outline';
  }
}

type ModalMode = 'create' | 'edit' | 'actions' | 'delete' | 'permanent-delete' | null;

export function UsersPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    primaryRole: PrimaryRole.CUSTOMER as string,
    isActive: true,
    mfaEnforced: false,
  });

  const { data, isLoading, refetch } = useUsers(tenantId, { page, search: search || undefined });
  const createUser = useCreateUser(tenantId);
  const updateUser = useUpdateUser(tenantId);
  const lockUser = useLockUser(tenantId, selectedUser ? getUserId(selectedUser) : '');
  const unlockUser = useUnlockUser(tenantId, selectedUser ? getUserId(selectedUser) : '');
  const resetPassword = useResetPassword(tenantId, selectedUser ? getUserId(selectedUser) : '');
  const deleteUser = useDeleteUser(tenantId);
  const permanentDeleteUser = usePermanentDeleteUser(tenantId);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState('');
  const [permanentDeleteStep, setPermanentDeleteStep] = useState<1 | 2>(1);

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
      key: 'primaryRole',
      header: 'Role',
      render: (user: User) => (
        <Badge variant={getRoleBadgeVariant(user.primaryRole)}>
          {getRoleLabel(user.primaryRole)}
        </Badge>
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
                setModalMode('actions');
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  const openCreateModal = () => {
    setFormData({
      email: '',
      phoneNumber: '',
      firstName: '',
      lastName: '',
      primaryRole: PrimaryRole.CUSTOMER,
      isActive: true,
      mfaEnforced: false,
    });
    setSelectedUser(null);
    setTemporaryPassword(null);
    setModalMode('create');
  };

  const openEditModal = (user: User) => {
    setFormData({
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      firstName: user.firstName,
      lastName: user.lastName,
      primaryRole: user.primaryRole || PrimaryRole.CUSTOMER,
      isActive: user.isActive,
      mfaEnforced: user.mfaEnforced || false,
    });
    setSelectedUser(user);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setPermanentDeleteConfirm('');
    setPermanentDeleteStep(1);
    setSelectedUser(null);
    setTemporaryPassword(null);
    setCopiedPassword(false);
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      const result = await createUser.mutateAsync({
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        primaryRole: formData.primaryRole,
        mfaEnforced: formData.mfaEnforced,
      });
      toast({ title: 'User created successfully' });
      if (result.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
      } else {
        closeModal();
        refetch();
      }
    } catch (error) {
      toast({ title: 'Failed to create user', variant: 'destructive' });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.email || !formData.firstName || !formData.lastName) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      await updateUser.mutateAsync({
        userId: getUserId(selectedUser),
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        primaryRole: formData.primaryRole,
        isActive: formData.isActive,
        mfaEnforced: formData.mfaEnforced,
      });
      toast({ title: 'User updated successfully' });
      closeModal();
      refetch();
    } catch (error) {
      toast({ title: 'Failed to update user', variant: 'destructive' });
    }
  };

  const handleLock = async () => {
    if (!selectedUser) return;
    try {
      await lockUser.mutateAsync('Locked by administrator');
      toast({ title: 'User locked successfully' });
      closeModal();
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
      closeModal();
      refetch();
    } catch {
      toast({ title: 'Failed to unlock user', variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const result = await resetPassword.mutateAsync();
      setTemporaryPassword(result.temporaryPassword);
      toast({ title: 'Password reset successfully' });
    } catch {
      toast({ title: 'Failed to reset password', variant: 'destructive' });
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser.mutateAsync(getUserId(selectedUser));
      toast({ title: 'User deactivated successfully' });
      closeModal();
      refetch();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to deactivate user';
      toast({ title: errorMessage, variant: 'destructive' });
    }
  };

  const handlePermanentDeleteUser = async () => {
    if (!selectedUser || permanentDeleteConfirm !== 'DELETE') return;
    try {
      await permanentDeleteUser.mutateAsync(getUserId(selectedUser));
      toast({ title: 'User permanently deleted' });
      setPermanentDeleteConfirm('');
      closeModal();
      refetch();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to permanently delete user';
      toast({ title: errorMessage, variant: 'destructive' });
    }
  };

  const copyPassword = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const roleOptions = Object.entries(PrimaryRoleLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Manage user accounts and access</p>
        </div>
        <PermissionGate permission={IamPermission.IAM_USER_WRITE}>
          <Button onClick={openCreateModal} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="flex items-center">
        <div className="relative flex-1 sm:max-w-sm">
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

      {/* Create/Edit User Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {modalMode === 'create' ? 'Create New User' : 'Edit User'}
            </h2>

            {temporaryPassword ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    User created successfully!
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    Save this temporary password. It will not be shown again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                      {temporaryPassword}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyPassword}>
                      {copiedPassword ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => { closeModal(); refetch(); }}>Done</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="primaryRole">Role</Label>
                  <select
                    id="primaryRole"
                    value={formData.primaryRole}
                    onChange={(e) => setFormData((prev) => ({ ...prev, primaryRole: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {modalMode === 'edit' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isActive">Active Status</Label>
                      <p className="text-sm text-gray-500">User can access the system</p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mfaEnforced">Enforce MFA</Label>
                    <p className="text-sm text-gray-500">Require multi-factor authentication</p>
                  </div>
                  <Switch
                    id="mfaEnforced"
                    checked={formData.mfaEnforced}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, mfaEnforced: checked }))}
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <Button variant="ghost" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    onClick={modalMode === 'create' ? handleCreateUser : handleUpdateUser}
                    disabled={createUser.isPending || updateUser.isPending}
                  >
                    {(createUser.isPending || updateUser.isPending)
                      ? 'Saving...'
                      : modalMode === 'create' ? 'Create User' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Actions Modal */}
      {modalMode === 'actions' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">
              {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{selectedUser.email}</p>

            {temporaryPassword ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    Password reset successfully!
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    Save this temporary password. It will not be shown again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                      {temporaryPassword}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyPassword}>
                      {copiedPassword ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={closeModal}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => openEditModal(selectedUser)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>

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
                        // TODO: Navigate to user detail for role assignment
                        toast({ title: 'Role management coming soon' });
                      }}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Manage Roles
                    </Button>
                  </PermissionGate>

                  <PermissionGate permission={IamPermission.IAM_USER_DELETE}>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      onClick={() => setModalMode('delete')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deactivate user
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { setPermanentDeleteConfirm(''); setPermanentDeleteStep(1); setModalMode('permanent-delete'); }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Permanently delete user
                    </Button>
                  </PermissionGate>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="ghost" onClick={closeModal}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {modalMode === 'delete' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2 text-amber-600">Deactivate user</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to deactivate{' '}
              <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This will set the account to inactive. You can reactivate the user later by editing them and turning Active back on.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalMode('actions')}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleDeactivateUser}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Deactivating...' : 'Deactivate user'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permanently delete Confirmation Modal (two-step) */}
      {modalMode === 'permanent-delete' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Permanently delete user</h2>
            <p className="text-gray-600 mb-2">
              This will <strong>permanently remove</strong>{' '}
              <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email}) from the system.
            </p>
            <p className="text-sm text-red-600 mb-4">
              This action cannot be undone. All user data will be deleted. Use deactivate instead if you may need to restore access.
            </p>

            {permanentDeleteStep === 1 ? (
              <>
                <Label htmlFor="permanent-delete-confirm" className="text-sm text-gray-700">
                  Type <strong>DELETE</strong> to continue:
                </Label>
                <Input
                  id="permanent-delete-confirm"
                  value={permanentDeleteConfirm}
                  onChange={(e) => setPermanentDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2 mb-4 font-mono"
                  autoComplete="off"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setModalMode('actions'); setPermanentDeleteConfirm(''); setPermanentDeleteStep(1); }}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPermanentDeleteStep(2)}
                    disabled={permanentDeleteConfirm !== 'DELETE'}
                  >
                    Continue to final confirmation
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 rounded-md border-2 border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">
                    Final confirmation required
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Pressing the button below will permanently delete this user. This cannot be undone. Are you sure?
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPermanentDeleteStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handlePermanentDeleteUser}
                    disabled={permanentDeleteUser.isPending}
                  >
                    {permanentDeleteUser.isPending ? 'Deleting...' : 'Permanently delete'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
