/**
 * Client Detail Page
 * Detailed view of a client's progress for advisors
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  ClipboardList,
  Calendar,
  Landmark,
  Scale,
} from 'lucide-react';
import axios from 'axios';

interface ClientDetail {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  profile: {
    businessName: string;
    businessType: string;
    formationState: string;
    formationStatus: string;
    einStatus: string;
    readinessFlags: Record<string, boolean>;
    complianceItems: Array<{
      name: string;
      dueDate: string;
      status: string;
      frequency: string;
    }>;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    category: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  assignment: {
    isPrimary: boolean;
    assignedAt: string;
    notes?: string;
  };
}

export function ClientDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/advisor/clients/${tenantId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setClient(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load client details');
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken && tenantId) {
      fetchClient();
    }
  }, [accessToken, tenantId, API_URL]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/advisor')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Client not found'}
        </div>
      </div>
    );
  }

  const flags = client.profile?.readinessFlags || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/advisor')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.profile?.businessName || client.tenant.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-600">
              <span>{client.profile?.businessType || 'Unknown Type'}</span>
              {client.profile?.formationState && (
                <>
                  <span>•</span>
                  <span>{client.profile.formationState}</span>
                </>
              )}
              {client.assignment.isPrimary && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Primary Advisor
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{client.taskStats.total}</p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{client.taskStats.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{client.taskStats.pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className={client.taskStats.overdue > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className={`text-3xl font-bold ${client.taskStats.overdue > 0 ? 'text-red-600' : ''}`}>
                {client.taskStats.overdue}
              </p>
              <p className={`text-sm ${client.taskStats.overdue > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                Overdue
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Progress Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Setup */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Setup</p>
              <div className={`flex items-center gap-2 p-2 rounded ${flags.archetypeSelected ? 'bg-green-50' : 'bg-gray-50'}`}>
                {flags.archetypeSelected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Business Archetype Selected</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${flags.entitySelected ? 'bg-green-50' : 'bg-gray-50'}`}>
                {flags.entitySelected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Entity Type Selected</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${flags.stateSelected ? 'bg-green-50' : 'bg-gray-50'}`}>
                {flags.stateSelected ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Formation State Selected</span>
              </div>
            </div>

            {/* Formation */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-gray-500">Formation</p>
              <div className={`flex items-center gap-2 p-2 rounded ${flags.addressVerified ? 'bg-green-50' : 'bg-gray-50'}`}>
                {flags.addressVerified ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Business Address Verified</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${flags.registeredAgentSet ? 'bg-green-50' : 'bg-gray-50'}`}>
                {flags.registeredAgentSet ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Registered Agent Set</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${
                client.profile?.formationStatus === 'filed' || client.profile?.formationStatus === 'approved' 
                  ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                {client.profile?.formationStatus === 'filed' || client.profile?.formationStatus === 'approved' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Formation Filed</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${
                client.profile?.einStatus === 'received' ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                {client.profile?.einStatus === 'received' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">EIN Received</span>
              </div>
            </div>

            {/* Operations */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-gray-500">Operations</p>
              <div className={`flex items-center gap-2 p-2 rounded ${flags.bankAccountOpened ? 'bg-green-50' : 'bg-gray-50'}`}>
                {flags.bankAccountOpened ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Landmark className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Bank Account Opened</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${flags.operatingAgreementSigned ? 'bg-green-50' : 'bg-gray-50'}`}>
                {flags.operatingAgreementSigned ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Scale className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Operating Agreement Signed</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded ${flags.complianceCalendarSetup ? 'bg-green-50' : 'bg-gray-50'}`}>
                {flags.complianceCalendarSetup ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Calendar className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Compliance Calendar Setup</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
            <CardDescription>{client.tasks.length} tasks shown</CardDescription>
          </CardHeader>
          <CardContent>
            {client.tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {client.tasks.slice(0, 10).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : task.dueDate && new Date(task.dueDate) < new Date() ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority} priority
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Documents
            </CardTitle>
            <CardDescription>{client.documents.length} documents shown</CardDescription>
          </CardHeader>
          <CardContent>
            {client.documents.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No documents yet</p>
            ) : (
              <div className="space-y-2">
                {client.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Items */}
        {client.profile?.complianceItems && client.profile.complianceItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Compliance Items
              </CardTitle>
              <CardDescription>{client.profile.complianceItems.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {client.profile.complianceItems.slice(0, 5).map((item, idx) => {
                  const isOverdue = item.status === 'pending' && new Date(item.dueDate) < new Date();
                  return (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded ${
                      isOverdue ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        {item.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : isOverdue ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assignment Notes */}
      {client.assignment.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Notes</CardTitle>
            <CardDescription>
              Assigned on {new Date(client.assignment.assignedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{client.assignment.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
