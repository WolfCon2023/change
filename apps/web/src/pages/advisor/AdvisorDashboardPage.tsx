/**
 * Advisor Dashboard Page
 * Shows advisor's assigned clients and their progress
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Building2,
  TrendingUp,
  FileText,
  ClipboardList,
} from 'lucide-react';
import axios from 'axios';

interface DashboardSummary {
  assignedClients: number;
  activeClients: number;
  pendingTasks: number;
  overdueTasks: number;
  clientsByPhase: {
    setup: number;
    formation: number;
    operations: number;
    complete: number;
  };
}

interface Client {
  id: string;
  tenantId: string;
  tenantName: string;
  businessName: string;
  businessType?: string;
  state?: string;
  phase: string;
  progress: number;
  isPrimary: boolean;
  assignedAt: string;
  tasks: {
    total: number;
    completed: number;
    overdue: number;
  };
  lastActivity?: string;
}

export function AdvisorDashboardPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [dashboardRes, clientsRes] = await Promise.all([
          axios.get(`${API_URL}/advisor/dashboard`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${API_URL}/advisor/clients`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);
        setSummary(dashboardRes.data.data);
        setClients(clientsRes.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken) {
      fetchData();
    }
  }, [accessToken, API_URL]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'setup': return 'bg-blue-100 text-blue-700';
      case 'formation': return 'bg-purple-100 text-purple-700';
      case 'operations': return 'bg-amber-100 text-amber-700';
      case 'complete': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'setup': return 'Setup';
      case 'formation': return 'Formation';
      case 'operations': return 'Operations';
      case 'complete': return 'Complete';
      default: return phase;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
        <p className="text-gray-600">Manage and monitor your assigned clients</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.assignedClients || 0}</p>
                <p className="text-sm text-gray-600">Assigned Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.clientsByPhase?.complete || 0}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.pendingTasks || 0}</p>
                <p className="text-sm text-gray-600">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={summary?.overdueTasks ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                summary?.overdueTasks ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  summary?.overdueTasks ? 'text-red-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${summary?.overdueTasks ? 'text-red-700' : ''}`}>
                  {summary?.overdueTasks || 0}
                </p>
                <p className={`text-sm ${summary?.overdueTasks ? 'text-red-600' : 'text-gray-600'}`}>
                  Overdue Tasks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Client Progress Overview
          </CardTitle>
          <CardDescription>Distribution of clients by phase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Building2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{summary?.clientsByPhase?.setup || 0}</p>
              <p className="text-sm text-blue-600">Setup</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <FileText className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{summary?.clientsByPhase?.formation || 0}</p>
              <p className="text-sm text-purple-600">Formation</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <ClipboardList className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{summary?.clientsByPhase?.operations || 0}</p>
              <p className="text-sm text-amber-600">Operations</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{summary?.clientsByPhase?.complete || 0}</p>
              <p className="text-sm text-green-600">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Clients
          </CardTitle>
          <CardDescription>
            {clients.length} client{clients.length !== 1 ? 's' : ''} assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No clients assigned yet.</p>
              <p className="text-sm">Contact your administrator to get clients assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    client.tasks.overdue > 0 ? 'border-red-200 bg-red-50/50' : ''
                  }`}
                  onClick={() => navigate(`/advisor/clients/${client.tenantId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{client.businessName}</p>
                          {client.isPrimary && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {client.businessType && <span>{client.businessType}</span>}
                          {client.state && <span>• {client.state}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Progress */}
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${client.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10">{client.progress}%</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${getPhaseColor(client.phase)}`}>
                          {getPhaseLabel(client.phase)}
                        </span>
                      </div>
                      {/* Task Stats */}
                      <div className="text-right border-l pl-4">
                        <p className="text-sm">
                          <span className="font-medium">{client.tasks.completed}</span>
                          <span className="text-gray-500">/{client.tasks.total} tasks</span>
                        </p>
                        {client.tasks.overdue > 0 && (
                          <p className="text-xs text-red-600 font-medium">
                            {client.tasks.overdue} overdue
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
