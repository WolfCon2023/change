/**
 * Audit Logs Page
 * View and export IAM audit logs
 */

import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useAuditLogs, useExportAuditLogs } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  summary: string;
  createdAt: string;
  ip?: string;
}

export function AuditLogsPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    actorEmail: '',
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useAuditLogs(tenantId, {
    page,
    actorEmail: filters.actorEmail || undefined,
    action: filters.action || undefined,
    targetType: filters.targetType || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });
  const exportLogs = useExportAuditLogs(tenantId);

  const columns = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (log: AuditLog) => (
        <span className="text-sm text-gray-500">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (log: AuditLog) => (
        <span className="text-sm font-medium text-gray-900">{log.actorEmail}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: AuditLog) => (
        <Badge variant="outline" className="text-xs font-mono">
          {log.action.split('.').pop()}
        </Badge>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (log: AuditLog) => (
        <div>
          <p className="text-sm text-gray-900">{log.targetName || log.targetId}</p>
          <p className="text-xs text-gray-500">{log.targetType}</p>
        </div>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
      render: (log: AuditLog) => (
        <p className="text-sm text-gray-500 truncate max-w-xs" title={log.summary}>
          {log.summary}
        </p>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (log: AuditLog) => (
        <span className="text-xs text-gray-400 font-mono">{log.ip || '-'}</span>
      ),
    },
  ];

  const handleExport = async () => {
    try {
      await exportLogs.mutateAsync({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        action: filters.action || undefined,
      });
      toast({ title: 'Audit logs exported successfully' });
    } catch {
      toast({ title: 'Failed to export audit logs', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500">View all IAM activity and changes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <PermissionGate permission={IamPermission.IAM_AUDIT_EXPORT}>
            <Button variant="outline" onClick={handleExport} disabled={exportLogs.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {exportLogs.isPending ? 'Exporting...' : 'Export CSV'}
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-500">Actor Email</label>
              <Input
                value={filters.actorEmail}
                onChange={(e) => setFilters((prev) => ({ ...prev, actorEmail: e.target.value }))}
                placeholder="Filter by email"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Action</label>
              <Input
                value={filters.action}
                onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
                placeholder="Filter by action"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ actorEmail: '', action: '', targetType: '', startDate: '', endDate: '' })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={(data?.data as AuditLog[]) || []}
        keyField="id"
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No audit logs found"
      />
    </div>
  );
}
