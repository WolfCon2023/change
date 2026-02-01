/**
 * Access Reviews Page
 * Create and manage periodic access reviews
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import {
  useAccessReviews,
  useCreateAccessReview,
  useAccessReviewItems,
  useAccessReviewDecision,
  useCloseAccessReview,
} from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface AccessReview {
  id: string;
  name: string;
  status: string;
  dueAt: string;
  itemCount: number;
  completedItemCount: number;
  completionPercentage: number;
  createdAt: string;
}

interface ReviewItem {
  id: string;
  userEmail: string;
  userName: string;
  currentRoles: Array<{ id: string; name: string }>;
  currentGroups: Array<{ id: string; name: string }>;
  decision: string;
  reviewerEmail?: string;
  reviewedAt?: string;
  notes?: string;
}

const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'info'; label: string }> = {
  draft: { variant: 'default', label: 'Draft' },
  open: { variant: 'info', label: 'Open' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  closed: { variant: 'success', label: 'Closed' },
};

const decisionConfig: Record<string, { variant: 'default' | 'success' | 'destructive' | 'warning'; label: string }> = {
  pending: { variant: 'default', label: 'Pending' },
  keep: { variant: 'success', label: 'Keep' },
  remove: { variant: 'destructive', label: 'Remove' },
  change: { variant: 'warning', label: 'Change' },
};

export function AccessReviewsPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', description: '', dueAt: '' });
  const [selectedReview, setSelectedReview] = useState<AccessReview | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);

  const { data, isLoading, refetch } = useAccessReviews(tenantId, { page });
  const { data: itemsData, isLoading: itemsLoading } = useAccessReviewItems(
    tenantId,
    selectedReview?.id || '',
    { page: 1 }
  );
  const createReview = useCreateAccessReview(tenantId);
  const makeDecision = useAccessReviewDecision(tenantId, selectedReview?.id || '');
  const closeReview = useCloseAccessReview(tenantId);

  const reviewColumns = [
    {
      key: 'name',
      header: 'Review',
      render: (review: AccessReview) => (
        <div>
          <p className="font-medium text-gray-900">{review.name}</p>
          <p className="text-xs text-gray-500">
            Created {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (review: AccessReview) => {
        const config = statusConfig[review.status] || { variant: 'default' as const, label: review.status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (review: AccessReview) => (
        <div className="flex items-center space-x-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${review.completionPercentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-500">
            {review.completedItemCount}/{review.itemCount}
          </span>
        </div>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      render: (review: AccessReview) => (
        <span className="text-sm text-gray-500">
          {new Date(review.dueAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (review: AccessReview) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedReview(review)}>
          View
        </Button>
      ),
    },
  ];

  const handleCreateReview = async () => {
    if (!newReview.name || !newReview.dueAt) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      await createReview.mutateAsync({
        name: newReview.name,
        description: newReview.description,
        dueAt: new Date(newReview.dueAt).toISOString(),
      });
      toast({ title: 'Access review created successfully' });
      setShowCreateModal(false);
      setNewReview({ name: '', description: '', dueAt: '' });
      refetch();
    } catch {
      toast({ title: 'Failed to create access review', variant: 'destructive' });
    }
  };

  const handleDecision = async (decision: string) => {
    if (!selectedItem || !selectedReview) return;

    try {
      await makeDecision.mutateAsync({
        itemId: selectedItem.id,
        decision,
      });
      toast({ title: 'Decision recorded' });
      setSelectedItem(null);
    } catch {
      toast({ title: 'Failed to record decision', variant: 'destructive' });
    }
  };

  const handleCloseReview = async () => {
    if (!selectedReview) return;

    try {
      await closeReview.mutateAsync(selectedReview.id);
      toast({ title: 'Access review closed' });
      setSelectedReview(null);
      refetch();
    } catch {
      toast({ title: 'Failed to close review', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Reviews</h1>
          <p className="text-gray-500">Periodic review of user access for compliance</p>
        </div>
        <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_WRITE}>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Review
          </Button>
        </PermissionGate>
      </div>

      {/* Reviews Table */}
      <DataTable
        columns={reviewColumns}
        data={(data?.data as AccessReview[]) || []}
        keyField="id"
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No access reviews found"
      />

      {/* Create Review Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Access Review</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Review Name</Label>
                <Input
                  id="name"
                  value={newReview.name}
                  onChange={(e) => setNewReview((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Q1 2026 Access Review"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newReview.description}
                  onChange={(e) => setNewReview((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <Label htmlFor="dueAt">Due Date</Label>
                <Input
                  id="dueAt"
                  type="date"
                  value={newReview.dueAt}
                  onChange={(e) => setNewReview((prev) => ({ ...prev, dueAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReview} disabled={createReview.isPending}>
                {createReview.isPending ? 'Creating...' : 'Create Review'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedReview.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedReview.completedItemCount} of {selectedReview.itemCount} reviewed
                </p>
              </div>
              <div className="flex space-x-2">
                {selectedReview.status !== 'closed' && (
                  <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_WRITE}>
                    <Button variant="outline" onClick={handleCloseReview}>
                      Close Review
                    </Button>
                  </PermissionGate>
                )}
                <Button variant="ghost" onClick={() => setSelectedReview(null)}>
                  Close
                </Button>
              </div>
            </div>

            {/* Review Items */}
            {itemsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {(itemsData?.data as ReviewItem[])?.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.userName}</p>
                        <p className="text-sm text-gray-500">{item.userEmail}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.currentRoles.map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.decision !== 'pending' ? (
                          <Badge variant={decisionConfig[item.decision]?.variant || 'default'}>
                            {decisionConfig[item.decision]?.label || item.decision}
                          </Badge>
                        ) : (
                          <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_DECIDE}>
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                                onClick={() => handleDecision('keep')}
                              >
                                Keep
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleDecision('remove')}
                              >
                                Remove
                              </Button>
                            </div>
                          </PermissionGate>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
