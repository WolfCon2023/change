/**
 * Audit Logs Page
 * View and export IAM audit logs
 */

import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useAuditLogs, useExportAuditLogs, useTenantSettings, useToggleAuditLogging } from '@/lib/admin-api';
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

  // Reset page to 1 when filters change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  const { data, isLoading } = useAuditLogs(tenantId, {
    page,
    actorEmail: filters.actorEmail || undefined,
    action: filters.action || undefined,
    targetType: filters.targetType || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });
  const exportLogs = useExportAuditLogs(tenantId);
  
  // Tenant settings for audit logging toggle
  const { data: settings } = useTenantSettings(tenantId);
  const toggleAuditLogging = useToggleAuditLogging(tenantId);
  
  const handleToggleAuditLogging = async (enabled: boolean) => {
    try {
      await toggleAuditLogging.mutateAsync(enabled);
      toast({ 
        title: enabled ? 'Audit logging enabled' : 'Audit logging disabled',
        description: enabled 
          ? 'All IAM activities will now be recorded.' 
          : 'Audit logging has been turned off. Activities will not be recorded.',
      });
    } catch {
      toast({ 
        title: 'Failed to update audit logging setting', 
        variant: 'destructive' 
      });
    }
  };

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
        <div className="flex items-center space-x-4">
          {/* Audit Logging Toggle */}
          <div className="flex items-center space-x-2 border-r pr-4">
            <label htmlFor="audit-toggle" className="text-sm font-medium text-gray-700">
              Audit Logging
            </label>
            <Switch
              id="audit-toggle"
              checked={settings?.auditLoggingEnabled ?? true}
              onCheckedChange={handleToggleAuditLogging}
              disabled={toggleAuditLogging.isPending}
            />
            <span className={`text-xs ${settings?.auditLoggingEnabled !== false ? 'text-green-600' : 'text-gray-400'}`}>
              {settings?.auditLoggingEnabled !== false ? 'On' : 'Off'}
            </span>
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
      </div>

      {/* Warning when audit logging is disabled */}
      {settings?.auditLoggingEnabled === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Audit Logging Disabled</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Audit logging is currently turned off. New IAM activities will not be recorded. 
                This may affect compliance requirements. Turn on audit logging to resume recording activities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-500">Actor Email</label>
              <Input
                value={filters.actorEmail}
                onChange={(e) => handleFilterChange({ ...filters, actorEmail: e.target.value })}
                placeholder="Filter by email"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Action</label>
              <Input
                value={filters.action}
                onChange={(e) => handleFilterChange({ ...filters, action: e.target.value })}
                placeholder="Filter by action"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFilterChange({ actorEmail: '', action: '', targetType: '', startDate: '', endDate: '' })}
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
