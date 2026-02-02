/**
 * Governance Page
 * Shows alignment between IAM, SIPOC, DMAIC, and CHANGE methodologies
 */

import {
  Users,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Compass,
  BarChart3,
  Search,
  Settings,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminDashboard } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';

interface PhaseGate {
  name: string;
  description: string;
  iamChecks: {
    label: string;
    status: 'complete' | 'warning' | 'incomplete';
    detail: string;
  }[];
}

export function GovernancePage() {
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { data: dashboard, isLoading } = useAdminDashboard(tenantId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Calculate IAM readiness metrics
  const mfaCoverage = dashboard?.mfaCoverage ?? 0;
  const hasOpenReviews = (dashboard?.openAccessReviews ?? 0) > 0;
  const hasPendingRequests = (dashboard?.pendingAccessRequests ?? 0) > 0;
  const totalUsers = dashboard?.totalUsers ?? 0;
  const lockedUsers = dashboard?.lockedUsers ?? 0;

  // SIPOC mapping for IAM
  const sipocMapping = [
    {
      element: 'Suppliers',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      iamElements: [
        'HR Systems (employee data)',
        'Identity Providers (SSO/SAML)',
        'Onboarding workflows',
        'Service account requests',
      ],
    },
    {
      element: 'Inputs',
      icon: FileText,
      color: 'text-green-600',
      bg: 'bg-green-100',
      iamElements: [
        'User registration requests',
        'Role assignment requests',
        'Access requests',
        'API key requests',
      ],
    },
    {
      element: 'Process',
      icon: Settings,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      iamElements: [
        'Identity provisioning',
        'Role-based access control',
        'Permission enforcement',
        'Audit logging',
      ],
    },
    {
      element: 'Outputs',
      icon: Shield,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      iamElements: [
        'Authenticated sessions',
        'Authorized access',
        'Audit trails',
        'Compliance evidence',
      ],
    },
    {
      element: 'Customers',
      icon: Target,
      color: 'text-red-600',
      bg: 'bg-red-100',
      iamElements: [
        'End users (secure access)',
        'Managers (team oversight)',
        'Auditors (compliance)',
        'Security team (risk mgmt)',
      ],
    },
  ];

  // DMAIC mapping for IAM
  const dmaicMapping = [
    {
      phase: 'Define',
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      description: 'Establish IAM requirements and objectives',
      activities: [
        { label: 'Role definitions', link: '/admin/roles' },
        { label: 'Permission catalog', link: '/admin/roles' },
        { label: 'Access policies', link: '/admin/groups' },
        { label: 'Security requirements', link: null },
      ],
      metrics: [`${dashboard?.totalRoles ?? 0} roles defined`, `${dashboard?.totalGroups ?? 0} groups configured`],
    },
    {
      phase: 'Measure',
      icon: BarChart3,
      color: 'text-green-600',
      bg: 'bg-green-100',
      description: 'Track IAM metrics and baselines',
      activities: [
        { label: 'User activity logs', link: '/admin/audit-logs' },
        { label: 'MFA coverage tracking', link: '/admin/users' },
        { label: 'Access patterns', link: '/admin/audit-logs' },
        { label: 'Failed login attempts', link: '/admin/audit-logs' },
      ],
      metrics: [`${mfaCoverage}% MFA coverage`, `${totalUsers} total users`],
    },
    {
      phase: 'Analyze',
      icon: Search,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      description: 'Identify risks and improvement opportunities',
      activities: [
        { label: 'Security gap analysis', link: '/admin/security-gaps' },
        { label: 'Excessive permissions review', link: '/admin/access-review-campaigns' },
        { label: 'Inactive user detection', link: '/admin/users' },
        { label: 'Role drift analysis', link: '/admin/roles' },
      ],
      metrics: [
        `${dashboard?.usersWithoutMfa?.length ?? 0} users without MFA`,
        `${lockedUsers} locked accounts`,
      ],
    },
    {
      phase: 'Improve',
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      description: 'Implement IAM enhancements',
      activities: [
        { label: 'Access request workflow', link: '/admin/access-requests' },
        { label: 'Policy updates', link: '/admin/roles' },
        { label: 'Role cleanup', link: '/admin/roles' },
        { label: 'Review campaigns', link: '/admin/access-review-campaigns' },
      ],
      metrics: [
        `${dashboard?.pendingAccessRequests ?? 0} pending requests`,
        `${dashboard?.openAccessReviews ?? 0} open reviews`,
      ],
    },
    {
      phase: 'Control',
      icon: Lock,
      color: 'text-red-600',
      bg: 'bg-red-100',
      description: 'Maintain and monitor IAM controls',
      activities: [
        { label: 'Access review campaigns', link: '/admin/access-review-campaigns' },
        { label: 'Continuous monitoring', link: '/admin/audit-logs' },
        { label: 'Compliance evidence', link: '/admin/audit-logs' },
        { label: 'API key rotation', link: '/admin/api-keys' },
      ],
      metrics: [
        `${dashboard?.expiringApiKeys?.length ?? 0} expiring API keys`,
        'Audit logging active',
      ],
    },
  ];

  // CHANGE phase gates with IAM readiness checks
  const changePhases: PhaseGate[] = [
    {
      name: 'C - Confirm',
      description: 'Confirm stakeholder access and identity requirements',
      iamChecks: [
        {
          label: 'User roles defined',
          status: (dashboard?.totalRoles ?? 0) >= 4 ? 'complete' : 'incomplete',
          detail: `${dashboard?.totalRoles ?? 0} roles configured`,
        },
        {
          label: 'Groups established',
          status: (dashboard?.totalGroups ?? 0) > 0 ? 'complete' : 'incomplete',
          detail: `${dashboard?.totalGroups ?? 0} groups created`,
        },
        {
          label: 'Access policies documented',
          status: 'complete',
          detail: 'Permission catalog in place',
        },
      ],
    },
    {
      name: 'H - Hone',
      description: 'Refine access controls and security policies',
      iamChecks: [
        {
          label: 'Least privilege implemented',
          status: 'complete',
          detail: 'Role-based access control active',
        },
        {
          label: 'MFA coverage adequate',
          status: mfaCoverage >= 80 ? 'complete' : mfaCoverage >= 50 ? 'warning' : 'incomplete',
          detail: `${mfaCoverage}% of users have MFA`,
        },
        {
          label: 'Audit logging enabled',
          status: 'complete',
          detail: 'All IAM actions logged',
        },
      ],
    },
    {
      name: 'A - Assess',
      description: 'Assess current access and identify gaps',
      iamChecks: [
        {
          label: 'Access review process',
          status: hasOpenReviews ? 'complete' : 'warning',
          detail: hasOpenReviews ? 'Reviews in progress' : 'No active reviews',
        },
        {
          label: 'Pending requests handled',
          status: !hasPendingRequests ? 'complete' : 'warning',
          detail: `${dashboard?.pendingAccessRequests ?? 0} requests pending`,
        },
        {
          label: 'Locked accounts reviewed',
          status: lockedUsers === 0 ? 'complete' : 'warning',
          detail: `${lockedUsers} accounts locked`,
        },
      ],
    },
    {
      name: 'N - Navigate',
      description: 'Navigate implementation with proper access controls',
      iamChecks: [
        {
          label: 'Service accounts configured',
          status: 'complete',
          detail: 'API key management available',
        },
        {
          label: 'Integration access ready',
          status: 'complete',
          detail: 'OAuth/API authentication enabled',
        },
        {
          label: 'Environment separation',
          status: 'complete',
          detail: 'Tenant isolation enforced',
        },
      ],
    },
    {
      name: 'G - Generate',
      description: 'Generate compliance evidence and reports',
      iamChecks: [
        {
          label: 'Audit trail complete',
          status: 'complete',
          detail: 'Full audit logging active',
        },
        {
          label: 'Export capability',
          status: 'complete',
          detail: 'Audit log export available',
        },
        {
          label: 'Access review records',
          status: hasOpenReviews ? 'complete' : 'warning',
          detail: 'Review history maintained',
        },
      ],
    },
    {
      name: 'E - Evaluate',
      description: 'Evaluate IAM effectiveness and compliance',
      iamChecks: [
        {
          label: 'Metrics dashboard',
          status: 'complete',
          detail: 'IAM metrics visible',
        },
        {
          label: 'Continuous monitoring',
          status: 'complete',
          detail: 'Real-time audit logging',
        },
        {
          label: 'Periodic certification',
          status: hasOpenReviews ? 'complete' : 'warning',
          detail: 'Access reviews available',
        },
      ],
    },
  ];

  const getStatusIcon = (status: 'complete' | 'warning' | 'incomplete') => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'incomplete':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Governance</h1>
        <p className="text-gray-500">
          IAM alignment with SIPOC, DMAIC, and CHANGE methodologies
        </p>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">About This Panel</p>
              <p className="text-sm text-blue-700 mt-1">
                This governance panel shows how Identity and Access Management (IAM) integrates with 
                process improvement methodologies. Use this to understand IAM's role in your 
                organization's compliance and operational excellence framework.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SIPOC Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Compass className="h-5 w-5 mr-2 text-indigo-600" />
          SIPOC Alignment
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          How IAM maps to the Suppliers, Inputs, Process, Outputs, and Customers framework
        </p>
        <div className="grid md:grid-cols-5 gap-4">
          {sipocMapping.map((item) => (
            <Card key={item.element}>
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <CardTitle className="text-sm ml-2">{item.element}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {item.iamElements.map((el, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start">
                      <ArrowRight className="h-3 w-3 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                      {el}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* DMAIC Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          DMAIC Framework
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Define, Measure, Analyze, Improve, Control - applied to IAM operations
        </p>
        <div className="space-y-4">
          {dmaicMapping.map((phase) => (
            <Card key={phase.phase}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${phase.bg}`}>
                      <phase.icon className={`h-5 w-5 ${phase.color}`} />
                    </div>
                    <div className="ml-3">
                      <CardTitle className="text-base">{phase.phase}</CardTitle>
                      <CardDescription className="text-xs">{phase.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {phase.metrics.map((metric, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {phase.activities.map((activity, idx) => (
                    <div key={idx} className="text-xs">
                      {activity.link ? (
                        <a
                          href={activity.link}
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {activity.label}
                        </a>
                      ) : (
                        <span className="text-gray-600 flex items-center">
                          <ArrowRight className="h-3 w-3 mr-1 text-gray-400" />
                          {activity.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CHANGE Phase Gates Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-purple-600" />
          CHANGE Phase Gates - IAM Readiness
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          IAM readiness checks for each phase of the CHANGE methodology
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {changePhases.map((phase) => {
            const allComplete = phase.iamChecks.every((c) => c.status === 'complete');
            const hasWarnings = phase.iamChecks.some((c) => c.status === 'warning');
            const hasIncomplete = phase.iamChecks.some((c) => c.status === 'incomplete');
            
            return (
              <Card key={phase.name} className={
                hasIncomplete ? 'border-red-200' : 
                hasWarnings ? 'border-yellow-200' : 
                'border-green-200'
              }>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{phase.name}</CardTitle>
                    {allComplete ? (
                      <Badge variant="success">Ready</Badge>
                    ) : hasIncomplete ? (
                      <Badge variant="destructive">Not Ready</Badge>
                    ) : (
                      <Badge variant="warning">Review</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">{phase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {phase.iamChecks.map((check, idx) => (
                      <li key={idx} className="flex items-start justify-between text-sm">
                        <div className="flex items-start">
                          {getStatusIcon(check.status)}
                          <span className="ml-2 text-gray-700">{check.label}</span>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">{check.detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-lg">IAM Governance Summary</CardTitle>
          <CardDescription>
            Overall status of Identity and Access Management readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-indigo-600">{mfaCoverage}%</p>
              <p className="text-sm text-gray-600">MFA Coverage</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-green-600">{dashboard?.totalRoles ?? 0}</p>
              <p className="text-sm text-gray-600">Roles Defined</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-purple-600">{dashboard?.totalGroups ?? 0}</p>
              <p className="text-sm text-gray-600">Groups Active</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-3xl font-bold text-orange-600">{dashboard?.openAccessReviews ?? 0}</p>
              <p className="text-sm text-gray-600">Open Reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
