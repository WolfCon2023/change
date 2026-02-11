/**
 * Analytics Page
 * Business analytics dashboard with charts and reports
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  FileText,
  CheckCircle,
  AlertTriangle,
  Activity,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

// Color palette for charts
const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
  gray: '#6b7280',
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.purple];

interface OverviewData {
  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };
  documents: {
    total: number;
    generated: number;
    uploaded: number;
  };
  compliance: {
    score: number;
    completed: number;
    total: number;
  };
  activity: {
    last30Days: number;
  };
}

interface TaskAnalytics {
  statusBreakdown: { status: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  completionTrend: { date: string; count: number }[];
  creationTrend: { date: string; count: number }[];
}

interface DocumentAnalytics {
  categoryBreakdown: { category: string; count: number }[];
  typeBreakdown: { type: string; count: number }[];
  uploadTypeBreakdown: { uploadType: string; count: number }[];
  creationTrend: { date: string; count: number }[];
}

interface ComplianceAnalytics {
  summary: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    healthScore: number;
  };
  statusBreakdown: { status: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  upcomingDeadlines: {
    name: string;
    dueDate: string;
    status: string;
    category: string;
    daysUntilDue: number;
  }[];
  overdueItems: {
    name: string;
    dueDate: string;
    status: string;
    category: string;
    daysOverdue: number;
  }[];
}

interface ActivityAnalytics {
  activityByDay: { date: string; count: number }[];
  activityByAction: { action: string; count: number }[];
  activityByResource: { resource: string; count: number }[];
  totalActivity: number;
}

// Fetch hooks
function useOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: OverviewData }>('/app/analytics/overview');
      return res.data.data;
    },
  });
}

function useTaskAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['analytics', 'tasks', days],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: TaskAnalytics }>(`/app/analytics/tasks?days=${days}`);
      return res.data.data;
    },
  });
}

function useDocumentAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'documents'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DocumentAnalytics }>('/app/analytics/documents');
      return res.data.data;
    },
  });
}

function useComplianceAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'compliance'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ComplianceAnalytics }>('/app/analytics/compliance');
      return res.data.data;
    },
  });
}

function useActivityAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['analytics', 'activity', days],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ActivityAnalytics }>(`/app/analytics/activity?days=${days}`);
      return res.data.data;
    },
  });
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp className={`h-4 w-4 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm ml-1 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-gray-400 ml-1">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Health Score Component
function HealthScoreRing({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke={getColor(score)}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{score}</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">{label}</p>
    </div>
  );
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState(30);
  
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useOverview();
  const { data: taskAnalytics, isLoading: tasksLoading } = useTaskAnalytics(timeRange);
  const { data: documentAnalytics, isLoading: docsLoading } = useDocumentAnalytics();
  const { data: complianceAnalytics, isLoading: complianceLoading } = useComplianceAnalytics();
  const { data: activityAnalytics, isLoading: activityLoading } = useActivityAnalytics(timeRange);

  const isLoading = overviewLoading || tasksLoading || docsLoading || complianceLoading || activityLoading;

  const handleRefresh = () => {
    refetchOverview();
  };

  // Format status labels
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Format date for charts
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Task Completion"
              value={`${overview?.tasks.completionRate || 0}%`}
              subtitle={`${overview?.tasks.completed || 0} of ${overview?.tasks.total || 0} tasks`}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Documents"
              value={overview?.documents.total || 0}
              subtitle={`${overview?.documents.generated || 0} generated, ${overview?.documents.uploaded || 0} uploaded`}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Compliance Score"
              value={`${overview?.compliance.score || 0}%`}
              subtitle={`${overview?.compliance.completed || 0} of ${overview?.compliance.total || 0} items`}
              icon={AlertTriangle}
              color={overview?.compliance.score && overview.compliance.score >= 80 ? 'green' : overview?.compliance.score && overview.compliance.score >= 60 ? 'yellow' : 'red'}
            />
            <StatCard
              title="Activity"
              value={overview?.activity.last30Days || 0}
              subtitle="Actions in last 30 days"
              icon={Activity}
              color="purple"
            />
          </div>

          {/* Tabs for different analytics views */}
          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Tasks Analytics */}
            <TabsContent value="tasks" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Task Completion Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Completion Trend</CardTitle>
                    <CardDescription>Tasks completed over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={taskAnalytics?.completionTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke={COLORS.success} 
                          fill={COLORS.success}
                          fillOpacity={0.3}
                          name="Completed"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Task Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Status</CardTitle>
                    <CardDescription>Current task distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={taskAnalytics?.statusBreakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                          label={({ payload }) => `${formatStatus(payload.status)}: ${payload.count}`}
                        >
                          {(taskAnalytics?.statusBreakdown || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, formatStatus(name as string)]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Task Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tasks by Priority</CardTitle>
                    <CardDescription>Distribution by priority level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={taskAnalytics?.priorityBreakdown || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis 
                          dataKey="priority" 
                          type="category" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={formatStatus}
                          width={80}
                        />
                        <Tooltip formatter={(value, name) => [value, formatStatus(name as string)]} />
                        <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Task Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tasks by Category</CardTitle>
                    <CardDescription>Distribution by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={taskAnalytics?.categoryBreakdown || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={formatStatus}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value, name) => [value, formatStatus(name as string)]} />
                        <Bar dataKey="count" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Analytics */}
            <TabsContent value="documents" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Documents by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documents by Category</CardTitle>
                    <CardDescription>Distribution across categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={documentAnalytics?.categoryBreakdown || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="count"
                          nameKey="category"
                          label={({ payload }) => `${formatStatus(payload.category)}: ${payload.count}`}
                        >
                          {(documentAnalytics?.categoryBreakdown || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, formatStatus(name as string)]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Documents by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documents by Type</CardTitle>
                    <CardDescription>Distribution by document type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={documentAnalytics?.typeBreakdown?.slice(0, 10) || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis 
                          dataKey="type" 
                          type="category" 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => v.length > 20 ? v.slice(0, 20) + '...' : v}
                          width={120}
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill={COLORS.cyan} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Upload Type Distribution */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Document Sources</CardTitle>
                    <CardDescription>Generated vs Uploaded documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-8">
                      {(documentAnalytics?.uploadTypeBreakdown || []).map((item, index) => (
                        <div key={item.uploadType} className="text-center">
                          <div 
                            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          >
                            {item.count}
                          </div>
                          <p className="mt-2 text-sm font-medium">{formatStatus(item.uploadType)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Compliance Analytics */}
            <TabsContent value="compliance" className="space-y-4">
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Health Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compliance Health</CardTitle>
                    <CardDescription>Overall compliance status</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center py-4">
                    <HealthScoreRing 
                      score={complianceAnalytics?.summary.healthScore || 0}
                      label="Health Score"
                    />
                  </CardContent>
                </Card>

                {/* Compliance Summary */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Compliance Summary</CardTitle>
                    <CardDescription>Status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">
                          {complianceAnalytics?.summary.completed || 0}
                        </p>
                        <p className="text-sm text-green-700">Completed</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">
                          {complianceAnalytics?.summary.inProgress || 0}
                        </p>
                        <p className="text-sm text-blue-700">In Progress</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-3xl font-bold text-yellow-600">
                          {complianceAnalytics?.summary.pending || 0}
                        </p>
                        <p className="text-sm text-yellow-700">Pending</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-3xl font-bold text-red-600">
                          {complianceAnalytics?.summary.overdue || 0}
                        </p>
                        <p className="text-sm text-red-700">Overdue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Deadlines */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                      Upcoming Deadlines
                    </CardTitle>
                    <CardDescription>Compliance items due soon</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {complianceAnalytics?.upcomingDeadlines && complianceAnalytics.upcomingDeadlines.length > 0 ? (
                      <div className="space-y-3">
                        {complianceAnalytics.upcomingDeadlines.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                            <Badge variant={item.daysUntilDue <= 7 ? 'destructive' : item.daysUntilDue <= 30 ? 'warning' : 'secondary'}>
                              {item.daysUntilDue} days
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
                    )}
                  </CardContent>
                </Card>

                {/* Overdue Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                      Overdue Items
                    </CardTitle>
                    <CardDescription>Items past their due date</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {complianceAnalytics?.overdueItems && complianceAnalytics.overdueItems.length > 0 ? (
                      <div className="space-y-3">
                        {complianceAnalytics.overdueItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div>
                              <p className="font-medium text-red-800">{item.name}</p>
                              <p className="text-sm text-red-600">{item.daysOverdue} days overdue</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-green-600 text-center py-4 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        No overdue items
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activity Analytics */}
            <TabsContent value="activity" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Activity Trend */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Activity Over Time</CardTitle>
                    <CardDescription>Daily activity in the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={activityAnalytics?.activityByDay || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke={COLORS.primary} 
                          strokeWidth={2}
                          dot={{ fill: COLORS.primary }}
                          name="Activities"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Activity by Action */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Actions</CardTitle>
                    <CardDescription>Most common activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={activityAnalytics?.activityByAction?.slice(0, 5) || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis 
                          dataKey="action" 
                          type="category" 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
                          width={100}
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill={COLORS.pink} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Activity by Resource */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Activity by Resource</CardTitle>
                    <CardDescription>Which resources are most active</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={activityAnalytics?.activityByResource || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          nameKey="resource"
                          label={({ payload }) => `${payload.resource}: ${payload.count}`}
                        >
                          {(activityAnalytics?.activityByResource || []).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;
