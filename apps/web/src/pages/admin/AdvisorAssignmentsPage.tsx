/**
 * Advisor Assignments Page
 * Manage advisor-to-tenant assignments (IT Admin only)
 */

import { useState } from 'react';
import { Plus, UserCheck, Building2, Trash2, Pencil, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/admin/DataTable';
import {
  useAdvisorAssignments,
  useAdvisors,
  useTenantsList,
  useCreateAdvisorAssignment,
  useUpdateAdvisorAssignment,
  useDeleteAdvisorAssignment,
  type AdvisorAssignment,
} from '@/lib/admin-api';
import { useToast } from '@/components/ui/use-toast';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export function AdvisorAssignmentsPage() {
  const { toast } = useToast();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AdvisorAssignment | null>(null);
  const [formData, setFormData] = useState({
    advisorId: '',
    tenantId: '',
    isPrimary: false,
    notes: '',
  });

  const { data: assignments, isLoading, refetch } = useAdvisorAssignments({ isActive: true });
  const { data: advisors } = useAdvisors();
  const { data: tenants } = useTenantsList();

  const createAssignment = useCreateAdvisorAssignment();
  const updateAssignment = useUpdateAdvisorAssignment();
  const deleteAssignment = useDeleteAdvisorAssignment();

  const columns = [
    {
      key: 'advisor',
      header: 'Advisor',
      render: (assignment: AdvisorAssignment) => (
        <div className="flex items-center">
          <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
          <div>
            <p className="font-medium">{assignment.advisor?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-500">{assignment.advisor?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: 'Tenant',
      render: (assignment: AdvisorAssignment) => (
        <div className="flex items-center">
          <Building2 className="h-4 w-4 mr-2 text-green-500" />
          <div>
            <p className="font-medium">{assignment.tenant?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-500">{assignment.tenant?.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'isPrimary',
      header: 'Primary',
      render: (assignment: AdvisorAssignment) =>
        assignment.isPrimary ? (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Star className="h-3 w-3 mr-1" />
            Primary
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">No</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (assignment: AdvisorAssignment) => (
        <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
          {assignment.status}
        </Badge>
      ),
    },
    {
      key: 'assignedAt',
      header: 'Assigned',
      render: (assignment: AdvisorAssignment) => (
        <span className="text-sm text-gray-600">
          {new Date(assignment.assignedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (assignment: AdvisorAssignment) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTogglePrimary(assignment)}
            title={assignment.isPrimary ? 'Remove primary' : 'Set as primary'}
          >
            {assignment.isPrimary ? (
              <StarOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Star className="h-4 w-4 text-yellow-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(assignment)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteModal(assignment)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const openCreateModal = () => {
    setFormData({ advisorId: '', tenantId: '', isPrimary: false, notes: '' });
    setSelectedAssignment(null);
    setModalMode('create');
  };

  const openEditModal = (assignment: AdvisorAssignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      advisorId: assignment.advisorId,
      tenantId: assignment.tenantId,
      isPrimary: assignment.isPrimary,
      notes: assignment.notes || '',
    });
    setModalMode('edit');
  };

  const openDeleteModal = (assignment: AdvisorAssignment) => {
    setSelectedAssignment(assignment);
    setModalMode('delete');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAssignment(null);
    setFormData({ advisorId: '', tenantId: '', isPrimary: false, notes: '' });
  };

  const handleCreate = async () => {
    if (!formData.advisorId || !formData.tenantId) {
      toast({ title: 'Please select an advisor and tenant', variant: 'destructive' });
      return;
    }

    try {
      await createAssignment.mutateAsync({
        advisorId: formData.advisorId,
        tenantId: formData.tenantId,
        isPrimary: formData.isPrimary,
        notes: formData.notes || undefined,
      });
      toast({ title: 'Advisor assigned successfully' });
      closeModal();
      refetch();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to create assignment';
      toast({ title: errorMessage, variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!selectedAssignment) return;

    try {
      await updateAssignment.mutateAsync({
        assignmentId: selectedAssignment.id,
        isPrimary: formData.isPrimary,
        notes: formData.notes || undefined,
      });
      toast({ title: 'Assignment updated successfully' });
      closeModal();
      refetch();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to update assignment';
      toast({ title: errorMessage, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    try {
      await deleteAssignment.mutateAsync(selectedAssignment.id);
      toast({ title: 'Assignment removed successfully' });
      closeModal();
      refetch();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to remove assignment';
      toast({ title: errorMessage, variant: 'destructive' });
    }
  };

  const handleTogglePrimary = async (assignment: AdvisorAssignment) => {
    try {
      await updateAssignment.mutateAsync({
        assignmentId: assignment.id,
        isPrimary: !assignment.isPrimary,
      });
      toast({
        title: assignment.isPrimary
          ? 'Removed primary status'
          : 'Set as primary advisor',
      });
      refetch();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || 'Failed to update primary status';
      toast({ title: errorMessage, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advisor Assignments</h1>
          <p className="text-gray-500">Manage which advisors can access which tenants</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Advisor
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={assignments || []}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No advisor assignments found"
      />

      {/* Create/Edit Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {modalMode === 'create' ? 'Assign Advisor to Tenant' : 'Edit Assignment'}
            </h2>

            <div className="space-y-4">
              {modalMode === 'create' && (
                <>
                  <div>
                    <Label>Advisor</Label>
                    <Select
                      value={formData.advisorId}
                      onValueChange={(value: string) => setFormData({ ...formData, advisorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an advisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {advisors?.map((advisor) => (
                          <SelectItem key={advisor.id} value={advisor.id}>
                            {advisor.name} ({advisor.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tenant</Label>
                    <Select
                      value={formData.tenantId}
                      onValueChange={(value: string) => setFormData({ ...formData, tenantId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants?.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {modalMode === 'edit' && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p>
                    <strong>Advisor:</strong> {selectedAssignment?.advisor?.name}
                  </p>
                  <p>
                    <strong>Tenant:</strong> {selectedAssignment?.tenant?.name}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPrimary" className="cursor-pointer">
                  Set as primary advisor for this tenant
                </Label>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about this assignment"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={modalMode === 'create' ? handleCreate : handleUpdate}>
                {modalMode === 'create' ? 'Assign' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Remove Assignment</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove{' '}
              <strong>{selectedAssignment.advisor?.name}</strong> from{' '}
              <strong>{selectedAssignment.tenant?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              The advisor will no longer be able to access this tenant.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Remove Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
