/**
 * Security Gap Analysis Page
 * Comprehensive security analysis dashboard with findings and recommendations
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Users,
  Key,
  Lock,
  FileCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSecurityGapAnalysis, SecurityGap } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';

const severityConfig = {
  critical: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  high: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  medium: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Info,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  low: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

const categoryIcons: Record<string, typeof Shield> = {
  'Authentication': Lock,
  'Access Management': Users,
  'Privilege Management': Shield,
  'API Security': Key,
  'Compliance': FileCheck,
};

function SecurityScoreGauge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    if (s >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Good';
    if (s >= 60) return 'Fair';
    if (s >= 40) return 'Needs Attention';
    return 'Critical';
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return 'bg-green-100';
    if (s >= 60) return 'bg-yellow-100';
    if (s >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className={`relative w-40 h-40 rounded-full ${getScoreBg(score)} flex items-center justify-center`}>
        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-inner">
          <div className="text-center">
            <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <p className="text-sm text-gray-500">/ 100</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {score >= 60 ? (
          <TrendingUp className={`h-5 w-5 ${getScoreColor(score)}`} />
        ) : (
          <TrendingDown className={`h-5 w-5 ${getScoreColor(score)}`} />
        )}
        <span className={`font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

function GapCard({ gap, isExpanded, onToggle }: { 
  gap: SecurityGap; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const config = severityConfig[gap.severity];
  const Icon = config.icon;
  const CategoryIcon = categoryIcons[gap.category] || Shield;

  return (
    <Card className={`${config.borderColor} border-l-4`}>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{gap.title}</CardTitle>
                <Badge className={config.color}>{gap.severity.toUpperCase()}</Badge>
              </div>
              <CardDescription className="mt-1 flex items-center gap-2">
                <CategoryIcon className="h-3 w-3" />
                {gap.category}
                {gap.affectedItems.length > 0 && (
                  <span className="text-gray-400">•</span>
                )}
                {gap.affectedItems.length > 0 && (
                  <span>{gap.affectedItems.length} affected item{gap.affectedItems.length !== 1 ? 's' : ''}</span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <div>
            <p className="text-sm text-gray-700">{gap.description}</p>
          </div>

          {gap.affectedItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Affected Items</h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                <ul className="space-y-2">
                  {gap.affectedItems.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      {item.detail && (
                        <span className="text-gray-500 text-xs">{item.detail}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className={`${config.bgColor} rounded-lg p-4`}>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Recommendation</h4>
            <p className="text-sm text-gray-700">{gap.recommendation}</p>
          </div>

          {gap.complianceFrameworks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Compliance Frameworks</h4>
              <div className="flex flex-wrap gap-2">
                {gap.complianceFrameworks.map((framework, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function SecurityGapAnalysisPage() {
  const navigate = useNavigate();
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { data, isLoading, refetch, isFetching } = useSecurityGapAnalysis(tenantId);
  
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const toggleGap = (gapId: string) => {
    const newExpanded = new Set(expandedGaps);
    if (newExpanded.has(gapId)) {
      newExpanded.delete(gapId);
    } else {
      newExpanded.add(gapId);
    }
    setExpandedGaps(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Unable to load security analysis</h2>
        <p className="text-gray-500">Please try again later</p>
      </div>
    );
  }

  // Filter gaps
  const filteredGaps = data.gaps.filter(gap => {
    if (severityFilter !== 'all' && gap.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && gap.category !== categoryFilter) return false;
    return true;
  });

  // Get unique categories
  const categories = Array.from(new Set(data.gaps.map(g => g.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Gap Analysis</h1>
          <p className="text-gray-500">
            Comprehensive security assessment of your IAM configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Last analyzed */}
      <p className="text-sm text-gray-500">
        Last analyzed: {new Date(data.analyzedAt).toLocaleString()}
      </p>

      {/* Score and Summary Dashboard */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Security Score */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Security Score</CardTitle>
            <CardDescription>Overall security posture rating</CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityScoreGauge score={data.securityScore} />
          </CardContent>
        </Card>

        {/* Gap Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Gap Summary</CardTitle>
            <CardDescription>Security gaps by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div 
                className={`text-center p-4 rounded-lg cursor-pointer transition-all ${
                  severityFilter === 'critical' ? 'ring-2 ring-red-500' : ''
                } bg-red-50`}
                onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
              >
                <p className="text-3xl font-bold text-red-600">{data.gapsBySeverity.critical}</p>
                <p className="text-sm text-red-700">Critical</p>
              </div>
              <div 
                className={`text-center p-4 rounded-lg cursor-pointer transition-all ${
                  severityFilter === 'high' ? 'ring-2 ring-orange-500' : ''
                } bg-orange-50`}
                onClick={() => setSeverityFilter(severityFilter === 'high' ? 'all' : 'high')}
              >
                <p className="text-3xl font-bold text-orange-600">{data.gapsBySeverity.high}</p>
                <p className="text-sm text-orange-700">High</p>
              </div>
              <div 
                className={`text-center p-4 rounded-lg cursor-pointer transition-all ${
                  severityFilter === 'medium' ? 'ring-2 ring-yellow-500' : ''
                } bg-yellow-50`}
                onClick={() => setSeverityFilter(severityFilter === 'medium' ? 'all' : 'medium')}
              >
                <p className="text-3xl font-bold text-yellow-600">{data.gapsBySeverity.medium}</p>
                <p className="text-sm text-yellow-700">Medium</p>
              </div>
              <div 
                className={`text-center p-4 rounded-lg cursor-pointer transition-all ${
                  severityFilter === 'low' ? 'ring-2 ring-blue-500' : ''
                } bg-blue-50`}
                onClick={() => setSeverityFilter(severityFilter === 'low' ? 'all' : 'low')}
              >
                <p className="text-3xl font-bold text-blue-600">{data.gapsBySeverity.low}</p>
                <p className="text-sm text-blue-700">Low</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">MFA Coverage</span>
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xl font-bold mt-1">{data.summary.mfaCoverage}%</p>
                <div className="h-1 mt-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${data.summary.mfaCoverage}%` }}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Admin Access</span>
                  <Shield className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xl font-bold mt-1">{data.summary.adminAccessPercentage}%</p>
                <div className="h-1 mt-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${data.summary.adminAccessPercentage > 20 ? 'bg-orange-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(data.summary.adminAccessPercentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inactive Users</span>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xl font-bold mt-1">{data.summary.inactiveUserPercentage}%</p>
                <div className="h-1 mt-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${data.summary.inactiveUserPercentage > 30 ? 'bg-orange-500' : 'bg-blue-600'}`}
                    style={{ width: `${data.summary.inactiveUserPercentage}%` }}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Key Issues</span>
                  <Key className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xl font-bold mt-1">{data.summary.apiKeysWithIssues}</p>
                <p className="text-xs text-gray-500 mt-2">Keys needing attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {data.totalGaps > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Quick Actions</p>
                  <p className="text-sm text-blue-700">Address the most impactful gaps first</p>
                </div>
              </div>
              <div className="flex gap-2">
                {data.gapsBySeverity.critical > 0 && data.gaps.find(g => g.id === 'mfa-not-enabled') && (
                  <Button size="sm" onClick={() => navigate('/admin/users')}>
                    <Lock className="h-4 w-4 mr-2" />
                    Enable MFA
                  </Button>
                )}
                {data.gaps.find(g => g.id === 'no-recent-access-reviews') && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/admin/access-review-campaigns')}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Start Access Review
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border rounded-md px-2 py-1"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {severityFilter !== 'all' && (
          <Badge 
            className="cursor-pointer" 
            onClick={() => setSeverityFilter('all')}
          >
            Severity: {severityFilter} ×
          </Badge>
        )}
        <span className="text-sm text-gray-500">
          Showing {filteredGaps.length} of {data.totalGaps} gaps
        </span>
      </div>

      {/* Gap List */}
      {data.totalGaps === 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-900 mb-2">Excellent Security Posture!</h2>
            <p className="text-green-700">
              No security gaps were identified. Continue monitoring and maintaining your security controls.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGaps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No gaps match the current filters
            </div>
          ) : (
            filteredGaps.map(gap => (
              <GapCard
                key={gap.id}
                gap={gap}
                isExpanded={expandedGaps.has(gap.id)}
                onToggle={() => toggleGap(gap.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Compliance Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Framework Mapping</CardTitle>
          <CardDescription>
            How identified gaps relate to common compliance requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['SOC2', 'ISO 27001', 'NIST 800-53', 'PCI-DSS'].map(framework => {
              const frameworkGaps = data.gaps.filter(g => g.complianceFrameworks.includes(framework));
              const hasIssues = frameworkGaps.length > 0;
              
              return (
                <div 
                  key={framework}
                  className={`p-4 rounded-lg border ${
                    hasIssues ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{framework}</span>
                    {hasIssues ? (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <p className={`text-sm ${hasIssues ? 'text-orange-700' : 'text-green-700'}`}>
                    {hasIssues 
                      ? `${frameworkGaps.length} gap${frameworkGaps.length !== 1 ? 's' : ''} affect${frameworkGaps.length === 1 ? 's' : ''} compliance`
                      : 'No gaps affecting compliance'
                    }
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
