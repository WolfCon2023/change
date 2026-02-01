/**
 * Groups Management Page
 * List, create, and manage user groups
 */

import { useState } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useGroups, useCreateGroup } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  roles: Array<{ id: string; name: string }>;
  isActive: boolean;
}

export function GroupsPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  const { data, isLoading, refetch } = useGroups(tenantId, { page, search: search || undefined });
  const createGroup = useCreateGroup(tenantId);

  const columns = [
    {
      key: 'name',
      header: 'Group',
      render: (group: Group) => (
        <div className="flex items-center">
          <Users className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="font-medium text-gray-900">{group.name}</p>
            {group.description && (
              <p className="text-sm text-gray-500">{group.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'members',
      header: 'Members',
      render: (group: Group) => (
        <span className="text-sm text-gray-500">
          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (group: Group) => (
        <div className="flex flex-wrap gap-1">
          {group.roles.slice(0, 3).map((role) => (
            <Badge key={role.id} variant="outline" className="text-xs">
              {role.name}
            </Badge>
          ))}
          {group.roles.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{group.roles.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (group: Group) => (
        group.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )
      ),
    },
  ];

  const handleCreateGroup = async () => {
    if (!newGroup.name) {
      toast({ title: 'Please enter a group name', variant: 'destructive' });
      return;
    }

    try {
      await createGroup.mutateAsync(newGroup);
      toast({ title: 'Group created successfully' });
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '' });
      refetch();
    } catch {
      toast({ title: 'Failed to create group', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-500">Organize users and assign roles to groups</p>
        </div>
        <PermissionGate permission={IamPermission.IAM_GROUP_WRITE}>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Groups Table */}
      <DataTable
        columns={columns}
        data={(data?.data as Group[]) || []}
        keyField="id"
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No groups found"
      />

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Group</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Engineering Team"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this group"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={createGroup.isPending}>
                {createGroup.isPending ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
