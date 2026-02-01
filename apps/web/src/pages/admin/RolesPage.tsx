/**
 * Roles Management Page
 * List, create, and manage IAM roles
 */

import { useState } from 'react';
import { Plus, Shield, Pencil, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, usePermissionCatalog } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission, PrimaryRole } from '@change/shared';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
}

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

export function RolesPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const primaryRole = context?.primaryRole;
  const isItAdmin = primaryRole === PrimaryRole.IT_ADMIN;
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });

  const { data, isLoading, refetch } = useRoles(tenantId, { page });
  const { data: permissionCatalog } = usePermissionCatalog();
  const createRole = useCreateRole(tenantId);
  const updateRole = useUpdateRole(tenantId, selectedRole?.id || '');
  const deleteRole = useDeleteRole(tenantId);

  const columns = [
    {
      key: 'name',
      header: 'Role',
      render: (role: Role) => (
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="font-medium text-gray-900">{role.name}</p>
            {role.description && (
              <p className="text-sm text-gray-500">{role.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (role: Role) => (
        role.isSystem ? (
          <Badge variant="info">System</Badge>
        ) : (
          <Badge variant="outline">Custom</Badge>
        )
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (role: Role) => (
        <span className="text-sm text-gray-500">
          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (role: Role) => (
        role.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (role: Role) => (
        <PermissionGate permission={IamPermission.IAM_ROLE_WRITE}>
          <div className="flex items-center gap-1">
            {/* IT_ADMIN can edit system roles, others can only view */}
            {role.isSystem && !isItAdmin ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openViewModal(role);
                }}
                title="View system role"
              >
                <Lock className="h-4 w-4 text-gray-400" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(role);
                  }}
                  title="Edit role"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {/* System roles cannot be deleted */}
                {!role.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(role);
                    }}
                    title="Delete role"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </>
            )}
          </div>
        </PermissionGate>
      ),
    },
  ];

  const openCreateModal = () => {
    setFormData({ name: '', description: '', permissions: [] });
    setSelectedRole(null);
    setModalMode('create');
  };

  const openEditModal = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
    });
    setSelectedRole(role);
    setModalMode('edit');
  };

  const openViewModal = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
    });
    setSelectedRole(role);
    setModalMode('view');
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setModalMode('delete');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedRole(null);
  };

  const handleCreateRole = async () => {
    if (!formData.name || formData.permissions.length === 0) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      await createRole.mutateAsync(formData);
      toast({ title: 'Role created successfully' });
      closeModal();
      refetch();
    } catch {
      toast({ title: 'Failed to create role', variant: 'destructive' });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || !formData.name || formData.permissions.length === 0) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      await updateRole.mutateAsync({
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      });
      toast({ title: 'Role updated successfully' });
      closeModal();
      refetch();
    } catch {
      toast({ title: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      await deleteRole.mutateAsync(selectedRole.id);
      toast({ title: 'Role deleted successfully' });
      closeModal();
      refetch();
    } catch {
      toast({ title: 'Failed to delete role', variant: 'destructive' });
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  // Group permissions by category
  const permissionsByCategory = permissionCatalog?.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, typeof permissionCatalog>
  );

  const isViewOnly = modalMode === 'view';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-500">Manage roles and their permissions</p>
        </div>
        <PermissionGate permission={IamPermission.IAM_ROLE_WRITE}>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </PermissionGate>
      </div>

      {/* Roles Table */}
      <DataTable
        columns={columns}
        data={(data?.data as Role[]) || []}
        keyField="id"
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No roles found"
      />

      {/* Create/Edit/View Role Modal */}
      {(modalMode === 'create' || modalMode === 'edit' || modalMode === 'view') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {modalMode === 'create' ? 'Create New Role' : modalMode === 'edit' ? 'Edit Role' : 'View System Role'}
            </h2>

            {isViewOnly && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <Lock className="h-4 w-4 inline mr-1" />
                  System roles cannot be modified. They are managed by the platform.
                </p>
              </div>
            )}

            {modalMode === 'edit' && selectedRole?.isSystem && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <Shield className="h-4 w-4 inline mr-1" />
                  You are editing a system role. Changes will affect all users with this role.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Billing Admin"
                  disabled={isViewOnly}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this role is for"
                  disabled={isViewOnly}
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <p className="text-sm text-gray-500 mb-2">
                  {isViewOnly ? 'Permissions assigned to this role' : 'Select the permissions for this role'}
                </p>

                <div className="space-y-4 max-h-64 overflow-y-auto border rounded-md p-4">
                  {permissionsByCategory &&
                    Object.entries(permissionsByCategory).map(([category, perms]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                        <div className="space-y-1">
                          {perms?.map((perm) => (
                            <label
                              key={perm.key}
                              className={`flex items-center space-x-2 p-1 rounded ${
                                isViewOnly ? '' : 'cursor-pointer hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.key)}
                                onChange={() => !isViewOnly && togglePermission(perm.key)}
                                disabled={isViewOnly}
                                className="rounded border-gray-300"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">{perm.key}</p>
                                <p className="text-xs text-gray-500">{perm.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  {formData.permissions.length} permission{formData.permissions.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={closeModal}>
                {isViewOnly ? 'Close' : 'Cancel'}
              </Button>
              {!isViewOnly && (
                <Button
                  onClick={modalMode === 'create' ? handleCreateRole : handleUpdateRole}
                  disabled={createRole.isPending || updateRole.isPending}
                >
                  {(createRole.isPending || updateRole.isPending)
                    ? 'Saving...'
                    : modalMode === 'create' ? 'Create Role' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Delete Role</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the role "{selectedRole.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRole}
                disabled={deleteRole.isPending}
              >
                {deleteRole.isPending ? 'Deleting...' : 'Delete Role'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
