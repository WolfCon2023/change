/**
 * API Keys Management Page
 * Create and manage API keys
 */

import { useState } from 'react';
import { Plus, Key, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/admin/DataTable';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useApiKeys, useCreateApiKey, useRevokeApiKey, usePermissionCatalog } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import { IamPermission } from '@change/shared';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  owner: { email?: string; name: string } | null;
  lastUsedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  isExpired: boolean;
}

export function ApiKeysPage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', scopes: [] as string[] });
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { data, isLoading, refetch } = useApiKeys(tenantId, { page });
  const { data: permissionCatalog } = usePermissionCatalog();
  const createApiKey = useCreateApiKey(tenantId);
  const revokeApiKey = useRevokeApiKey(tenantId);

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (key: ApiKey) => (
        <div className="flex items-center">
          <Key className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="font-medium text-gray-900">{key.name}</p>
            <p className="text-xs text-gray-500 font-mono">{key.keyPrefix}...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (key: ApiKey) => (
        <span className="text-sm text-gray-500">
          {key.owner?.email || key.owner?.name || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'scopes',
      header: 'Scopes',
      render: (key: ApiKey) => (
        <span className="text-sm text-gray-500">
          {key.scopes.length} scope{key.scopes.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (key: ApiKey) => {
        if (key.revokedAt) {
          return <Badge variant="destructive">Revoked</Badge>;
        }
        if (key.isExpired) {
          return <Badge variant="warning">Expired</Badge>;
        }
        return <Badge variant="success">Active</Badge>;
      },
    },
    {
      key: 'lastUsed',
      header: 'Last Used',
      render: (key: ApiKey) => (
        <span className="text-sm text-gray-500">
          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (key: ApiKey) => (
        !key.revokedAt && (
          <PermissionGate permission={IamPermission.IAM_API_KEY_REVOKE}>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleRevoke(key.id);
              }}
            >
              Revoke
            </Button>
          </PermissionGate>
        )
      ),
    },
  ];

  const handleCreateKey = async () => {
    if (!newKey.name || newKey.scopes.length === 0) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      const result = await createApiKey.mutateAsync(newKey);
      setCreatedKey(result.plainTextKey);
      refetch();
    } catch {
      toast({ title: 'Failed to create API key', variant: 'destructive' });
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      await revokeApiKey.mutateAsync({ keyId });
      toast({ title: 'API key revoked successfully' });
      refetch();
    } catch {
      toast({ title: 'Failed to revoke API key', variant: 'destructive' });
    }
  };

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      toast({ title: 'API key copied to clipboard' });
    }
  };

  const toggleScope = (scope: string) => {
    setNewKey((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500">Manage API keys for programmatic access</p>
        </div>
        <PermissionGate permission={IamPermission.IAM_API_KEY_WRITE}>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </PermissionGate>
      </div>

      {/* API Keys Table */}
      <DataTable
        columns={columns}
        data={(data?.data as ApiKey[]) || []}
        keyField="id"
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No API keys found"
      />

      {/* Create API Key Modal */}
      {showCreateModal && !createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Create API Key</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  value={newKey.name}
                  onChange={(e) => setNewKey((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., CI/CD Pipeline"
                />
              </div>

              <div>
                <Label>Scopes</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Select the permissions this key should have
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {permissionCatalog?.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={newKey.scopes.includes(perm.key)}
                        onChange={() => toggleScope(perm.key)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{perm.key}</span>
                    </label>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  {newKey.scopes.length} scope{newKey.scopes.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={createApiKey.isPending}>
                {createApiKey.isPending ? 'Creating...' : 'Create Key'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Created Key Display Modal */}
      {createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex items-center text-yellow-600 mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold">Save Your API Key</h2>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              This key will only be shown once. Please copy and store it securely.
            </p>

            <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-md">
              <code className="flex-1 text-sm font-mono break-all">{createdKey}</code>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => {
                  setCreatedKey(null);
                  setShowCreateModal(false);
                  setNewKey({ name: '', scopes: [] });
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
