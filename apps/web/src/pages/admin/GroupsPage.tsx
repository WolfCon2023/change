/**
 * Groups Management Page
 * List, create, and manage user groups
 */

import { useState } from 'react';
import { Plus, Users, Search, Pencil, Trash2, UserPlus, UserMinus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import {
  useGroups,
  useGroup,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useManageGroupMembers,
  useManageGroupRoles,
  useUsers,
  useRoles,
} from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  members?: Array<{ id: string; email: string; firstName: string; lastName: string }>;
  roles: Array<{ id: string; name: string }>;
  isActive: boolean;
  isPlatformGroup?: boolean;
}

type ModalMode = 'create' | 'edit' | 'delete' | 'members' | 'roles' | null;

export function GroupsPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [memberSearch, setMemberSearch] = useState('');

  const { data, isLoading, refetch } = useGroups(tenantId, { page, search: search || undefined });
  const { data: groupDetail, refetch: refetchGroupDetail } = useGroup(tenantId, selectedGroup?.id || '');
  const { data: usersData } = useUsers(tenantId, { limit: 100 });
  const { data: rolesData } = useRoles(tenantId, { limit: 100 });
  const createGroup = useCreateGroup(tenantId);
  const updateGroup = useUpdateGroup(tenantId, selectedGroup?.id || '');
  const deleteGroup = useDeleteGroup(tenantId);
  const manageMembers = useManageGroupMembers(tenantId, selectedGroup?.id || '');
  const manageRoles = useManageGroupRoles(tenantId, selectedGroup?.id || '');

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
      key: 'type',
      header: 'Type',
      render: (group: Group) => (
        group.isPlatformGroup ? (
          <Badge variant="info">Platform</Badge>
        ) : (
          <Badge variant="outline">Tenant</Badge>
        )
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
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (group: Group) => (
        <PermissionGate permission={IamPermission.IAM_GROUP_WRITE}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openMembersModal(group);
              }}
              title="Manage members"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openRolesModal(group);
              }}
              title="Manage roles"
            >
              <Shield className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(group);
              }}
              title="Edit group"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(group);
              }}
              title="Delete group"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </PermissionGate>
      ),
    },
  ];

  const openCreateModal = () => {
    setFormData({ name: '', description: '', isActive: true });
    setSelectedGroup(null);
    setModalMode('create');
  };

  const openEditModal = (group: Group) => {
    setFormData({
      name: group.name,
      description: group.description || '',
      isActive: group.isActive,
    });
    setSelectedGroup(group);
    setModalMode('edit');
  };

  const openDeleteModal = (group: Group) => {
    setSelectedGroup(group);
    setModalMode('delete');
  };

  const openMembersModal = (group: Group) => {
    setSelectedGroup(group);
    setMemberSearch('');
    setModalMode('members');
  };

  const openRolesModal = (group: Group) => {
    setSelectedGroup(group);
    setModalMode('roles');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedGroup(null);
    setMemberSearch('');
  };

  const handleCreateGroup = async () => {
    if (!formData.name) {
      toast({ title: 'Please enter a group name', variant: 'destructive' });
      return;
    }

    try {
      await createGroup.mutateAsync(formData);
      toast({ title: 'Group created successfully' });
      closeModal();
      refetch();
    } catch {
      toast({ title: 'Failed to create group', variant: 'destructive' });
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !formData.name) {
      toast({ title: 'Please enter a group name', variant: 'destructive' });
      return;
    }

    try {
      await updateGroup.mutateAsync({
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
      });
      toast({ title: 'Group updated successfully' });
      closeModal();
      refetch();
    } catch {
      toast({ title: 'Failed to update group', variant: 'destructive' });
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    try {
      await deleteGroup.mutateAsync(selectedGroup.id);
      toast({ title: 'Group deleted successfully' });
      closeModal();
      refetch();
    } catch {
      toast({ title: 'Failed to delete group', variant: 'destructive' });
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await manageMembers.mutateAsync({ action: 'add', userIds: [userId] });
      toast({ title: 'Member added successfully' });
      refetchGroupDetail();
      refetch();
    } catch {
      toast({ title: 'Failed to add member', variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await manageMembers.mutateAsync({ action: 'remove', userIds: [userId] });
      toast({ title: 'Member removed successfully' });
      refetchGroupDetail();
      refetch();
    } catch {
      toast({ title: 'Failed to remove member', variant: 'destructive' });
    }
  };

  const handleAddRole = async (roleId: string) => {
    try {
      await manageRoles.mutateAsync({ action: 'add', roleIds: [roleId] });
      toast({ title: 'Role added successfully' });
      refetchGroupDetail();
      refetch();
    } catch {
      toast({ title: 'Failed to add role', variant: 'destructive' });
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      await manageRoles.mutateAsync({ action: 'remove', roleIds: [roleId] });
      toast({ title: 'Role removed successfully' });
      refetchGroupDetail();
      refetch();
    } catch {
      toast({ title: 'Failed to remove role', variant: 'destructive' });
    }
  };

  // Get current group members (from detail query)
  const currentMembers = (groupDetail as Group)?.members || [];
  const currentMemberIds = currentMembers.map((m) => m.id);
  const currentRoles = (groupDetail as Group)?.roles || [];
  const currentRoleIds = currentRoles.map((r) => r.id);

  // Filter available users for adding (excluding current members)
  const availableUsers = ((usersData?.data || []) as Array<{ id: string; email: string; firstName: string; lastName: string }>).filter(
    (user) => !currentMemberIds.includes(user.id)
  );

  // Filter users by search
  const filteredAvailableUsers = memberSearch
    ? availableUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : availableUsers;

  // Filter available roles for adding (excluding current roles)
  const availableRoles = ((rolesData?.data || []) as Array<{ id: string; name: string; isActive: boolean }>).filter(
    (role) => !currentRoleIds.includes(role.id) && role.isActive
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-500">Organize users and assign roles to groups</p>
        </div>
        <PermissionGate permission={IamPermission.IAM_GROUP_WRITE}>
          <Button onClick={openCreateModal}>
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

      {/* Create/Edit Group Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {modalMode === 'create' ? 'Create New Group' : 'Edit Group'}
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Engineering Team"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this group"
                />
              </div>

              {modalMode === 'edit' && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Active Status</Label>
                    <p className="text-sm text-gray-500">Group is active and usable</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={modalMode === 'create' ? handleCreateGroup : handleUpdateGroup}
                disabled={createGroup.isPending || updateGroup.isPending}
              >
                {(createGroup.isPending || updateGroup.isPending)
                  ? 'Saving...'
                  : modalMode === 'create' ? 'Create Group' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Delete Group</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the group "{selectedGroup.name}"? Members will be removed from this group.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteGroup}
                disabled={deleteGroup.isPending}
              >
                {deleteGroup.isPending ? 'Deleting...' : 'Delete Group'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {modalMode === 'members' && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              Manage Members - {selectedGroup.name}
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Current Members */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-2">Current Members ({currentMembers.length})</h3>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  {currentMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 text-center">No members</p>
                  ) : (
                    <div className="divide-y">
                      {currentMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                          <div>
                            <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={manageMembers.isPending}
                          >
                            <UserMinus className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Members */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-2">Add Members</h3>
                <div className="mb-2">
                  <Input
                    placeholder="Search users..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="border rounded-md max-h-56 overflow-y-auto">
                  {filteredAvailableUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 text-center">
                      {memberSearch ? 'No matching users' : 'All users are already members'}
                    </p>
                  ) : (
                    <div className="divide-y">
                      {filteredAvailableUsers.slice(0, 20).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                          <div>
                            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddMember(user.id)}
                            disabled={manageMembers.isPending}
                          >
                            <UserPlus className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={closeModal}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Roles Modal */}
      {modalMode === 'roles' && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              Manage Roles - {selectedGroup.name}
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Current Roles */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-2">Assigned Roles ({currentRoles.length})</h3>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  {currentRoles.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 text-center">No roles assigned</p>
                  ) : (
                    <div className="divide-y">
                      {currentRoles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-sm font-medium">{role.name}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(role.id)}
                            disabled={manageRoles.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Roles */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-2">Available Roles</h3>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  {availableRoles.length === 0 ? (
                    <p className="text-sm text-gray-500 p-4 text-center">All roles are already assigned</p>
                  ) : (
                    <div className="divide-y">
                      {availableRoles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-gray-400 mr-2" />
                            <p className="text-sm font-medium">{role.name}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddRole(role.id)}
                            disabled={manageRoles.isPending}
                          >
                            <Plus className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={closeModal}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
