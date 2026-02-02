/**
 * Access Review Campaigns List Page
 * List and manage IAM access review campaigns
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, Eye, Edit, Trash2, CheckCircle, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, SortState } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import {
  useAccessReviewCampaigns,
  useDeleteAccessReviewCampaign,
} from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import {
  IamPermission,
  AccessReviewCampaignStatus,
  AccessReviewCampaignStatusType,
  EnvironmentType,
  EnvironmentTypeLabels,
  ReviewType,
  ReviewTypeLabels,
} from '@change/shared';
import type { AccessReviewCampaign } from '@change/shared';

const statusColors: Record<AccessReviewCampaignStatusType, string> = {
  [AccessReviewCampaignStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [AccessReviewCampaignStatus.IN_REVIEW]: 'bg-blue-100 text-blue-800',
  [AccessReviewCampaignStatus.SUBMITTED]: 'bg-yellow-100 text-yellow-800',
  [AccessReviewCampaignStatus.COMPLETED]: 'bg-green-100 text-green-800',
};

const statusLabels: Record<AccessReviewCampaignStatusType, string> = {
  [AccessReviewCampaignStatus.DRAFT]: 'Draft',
  [AccessReviewCampaignStatus.IN_REVIEW]: 'In Review',
  [AccessReviewCampaignStatus.SUBMITTED]: 'Submitted',
  [AccessReviewCampaignStatus.COMPLETED]: 'Completed',
};

export function AccessReviewCampaignsPage() {
  const navigate = useNavigate();
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortState, setSortState] = useState<SortState>({
    column: 'createdAt',
    direction: 'desc',
  });

  const { data, isLoading } = useAccessReviewCampaigns(tenantId, {
    page,
    search: search || undefined,
    status: statusFilter as AccessReviewCampaignStatusType || undefined,
    sortBy: sortState.column || undefined,
    sortOrder: sortState.direction || undefined,
  });

  const deleteCampaign = useDeleteAccessReviewCampaign(tenantId);

  const handleDelete = async (campaign: AccessReviewCampaign) => {
    if (campaign.status !== AccessReviewCampaignStatus.DRAFT) {
      toast({
        title: 'Cannot delete',
        description: 'Only draft campaigns can be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      return;
    }

    try {
      await deleteCampaign.mutateAsync(campaign.id);
      toast({ title: 'Campaign deleted successfully' });
    } catch {
      toast({
        title: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const handleSortChange = (newSort: SortState) => {
    setSortState(newSort);
    setPage(1);
  };

  const columns = [
    {
      key: 'name',
      header: 'Campaign',
      sortable: true,
      render: (campaign: AccessReviewCampaign) => (
        <div>
          <p className="font-medium text-gray-900">{campaign.name}</p>
          <p className="text-sm text-gray-500">{campaign.systemName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (campaign: AccessReviewCampaign) => (
        <Badge className={statusColors[campaign.status]}>
          {statusLabels[campaign.status]}
        </Badge>
      ),
    },
    {
      key: 'environment',
      header: 'Environment',
      render: (campaign: AccessReviewCampaign) => (
        <span className="text-sm text-gray-600">
          {EnvironmentTypeLabels[campaign.environment]}
        </span>
      ),
    },
    {
      key: 'reviewType',
      header: 'Type',
      render: (campaign: AccessReviewCampaign) => (
        <span className="text-sm text-gray-600">
          {ReviewTypeLabels[campaign.reviewType]}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (campaign: AccessReviewCampaign) => {
        const total = campaign.totalItems || 0;
        const completed = campaign.completedItems || 0;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{percent}%</span>
          </div>
        );
      },
    },
    {
      key: 'periodEnd',
      header: 'Period End',
      sortable: true,
      render: (campaign: AccessReviewCampaign) => (
        <span className="text-sm text-gray-500">
          {new Date(campaign.periodEnd).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (campaign: AccessReviewCampaign) => (
        <span className="text-sm text-gray-500">
          {new Date(campaign.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (campaign: AccessReviewCampaign) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/access-review-campaigns/${campaign.id}`)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {campaign.status === AccessReviewCampaignStatus.DRAFT && (
            <>
              <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_WRITE}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/admin/access-review-campaigns/${campaign.id}/edit`)}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(campaign)}
                  title="Delete"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PermissionGate>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Review Campaigns</h1>
          <p className="text-gray-500">
            Manage and conduct IAM access review campaigns for compliance
          </p>
        </div>
        <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_WRITE}>
          <Button onClick={() => navigate('/admin/access-review-campaigns/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Campaigns</p>
              <p className="text-xl font-semibold">{data?.meta?.pagination?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-xl font-semibold">
                {(data?.data || []).filter(c => c.status === AccessReviewCampaignStatus.IN_REVIEW).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-xl font-semibold">
                {(data?.data || []).filter(c => c.status === AccessReviewCampaignStatus.SUBMITTED).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-semibold">
                {(data?.data || []).filter(c => c.status === AccessReviewCampaignStatus.COMPLETED).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <DataTable
        columns={columns}
        data={(data?.data as AccessReviewCampaign[]) || []}
        keyField="id"
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No access review campaigns found"
        sortState={sortState}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
