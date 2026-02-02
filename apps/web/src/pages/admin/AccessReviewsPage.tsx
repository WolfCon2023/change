/**
 * Access Reviews Page
 * Create and manage periodic access reviews
 */

import { useState } from 'react';
import { Plus, Check, X, AlertCircle, Clock, User, Shield, Users as UsersIcon, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import {
  useAccessReviews,
  useCreateAccessReview,
  useAccessReviewItems,
  useAccessReviewDecision,
  useCloseAccessReview,
  useUsers,
} from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface AccessReview {
  id: string;
  name: string;
  description?: string;
  status: string;
  dueAt: string;
  itemCount: number;
  completedItemCount: number;
  completionPercentage: number;
  createdAt: string;
}

interface ReviewItem {
  id: string;
  userId: string;
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
  pending: { variant: 'default', label: 'Pending Review' },
  keep: { variant: 'success', label: 'Access Approved' },
  remove: { variant: 'destructive', label: 'Access Revoked' },
  change: { variant: 'warning', label: 'Access Modified' },
};

export function AccessReviewsPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', description: '', dueAt: '', userIds: [] as string[] });
  const [selectedReview, setSelectedReview] = useState<AccessReview | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { data, isLoading, refetch } = useAccessReviews(tenantId, { page });
  const { data: itemsData, isLoading: itemsLoading, refetch: refetchItems } = useAccessReviewItems(
    tenantId,
    selectedReview?.id || '',
    { page: 1 }
  );
  const { data: usersData } = useUsers(tenantId, { limit: 100 });
  const createReview = useCreateAccessReview(tenantId);
  const makeDecision = useAccessReviewDecision(tenantId, selectedReview?.id || '');
  const closeReview = useCloseAccessReview(tenantId);

  // Get all available users for the create modal
  const availableUsers = usersData?.data || [];

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

  // Filter items based on decision status
  const filteredItems = (itemsData?.data as ReviewItem[] || []).filter(item => {
    if (decisionFilter === 'all') return true;
    if (decisionFilter === 'pending') return item.decision === 'pending';
    if (decisionFilter === 'reviewed') return item.decision !== 'pending';
    return true;
  });

  // Toggle expanded state for an item
  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Toggle user selection for create modal
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateReview = async () => {
    if (!newReview.name || !newReview.dueAt) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (selectedUserIds.length === 0) {
      toast({ title: 'Please select at least one user to review', variant: 'destructive' });
      return;
    }

    try {
      await createReview.mutateAsync({
        name: newReview.name,
        description: newReview.description,
        dueAt: new Date(newReview.dueAt).toISOString(),
        userIds: selectedUserIds,
      });
      toast({ title: 'Access review created successfully' });
      setShowCreateModal(false);
      setNewReview({ name: '', description: '', dueAt: '', userIds: [] });
      setSelectedUserIds([]);
      refetch();
    } catch {
      toast({ title: 'Failed to create access review', variant: 'destructive' });
    }
  };

  const handleDecision = async (item: ReviewItem, decision: string) => {
    if (!selectedReview) return;

    setProcessingItemId(item.id);
    try {
      await makeDecision.mutateAsync({
        itemId: item.id,
        decision,
        notes: itemNotes[item.id] || undefined,
      });
      toast({ 
        title: 'Decision recorded',
        description: `${item.userName}'s access has been ${decision === 'keep' ? 'approved' : decision === 'remove' ? 'revoked' : 'modified'}.`
      });
      // Clear notes for this item
      setItemNotes(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      // Refetch items to show updated state
      refetchItems();
      refetch(); // Also refetch review list to update progress
    } catch {
      toast({ title: 'Failed to record decision', variant: 'destructive' });
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleCloseReview = async () => {
    if (!selectedReview) return;

    // Check if all items have been reviewed
    const pendingCount = (itemsData?.data as ReviewItem[] || []).filter(item => item.decision === 'pending').length;
    if (pendingCount > 0) {
      toast({ 
        title: 'Cannot close review', 
        description: `${pendingCount} item(s) still pending review.`,
        variant: 'destructive' 
      });
      return;
    }

    try {
      await closeReview.mutateAsync(selectedReview.id);
      toast({ title: 'Access review closed successfully' });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create Access Review</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Review Name *</Label>
                  <Input
                    id="name"
                    value={newReview.name}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Q1 2026 Access Review"
                  />
                </div>
                <div>
                  <Label htmlFor="dueAt">Due Date *</Label>
                  <Input
                    id="dueAt"
                    type="date"
                    value={newReview.dueAt}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, dueAt: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newReview.description}
                  onChange={(e) => setNewReview((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this access review..."
                  rows={2}
                />
              </div>

              <div>
                <Label className="flex items-center justify-between">
                  <span>Select Users to Review *</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedUserIds.length} selected
                  </span>
                </Label>
                <div className="mt-2 border rounded-lg max-h-64 overflow-y-auto">
                  {availableUsers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {/* Select All */}
                      <div className="p-3 bg-muted/50 flex items-center justify-between">
                        <span className="text-sm font-medium">Select All Users</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedUserIds.length === availableUsers.length) {
                              setSelectedUserIds([]);
                            } else {
                              setSelectedUserIds(availableUsers.map((u: { id: string }) => u.id));
                            }
                          }}
                        >
                          {selectedUserIds.length === availableUsers.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      {availableUsers.map((user: { id: string; email: string; firstName?: string; lastName?: string; roles?: Array<{ name: string }> }) => (
                        <div
                          key={user.id}
                          className={`p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 ${
                            selectedUserIds.includes(user.id) ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              selectedUserIds.includes(user.id) 
                                ? 'bg-primary border-primary text-white' 
                                : 'border-gray-300'
                            }`}>
                              {selectedUserIds.includes(user.id) && <Check className="h-3 w-3" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.email}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {user.roles?.slice(0, 2).map((role: { name: string }, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {role.name}
                              </Badge>
                            ))}
                            {(user.roles?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(user.roles?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => {
                setShowCreateModal(false);
                setSelectedUserIds([]);
                setNewReview({ name: '', description: '', dueAt: '', userIds: [] });
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateReview} 
                disabled={createReview.isPending || !newReview.name || !newReview.dueAt || selectedUserIds.length === 0}
              >
                {createReview.isPending ? 'Creating...' : `Create Review (${selectedUserIds.length} users)`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl m-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{selectedReview.name}</h2>
                    <Badge variant={statusConfig[selectedReview.status]?.variant || 'default'}>
                      {statusConfig[selectedReview.status]?.label || selectedReview.status}
                    </Badge>
                  </div>
                  {selectedReview.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedReview.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Due: {new Date(selectedReview.dueAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedReview.itemCount} users to review
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchItems()}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  {selectedReview.status !== 'closed' && (
                    <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_WRITE}>
                      <Button 
                        variant="outline" 
                        onClick={handleCloseReview}
                        disabled={selectedReview.completedItemCount < selectedReview.itemCount}
                      >
                        Close Review
                      </Button>
                    </PermissionGate>
                  )}
                  <Button variant="ghost" onClick={() => {
                    setSelectedReview(null);
                    setExpandedItems(new Set());
                    setItemNotes({});
                    setDecisionFilter('all');
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Review Progress</span>
                  <span className="font-medium">
                    {selectedReview.completedItemCount} of {selectedReview.itemCount} completed ({selectedReview.completionPercentage}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${selectedReview.completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={decisionFilter}
                  onChange={(e) => setDecisionFilter(e.target.value)}
                >
                  <option value="all">All Items ({(itemsData?.data as ReviewItem[] || []).length})</option>
                  <option value="pending">Pending ({(itemsData?.data as ReviewItem[] || []).filter(i => i.decision === 'pending').length})</option>
                  <option value="reviewed">Reviewed ({(itemsData?.data as ReviewItem[] || []).filter(i => i.decision !== 'pending').length})</option>
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredItems.length} items
              </div>
            </div>

            {/* Review Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {itemsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                  <p className="mt-4 text-muted-foreground">Loading review items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No items to display</h3>
                  <p className="text-muted-foreground mt-1">
                    {decisionFilter === 'pending' 
                      ? 'All items have been reviewed!' 
                      : decisionFilter === 'reviewed'
                      ? 'No items have been reviewed yet.'
                      : 'No users are assigned to this review.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => {
                    const isExpanded = expandedItems.has(item.id);
                    const isProcessing = processingItemId === item.id;
                    const isPending = item.decision === 'pending';

                    return (
                      <div 
                        key={item.id} 
                        className={`border rounded-lg transition-all ${
                          isPending ? 'border-yellow-200 bg-yellow-50/30' : 'bg-white'
                        } ${isProcessing ? 'opacity-50' : ''}`}
                      >
                        {/* Item Header */}
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/20"
                          onClick={() => toggleItemExpanded(item.id)}
                        >
                          <div className="flex items-center gap-3">
                            <button className="text-muted-foreground">
                              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                            </button>
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{item.userName || 'Unknown User'}</p>
                              <p className="text-sm text-muted-foreground">{item.userEmail}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Access Summary */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                {item.currentRoles?.length || 0} roles
                              </span>
                              <span className="flex items-center gap-1">
                                <UsersIcon className="h-4 w-4" />
                                {item.currentGroups?.length || 0} groups
                              </span>
                            </div>

                            {/* Decision Status */}
                            <Badge variant={decisionConfig[item.decision]?.variant || 'default'}>
                              {decisionConfig[item.decision]?.label || item.decision}
                            </Badge>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t p-4 bg-muted/10">
                            <div className="grid grid-cols-2 gap-6">
                              {/* Current Roles */}
                              <div>
                                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <Shield className="h-4 w-4 text-primary" />
                                  Current Roles
                                </h4>
                                {item.currentRoles?.length > 0 ? (
                                  <div className="space-y-2">
                                    {item.currentRoles.map((role) => (
                                      <div key={role.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                                        <Badge variant="outline">{role.name}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No roles assigned</p>
                                )}
                              </div>

                              {/* Current Groups */}
                              <div>
                                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                                  <UsersIcon className="h-4 w-4 text-primary" />
                                  Current Groups
                                </h4>
                                {item.currentGroups?.length > 0 ? (
                                  <div className="space-y-2">
                                    {item.currentGroups.map((group) => (
                                      <div key={group.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                                        <Badge variant="outline">{group.name}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No groups assigned</p>
                                )}
                              </div>
                            </div>

                            {/* Review Info (if already reviewed) */}
                            {item.reviewedAt && (
                              <div className="mt-4 p-3 bg-white rounded border">
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Reviewed by:</span>{' '}
                                  <span className="font-medium">{item.reviewerEmail}</span>
                                </p>
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Reviewed on:</span>{' '}
                                  <span className="font-medium">{new Date(item.reviewedAt).toLocaleString()}</span>
                                </p>
                                {item.notes && (
                                  <p className="text-sm mt-2">
                                    <span className="text-muted-foreground">Notes:</span>{' '}
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Decision Actions (if pending) */}
                            {isPending && selectedReview.status !== 'closed' && (
                              <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_DECIDE}>
                                <div className="mt-4 pt-4 border-t">
                                  <div className="mb-3">
                                    <Label htmlFor={`notes-${item.id}`} className="text-sm">
                                      Review Notes (optional)
                                    </Label>
                                    <Textarea
                                      id={`notes-${item.id}`}
                                      placeholder="Add any notes about this decision..."
                                      value={itemNotes[item.id] || ''}
                                      onChange={(e) => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      rows={2}
                                      className="mt-1"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDecision(item, 'keep');
                                      }}
                                      disabled={isProcessing}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve Access
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="text-red-600 border-red-600 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDecision(item, 'remove');
                                      }}
                                      disabled={isProcessing}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Revoke Access
                                    </Button>
                                  </div>
                                </div>
                              </PermissionGate>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
