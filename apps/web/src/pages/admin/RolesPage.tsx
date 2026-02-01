/**
 * Roles Management Page
 * List, create, and manage IAM roles
 */

import { useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useRoles, useCreateRole, usePermissionCatalog } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
}

export function RolesPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });

  const { data, isLoading, refetch } = useRoles(tenantId, { page });
  const { data: permissionCatalog } = usePermissionCatalog();
  const createRole = useCreateRole(tenantId);

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
  ];

  const handleCreateRole = async () => {
    if (!newRole.name || newRole.permissions.length === 0) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      await createRole.mutateAsync(newRole);
      toast({ title: 'Role created successfully' });
      setShowCreateModal(false);
      setNewRole({ name: '', description: '', permissions: [] });
      refetch();
    } catch {
      toast({ title: 'Failed to create role', variant: 'destructive' });
    }
  };

  const togglePermission = (permission: string) => {
    setNewRole((prev) => ({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-500">Manage roles and their permissions</p>
        </div>
        <PermissionGate permission={IamPermission.IAM_ROLE_WRITE}>
          <Button onClick={() => setShowCreateModal(true)}>
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

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create New Role</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Billing Admin"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this role is for"
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Select the permissions for this role
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
                              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={newRole.permissions.includes(perm.key)}
                                onChange={() => togglePermission(perm.key)}
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
                  {newRole.permissions.length} permission{newRole.permissions.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole} disabled={createRole.isPending}>
                {createRole.isPending ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
