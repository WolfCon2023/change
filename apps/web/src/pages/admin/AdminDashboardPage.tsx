/**
 * Admin Dashboard Page
 * IAM overview with key metrics
 */

import { useState } from 'react';
import { Users, Shield, Key, AlertTriangle, CheckCircle, Clock, Database, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminDashboard } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export function AdminDashboardPage() {
  const [seedingTemplates, setSeedingTemplates] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { data: dashboard, isLoading } = useAdminDashboard(tenantId);

  const handleSeedTemplates = async () => {
    setSeedingTemplates(true);
    setSeedResult(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/admin/seed-document-templates`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const data = response.data.data;
        setSeedResult({
          success: true,
          message: data.newCount > 0
            ? `Successfully added ${data.newCount} new templates! Total: ${data.existingCount + data.newCount}`
            : `All ${data.existingCount} templates already exist.`,
        });
      } else {
        setSeedResult({ success: false, message: response.data.error?.message || 'Unknown error' });
      }
    } catch (error: any) {
      setSeedResult({
        success: false,
        message: error.response?.data?.error?.message || error.message || 'Failed to seed templates',
      });
    } finally {
      setSeedingTemplates(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load dashboard data</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Users',
      value: dashboard.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Active Users',
      value: dashboard.activeUsers,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Locked Users',
      value: dashboard.lockedUsers,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'MFA Coverage',
      value: `${dashboard.mfaCoverage}%`,
      icon: Shield,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Roles',
      value: dashboard.totalRoles,
      icon: Shield,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Groups',
      value: dashboard.totalGroups,
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-100',
    },
    {
      label: 'Pending Requests',
      value: dashboard.pendingAccessRequests,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      label: 'Open Reviews',
      value: dashboard.openAccessReviews,
      icon: CheckCircle,
      color: 'text-teal-600',
      bg: 'bg-teal-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IAM Dashboard</h1>
        <p className="text-gray-500">Identity and Access Management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="ml-3">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Users Without MFA */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Users Without MFA
            </CardTitle>
            <CardDescription>
              These users have not enabled multi-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.usersWithoutMfa.length === 0 ? (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                All users have MFA enabled
              </p>
            ) : (
              <ul className="space-y-2">
                {dashboard.usersWithoutMfa.map((user) => (
                  <li key={user.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-gray-500">{user.email}</p>
                    </div>
                    <Badge variant="warning">No MFA</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Expiring API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Key className="h-5 w-5 text-orange-500 mr-2" />
              Expiring API Keys
            </CardTitle>
            <CardDescription>
              API keys expiring in the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.expiringApiKeys.length === 0 ? (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                No API keys expiring soon
              </p>
            ) : (
              <ul className="space-y-2">
                {dashboard.expiringApiKeys.map((key) => (
                  <li key={key.id} className="flex items-center justify-between text-sm">
                    <p className="font-medium text-gray-900">{key.name}</p>
                    <Badge variant="warning">
                      Expires {new Date(key.expiresAt).toLocaleDateString()}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="h-5 w-5 text-blue-500 mr-2" />
            System Maintenance
          </CardTitle>
          <CardDescription>Database and system administration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Document Templates</p>
                  <p className="text-sm text-gray-500">Seed new document templates to the database</p>
                </div>
              </div>
              <Button
                onClick={handleSeedTemplates}
                disabled={seedingTemplates}
                size="sm"
              >
                {seedingTemplates ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  'Seed Templates'
                )}
              </Button>
            </div>
            {seedResult && (
              <div className={`p-3 rounded-lg ${seedResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="text-sm flex items-center">
                  {seedResult.success ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  {seedResult.message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent IAM Activity</CardTitle>
          <CardDescription>Latest changes to identity and access management</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.recentIamChanges.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {(dashboard.recentIamChanges as Array<{
                id: string;
                actorEmail: string;
                action: string;
                summary: string;
                createdAt: string;
              }>).slice(0, 10).map((log) => (
                <li key={log.id} className="flex items-start text-sm border-b pb-2 last:border-0">
                  <div className="flex-1">
                    <p className="text-gray-900">{log.summary}</p>
                    <p className="text-gray-500 text-xs">
                      by {log.actorEmail} - {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {log.action.split('.').pop()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
