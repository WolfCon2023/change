/**
 * Access Requests Page
 * View and manage access requests
 */

import { useState } from 'react';
import { Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useAccessRequests, useApproveAccessRequest, useRejectAccessRequest } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface AccessRequest {
  id: string;
  requestorEmail: string;
  requestedRoleIds: Array<{ id: string; name: string }>;
  reason: string;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { variant: 'default' | 'success' | 'destructive' | 'warning'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  expired: { variant: 'default', label: 'Expired' },
};

export function AccessRequestsPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading, refetch } = useAccessRequests(tenantId, {
    page,
    status: statusFilter || undefined,
  });
  const approveRequest = useApproveAccessRequest(tenantId);
  const rejectRequest = useRejectAccessRequest(tenantId);

  const columns = [
    {
      key: 'requestor',
      header: 'Requestor',
      render: (req: AccessRequest) => (
        <div className="flex items-center">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900">{req.requestorEmail}</span>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Requested Roles',
      render: (req: AccessRequest) => (
        <div className="flex flex-wrap gap-1">
          {req.requestedRoleIds.map((role) => (
            <Badge key={role.id} variant="outline" className="text-xs">
              {role.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (req: AccessRequest) => (
        <p className="text-sm text-gray-500 truncate max-w-xs" title={req.reason}>
          {req.reason}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (req: AccessRequest) => {
        const config = statusConfig[req.status] || { variant: 'default' as const, label: req.status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'date',
      header: 'Requested',
      render: (req: AccessRequest) => (
        <span className="text-sm text-gray-500">
          {new Date(req.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (req: AccessRequest) => (
        req.status === 'pending' && (
          <PermissionGate permission={IamPermission.IAM_ACCESS_REQUEST_APPROVE}>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(req);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(req.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </PermissionGate>
        )
      ),
    },
  ];

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await approveRequest.mutateAsync({ requestId: selectedRequest.id, notes });
      toast({ title: 'Access request approved' });
      setSelectedRequest(null);
      setNotes('');
      refetch();
    } catch {
      toast({ title: 'Failed to approve request', variant: 'destructive' });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest.mutateAsync({ requestId });
      toast({ title: 'Access request rejected' });
      refetch();
    } catch {
      toast({ title: 'Failed to reject request', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
        <p className="text-gray-500">Review and approve access requests</p>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-2">
        {['pending', 'approved', 'rejected', ''].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status || 'All'}
          </Button>
        ))}
      </div>

      {/* Requests Table */}
      <DataTable
        columns={columns}
        data={(data?.data as AccessRequest[]) || []}
        keyField="id"
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No access requests found"
      />

      {/* Approve Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Approve Access Request</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Requestor</p>
                <p className="font-medium">{selectedRequest.requestorEmail}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Requested Roles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedRequest.requestedRoleIds.map((role) => (
                    <Badge key={role.id} variant="outline">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Reason</p>
                <p className="text-sm">{selectedRequest.reason}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Notes (optional)</label>
                <textarea
                  className="w-full mt-1 border rounded-md p-2 text-sm"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this approval"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={approveRequest.isPending}>
                {approveRequest.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
