/**
 * Access Review Campaign Detail Page
 * View and manage a single access review campaign
 * 
 * Features:
 * - Individual user review with decision-making
 * - Group certification (membership + permissions)
 * - Bulk decision actions for fast review
 * - Risk-based filtering (privileged, high-risk, unused)
 * - Smart suggestions with confidence levels
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Shield,
  Users,
  Zap,
  Filter,
  CheckSquare,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PermissionGate } from '@/components/admin/PermissionGate';
import {
  useAccessReviewCampaign,
  useUpdateAccessReviewCampaign,
  useSubmitAccessReviewCampaign,
  useApproveAccessReviewCampaign,
  useGroups,
} from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/use-toast';
import {
  IamPermission,
  AccessReviewCampaignStatus,
  AccessReviewCampaignStatusType,
  CampaignDecisionType,
  CampaignDecisionTypeValue,
  DecisionReasonCode,
  PrivilegeLevel,
  PrivilegeLevelLabels,
  EnvironmentTypeLabels,
  ReviewTypeLabels,
  EmploymentTypeLabels,
  DataClassification,
  DataClassificationLabels,
  DataClassificationType,
  EntitlementTypeLabels,
  GrantMethodLabels,
  SecondLevelDecision,
} from '@change/shared';
import type { AccessReviewCampaignItem } from '@change/shared';

const statusColors: Record<AccessReviewCampaignStatusType, string> = {
  [AccessReviewCampaignStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [AccessReviewCampaignStatus.IN_REVIEW]: 'bg-blue-100 text-blue-800',
  [AccessReviewCampaignStatus.SUBMITTED]: 'bg-yellow-100 text-yellow-800',
  [AccessReviewCampaignStatus.COMPLETED]: 'bg-green-100 text-green-800',
};

const decisionColors: Record<CampaignDecisionTypeValue, string> = {
  [CampaignDecisionType.PENDING]: 'bg-gray-100 text-gray-800',
  [CampaignDecisionType.APPROVE]: 'bg-green-100 text-green-800',
  [CampaignDecisionType.REVOKE]: 'bg-red-100 text-red-800',
  [CampaignDecisionType.MODIFY]: 'bg-yellow-100 text-yellow-800',
  [CampaignDecisionType.ESCALATE]: 'bg-purple-100 text-purple-800',
};

const decisionLabels: Record<CampaignDecisionTypeValue, string> = {
  [CampaignDecisionType.PENDING]: 'Pending',
  [CampaignDecisionType.APPROVE]: 'Approve',
  [CampaignDecisionType.REVOKE]: 'Revoke',
  [CampaignDecisionType.MODIFY]: 'Modify',
  [CampaignDecisionType.ESCALATE]: 'Escalate',
};

// Smart suggestion type for review items
interface SmartSuggestion {
  itemId: string;
  suggestedDecision: CampaignDecisionTypeValue;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  requiresManualReview: boolean;
}

// Filter options for risk-based filtering
type FilterOption = 'all' | 'privileged' | 'standard' | 'pending' | 'decided';
type DataFilterOption = 'all' | DataClassificationType;

export function AccessReviewCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { context } = useAdminStore();
  const { user } = useAuthStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  // State
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttestation, setSubmitAttestation] = useState(false);
  
  // Filtering state
  const [privilegeFilter, setPrivilegeFilter] = useState<FilterOption>('all');
  const [dataFilter, setDataFilter] = useState<DataFilterOption>('all');
  const [decisionFilter, setDecisionFilter] = useState<FilterOption>('all');
  
  // Bulk selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  
  // Group review state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupCertifications, setGroupCertifications] = useState<Record<string, {
    membershipCertified?: boolean;
    permissionsCertified?: boolean;
  }>>({});

  // Smart suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const { data: campaign, isLoading } = useAccessReviewCampaign(tenantId, id || '');
  const updateCampaign = useUpdateAccessReviewCampaign(tenantId, id || '');
  const submitCampaign = useSubmitAccessReviewCampaign(tenantId, id || '');
  const approveCampaign = useApproveAccessReviewCampaign(tenantId, id || '');
  const { data: groupsData } = useGroups(tenantId, { limit: 100 });
  const availableGroups = groupsData?.data || [];

  // Generate smart suggestions based on item characteristics
  const generateSuggestions = useMemo((): SmartSuggestion[] => {
    if (!campaign?.subjects) return [];
    
    const suggestions: SmartSuggestion[] = [];
    
    campaign.subjects.forEach(subject => {
      subject.items?.forEach(item => {
        const reasons: string[] = [];
        let suggestedDecision: CampaignDecisionTypeValue = CampaignDecisionType.APPROVE;
        let confidence: 'high' | 'medium' | 'low' = 'high';
        let requiresManualReview = false;
        
        // Rule 1: Standard access with low data classification - high confidence approve
        if (item.privilegeLevel === PrivilegeLevel.STANDARD && 
            item.dataClassification === DataClassification.PUBLIC) {
          reasons.push('Standard access to public data');
          confidence = 'high';
        }
        // Rule 2: Admin/Super Admin access - requires manual review
        else if (item.privilegeLevel === PrivilegeLevel.ADMIN || 
                 item.privilegeLevel === PrivilegeLevel.SUPER_ADMIN) {
          reasons.push('Privileged access requires careful review');
          requiresManualReview = true;
          confidence = 'low';
        }
        // Rule 3: Restricted/Confidential data - medium confidence, manual preferred
        else if (item.dataClassification === DataClassification.RESTRICTED ||
                 item.dataClassification === DataClassification.CONFIDENTIAL) {
          reasons.push('Access to sensitive data classification');
          confidence = 'medium';
          requiresManualReview = true;
        }
        // Rule 4: Internal data with standard access - medium confidence approve
        else if (item.dataClassification === DataClassification.INTERNAL &&
                 item.privilegeLevel === PrivilegeLevel.STANDARD) {
          reasons.push('Standard internal access - typical for role');
          confidence = 'medium';
        }
        
        // Add employment type consideration
        if (subject.employmentType === 'contractor') {
          reasons.push('External contractor - verify access necessity');
          if (confidence === 'high') confidence = 'medium';
          requiresManualReview = true;
        }
        
        suggestions.push({
          itemId: item.id || `${subject.id}-${item.roleName}`,
          suggestedDecision,
          confidence,
          reasons,
          requiresManualReview,
        });
      });
    });
    
    return suggestions;
  }, [campaign]);

  // Filter items based on current filters
  const getFilteredItems = (items: AccessReviewCampaignItem[] | undefined): AccessReviewCampaignItem[] => {
    if (!items) return [];
    
    return items.filter(item => {
      // Privilege filter
      if (privilegeFilter === 'privileged' && 
          item.privilegeLevel !== PrivilegeLevel.ADMIN && 
          item.privilegeLevel !== PrivilegeLevel.SUPER_ADMIN) {
        return false;
      }
      if (privilegeFilter === 'standard' && 
          (item.privilegeLevel === PrivilegeLevel.ADMIN || 
           item.privilegeLevel === PrivilegeLevel.SUPER_ADMIN)) {
        return false;
      }
      
      // Data classification filter
      if (dataFilter !== 'all' && item.dataClassification !== dataFilter) {
        return false;
      }
      
      // Decision filter
      if (decisionFilter === 'pending' && 
          item.decision?.decisionType && 
          item.decision.decisionType !== CampaignDecisionType.PENDING) {
        return false;
      }
      if (decisionFilter === 'decided' && 
          (!item.decision?.decisionType || 
           item.decision.decisionType === CampaignDecisionType.PENDING)) {
        return false;
      }
      
      return true;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Campaign not found</h2>
        <Button variant="link" onClick={() => navigate('/admin/access-review-campaigns')}>
          Back to campaigns
        </Button>
      </div>
    );
  }

  const currentSubject = campaign.subjects?.[selectedSubjectIndex];
  const canEdit = campaign.status === AccessReviewCampaignStatus.DRAFT ||
                  campaign.status === AccessReviewCampaignStatus.IN_REVIEW;

  const handleItemDecisionChange = async (
    subjectIndex: number,
    itemIndex: number,
    field: string,
    value: string
  ) => {
    if (!canEdit) return;

    const updatedSubjects = [...(campaign.subjects || [])];
    const subject = { ...updatedSubjects[subjectIndex] };
    const items = [...subject.items];
    const item = { ...items[itemIndex] };

    if (!item.decision) {
      item.decision = {
        decisionType: CampaignDecisionType.PENDING,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item.decision as any)[field] = value;
    items[itemIndex] = item;
    subject.items = items;
    updatedSubjects[subjectIndex] = subject;

    try {
      await updateCampaign.mutateAsync({ subjects: updatedSubjects });
    } catch {
      toast({
        title: 'Failed to update decision',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!submitAttestation) {
      toast({
        title: 'Attestation required',
        description: 'Please confirm the attestation before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCampaign.mutateAsync({
        reviewerAttestation: true,
        reviewerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        reviewerEmail: user?.email || 'unknown@example.com',
      });
      toast({ title: 'Campaign submitted successfully' });
    } catch (error) {
      toast({
        title: 'Failed to submit campaign',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    try {
      await approveCampaign.mutateAsync({
        decision: approved ? SecondLevelDecision.APPROVED : SecondLevelDecision.REJECTED,
        approverName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        approverEmail: user?.email || 'unknown@example.com',
      });
      toast({ title: approved ? 'Campaign approved' : 'Campaign rejected' });
    } catch {
      toast({
        title: 'Failed to process approval',
        variant: 'destructive',
      });
    }
  };

  // =========================================================================
  // BULK ACTIONS
  // =========================================================================

  const handleBulkApproveStandard = async () => {
    if (!campaign?.subjects || !canEdit) return;
    
    const updatedSubjects = [...campaign.subjects];
    let approvedCount = 0;
    
    updatedSubjects.forEach((subject, sIdx) => {
      subject.items?.forEach((item, iIdx) => {
        // Only approve standard access items that are pending
        if ((item.privilegeLevel === PrivilegeLevel.STANDARD || 
             item.privilegeLevel === PrivilegeLevel.ELEVATED) &&
            (!item.decision?.decisionType || 
             item.decision.decisionType === CampaignDecisionType.PENDING)) {
          
          const items = [...subject.items];
          items[iIdx] = {
            ...item,
            decision: {
              decisionType: CampaignDecisionType.APPROVE,
              reasonCode: DecisionReasonCode.JOB_FUNCTION,
              comments: 'Bulk approved - standard access',
            },
          };
          updatedSubjects[sIdx] = { ...subject, items };
          approvedCount++;
        }
      });
    });
    
    try {
      await updateCampaign.mutateAsync({ subjects: updatedSubjects });
      toast({
        title: `Approved ${approvedCount} standard access items`,
        description: 'Privileged items were skipped and require manual review.',
      });
    } catch {
      toast({ title: 'Failed to apply bulk action', variant: 'destructive' });
    }
  };

  const handleBulkApproveAll = async () => {
    if (!campaign?.subjects || !canEdit) return;
    
    const updatedSubjects = [...campaign.subjects];
    let approvedCount = 0;
    
    updatedSubjects.forEach((subject, sIdx) => {
      subject.items?.forEach((item, iIdx) => {
        if (!item.decision?.decisionType || 
            item.decision.decisionType === CampaignDecisionType.PENDING) {
          
          const items = [...subject.items];
          items[iIdx] = {
            ...item,
            decision: {
              decisionType: CampaignDecisionType.APPROVE,
              reasonCode: DecisionReasonCode.JOB_FUNCTION,
              comments: 'Bulk approved',
            },
          };
          updatedSubjects[sIdx] = { ...subject, items };
          approvedCount++;
        }
      });
    });
    
    try {
      await updateCampaign.mutateAsync({ subjects: updatedSubjects });
      toast({ title: `Approved ${approvedCount} items` });
    } catch {
      toast({ title: 'Failed to apply bulk action', variant: 'destructive' });
    }
  };

  const handleBulkApproveSelected = async () => {
    if (!campaign?.subjects || !canEdit || selectedItemIds.size === 0) return;
    
    const updatedSubjects = [...campaign.subjects];
    let approvedCount = 0;
    
    updatedSubjects.forEach((subject, sIdx) => {
      subject.items?.forEach((item, iIdx) => {
        const itemId = item.id || `${subject.id}-${iIdx}`;
        if (selectedItemIds.has(itemId)) {
          const items = [...subject.items];
          items[iIdx] = {
            ...item,
            decision: {
              decisionType: CampaignDecisionType.APPROVE,
              reasonCode: DecisionReasonCode.JOB_FUNCTION,
              comments: 'Approved via bulk selection',
            },
          };
          updatedSubjects[sIdx] = { ...subject, items };
          approvedCount++;
        }
      });
    });
    
    try {
      await updateCampaign.mutateAsync({ subjects: updatedSubjects });
      setSelectedItemIds(new Set());
      toast({ title: `Approved ${approvedCount} selected items` });
    } catch {
      toast({ title: 'Failed to apply bulk action', variant: 'destructive' });
    }
  };

  const handleApplySuggestion = async (suggestion: SmartSuggestion) => {
    if (!campaign?.subjects || !canEdit) return;
    
    const updatedSubjects = [...campaign.subjects];
    let applied = false;
    
    updatedSubjects.forEach((subject, sIdx) => {
      subject.items?.forEach((item, iIdx) => {
        const itemId = item.id || `${subject.id}-${item.roleName}`;
        if (itemId === suggestion.itemId) {
          const items = [...subject.items];
          items[iIdx] = {
            ...item,
            decision: {
              decisionType: suggestion.suggestedDecision,
              reasonCode: DecisionReasonCode.JOB_FUNCTION,
              comments: `AI suggestion (${suggestion.confidence} confidence): ${suggestion.reasons.join(', ')}`,
            },
          };
          updatedSubjects[sIdx] = { ...subject, items };
          applied = true;
        }
      });
    });
    
    if (applied) {
      try {
        await updateCampaign.mutateAsync({ subjects: updatedSubjects });
        setAppliedSuggestions(prev => new Set([...prev, suggestion.itemId]));
        toast({ title: 'Suggestion applied' });
      } catch {
        toast({ title: 'Failed to apply suggestion', variant: 'destructive' });
      }
    }
  };

  const handleApplyAllHighConfidenceSuggestions = async () => {
    if (!campaign?.subjects || !canEdit) return;
    
    const highConfidenceSuggestions = generateSuggestions.filter(
      s => s.confidence === 'high' && !s.requiresManualReview
    );
    
    if (highConfidenceSuggestions.length === 0) {
      toast({ title: 'No high-confidence suggestions available' });
      return;
    }
    
    const suggestionMap = new Map(highConfidenceSuggestions.map(s => [s.itemId, s]));
    const updatedSubjects = [...campaign.subjects];
    let appliedCount = 0;
    
    updatedSubjects.forEach((subject, sIdx) => {
      subject.items?.forEach((item, iIdx) => {
        const itemId = item.id || `${subject.id}-${item.roleName}`;
        const suggestion = suggestionMap.get(itemId);
        
        if (suggestion && 
            (!item.decision?.decisionType || 
             item.decision.decisionType === CampaignDecisionType.PENDING)) {
          const items = [...subject.items];
          items[iIdx] = {
            ...item,
            decision: {
              decisionType: suggestion.suggestedDecision,
              reasonCode: DecisionReasonCode.JOB_FUNCTION,
              comments: `AI auto-approved: ${suggestion.reasons.join(', ')}`,
            },
          };
          updatedSubjects[sIdx] = { ...subject, items };
          appliedCount++;
        }
      });
    });
    
    try {
      await updateCampaign.mutateAsync({ subjects: updatedSubjects });
      toast({
        title: `Applied ${appliedCount} high-confidence suggestions`,
        description: 'Items requiring manual review were skipped.',
      });
    } catch {
      toast({ title: 'Failed to apply suggestions', variant: 'destructive' });
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItemIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemIds(newSelected);
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Certify group membership or permissions
  const handleGroupCertification = (groupId: string, type: 'membership' | 'permissions') => {
    setGroupCertifications(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [type === 'membership' ? 'membershipCertified' : 'permissionsCertified']: true,
      },
    }));
    toast({
      title: `Group ${type} certified`,
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been certified for this group.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/access-review-campaigns')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <Badge className={statusColors[campaign.status]}>
                {campaign.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-gray-500">{campaign.systemName} - {EnvironmentTypeLabels[campaign.environment]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_WRITE}>
              <Button variant="outline" onClick={() => navigate(`/admin/access-review-campaigns/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </PermissionGate>
          )}
          {campaign.status === AccessReviewCampaignStatus.SUBMITTED &&
           campaign.approvals?.secondLevelRequired &&
           !campaign.approvals?.secondDecision && (
            <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_DECIDE}>
              <Button variant="destructive" onClick={() => handleApprove(false)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => handleApprove(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">
            <User className="h-4 w-4 mr-1" />
            Subjects ({campaign.subjects?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="h-4 w-4 mr-1" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Review Type</span>
                  <span>{ReviewTypeLabels[campaign.reviewType]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Unit</span>
                  <span>{campaign.businessUnit || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Period</span>
                  <span>
                    {new Date(campaign.periodStart).toLocaleDateString()} - {new Date(campaign.periodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trigger Reason</span>
                  <span>{campaign.triggerReason || '-'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subjects Reviewed</span>
                    <span>{campaign.completedSubjects || 0} / {campaign.totalSubjects || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${campaign.totalSubjects ? ((campaign.completedSubjects || 0) / campaign.totalSubjects) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Items Decided</span>
                    <span>{campaign.completedItems || 0} / {campaign.totalItems || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${campaign.totalItems ? ((campaign.completedItems || 0) / campaign.totalItems) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {campaign.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{campaign.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          {/* Bulk Actions & Filters Bar */}
          {canEdit && campaign.subjects && campaign.subjects.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Bulk Actions */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleBulkApproveStandard}
                      className="bg-white"
                    >
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Approve Standard
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleBulkApproveAll}
                      className="bg-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve All
                    </Button>
                    {selectedItemIds.size > 0 && (
                      <Button 
                        size="sm"
                        onClick={handleBulkApproveSelected}
                      >
                        Approve {selectedItemIds.size} Selected
                      </Button>
                    )}
                  </div>
                  
                  {/* Smart Suggestions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={showSuggestions ? "default" : "outline"}
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className={showSuggestions ? "" : "bg-white"}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI Suggestions
                    </Button>
                    {showSuggestions && (
                      <Button
                        size="sm"
                        onClick={handleApplyAllHighConfidenceSuggestions}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Apply High-Confidence
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-blue-100">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filters:</span>
                  </div>
                  
                  <Select value={privilegeFilter} onValueChange={(v) => setPrivilegeFilter(v as FilterOption)}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Privilege Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Privileges</SelectItem>
                      <SelectItem value="privileged">Privileged Only</SelectItem>
                      <SelectItem value="standard">Standard Only</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={dataFilter} onValueChange={(v) => setDataFilter(v as DataFilterOption)}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Data Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classifications</SelectItem>
                      {Object.entries(DataClassificationLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={decisionFilter} onValueChange={(v) => setDecisionFilter(v as FilterOption)}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Decision Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="decided">Decided Only</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(privilegeFilter !== 'all' || dataFilter !== 'all' || decisionFilter !== 'all') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPrivilegeFilter('all');
                        setDataFilter('all');
                        setDecisionFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {campaign.subjects && campaign.subjects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Subject List */}
              <div className="lg:col-span-1 space-y-2">
                <h3 className="font-medium text-gray-900 mb-2">Subjects</h3>
                {campaign.subjects.map((subject, index) => {
                  const filteredCount = getFilteredItems(subject.items).length;
                  const totalCount = subject.items?.length || 0;
                  
                  return (
                    <button
                      key={subject.id || index}
                      onClick={() => setSelectedSubjectIndex(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedSubjectIndex === index
                          ? 'bg-primary/10 border-primary'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{subject.fullName}</p>
                          <p className="text-xs text-gray-500">{subject.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {filteredCount === totalCount 
                            ? `${totalCount} items` 
                            : `${filteredCount}/${totalCount} items`}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {EmploymentTypeLabels[subject.employmentType]}
                        </Badge>
                        {subject.items?.some(i => 
                          i.privilegeLevel === PrivilegeLevel.ADMIN || 
                          i.privilegeLevel === PrivilegeLevel.SUPER_ADMIN
                        ) && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Priv
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Subject Detail & Items */}
              <div className="lg:col-span-3">
                {currentSubject ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{currentSubject.fullName}</CardTitle>
                          <CardDescription>{currentSubject.email}</CardDescription>
                        </div>
                        <Badge variant="outline">
                          {EmploymentTypeLabels[currentSubject.employmentType]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Subject Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                        <div>
                          <span className="text-gray-500 block">Job Title</span>
                          <span>{currentSubject.jobTitle || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Department</span>
                          <span>{currentSubject.department || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Manager</span>
                          <span>{currentSubject.managerName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Location</span>
                          <span>{currentSubject.location || '-'}</span>
                        </div>
                      </div>

                      {/* Access Items */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Access Items</h4>
                        {getFilteredItems(currentSubject.items).length !== (currentSubject.items?.length || 0) && (
                          <Badge variant="outline">
                            Showing {getFilteredItems(currentSubject.items).length} of {currentSubject.items?.length || 0}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-4">
                        {getFilteredItems(currentSubject.items)?.map((item, itemIndex) => {
                          const actualItemIndex = currentSubject.items?.findIndex(i => i === item) ?? itemIndex;
                          const itemId = item.id || `${currentSubject.id}-${actualItemIndex}`;
                          const isSelected = selectedItemIds.has(itemId);
                          const suggestion = generateSuggestions.find(s => s.itemId === (item.id || `${currentSubject.id}-${item.roleName}`));
                          const suggestionApplied = appliedSuggestions.has(item.id || `${currentSubject.id}-${item.roleName}`);
                          
                          return (
                            <div
                              key={item.id || actualItemIndex}
                              className={`border rounded-lg p-4 transition-colors ${
                                isSelected ? 'bg-blue-50 border-blue-300' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3">
                                  {/* Selection Checkbox */}
                                  {canEdit && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleItemSelection(itemId)}
                                      className="mt-1 h-4 w-4 rounded border-gray-300"
                                    />
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Shield className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium">{item.roleName}</span>
                                      {(item.privilegeLevel === PrivilegeLevel.ADMIN || 
                                        item.privilegeLevel === PrivilegeLevel.SUPER_ADMIN) && (
                                        <Badge className="bg-red-100 text-red-800">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Privileged
                                        </Badge>
                                      )}
                                      {item.dataClassification === DataClassification.RESTRICTED && (
                                        <Badge className="bg-orange-100 text-orange-800">
                                          Restricted
                                        </Badge>
                                      )}
                                      {item.dataClassification === DataClassification.CONFIDENTIAL && (
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                          Confidential
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {item.application} - {EnvironmentTypeLabels[item.environment]}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={decisionColors[item.decision?.decisionType || CampaignDecisionType.PENDING]}>
                                  {decisionLabels[item.decision?.decisionType || CampaignDecisionType.PENDING]}
                                </Badge>
                              </div>

                              {/* Smart Suggestion Banner */}
                              {showSuggestions && suggestion && !suggestionApplied && 
                               (!item.decision?.decisionType || item.decision.decisionType === CampaignDecisionType.PENDING) && (
                                <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
                                  suggestion.confidence === 'high' 
                                    ? 'bg-green-50 border border-green-200' 
                                    : suggestion.confidence === 'medium'
                                      ? 'bg-yellow-50 border border-yellow-200'
                                      : 'bg-gray-50 border border-gray-200'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <Sparkles className={`h-4 w-4 ${
                                      suggestion.confidence === 'high' 
                                        ? 'text-green-600' 
                                        : suggestion.confidence === 'medium'
                                          ? 'text-yellow-600'
                                          : 'text-gray-600'
                                    }`} />
                                    <div>
                                      <p className="text-sm font-medium">
                                        Suggested: {decisionLabels[suggestion.suggestedDecision]}
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {suggestion.confidence} confidence
                                        </Badge>
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {suggestion.reasons.join(' • ')}
                                      </p>
                                    </div>
                                  </div>
                                  {canEdit && !suggestion.requiresManualReview && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleApplySuggestion(suggestion)}
                                    >
                                      Apply
                                    </Button>
                                  )}
                                  {suggestion.requiresManualReview && (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                                      Manual review recommended
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Item Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                                <div>
                                  <span className="text-gray-500 block">Entitlement Type</span>
                                  <span>{EntitlementTypeLabels[item.entitlementType]}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Privilege Level</span>
                                  <span>{PrivilegeLevelLabels[item.privilegeLevel]}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Grant Method</span>
                                  <span>{GrantMethodLabels[item.grantMethod]}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Data Classification</span>
                                  <span>{DataClassificationLabels[item.dataClassification]}</span>
                                </div>
                              </div>

                              {/* Decision Form */}
                              {canEdit && (
                                <div className="border-t pt-4 mt-4">
                                  <h5 className="text-sm font-medium mb-3">Decision</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-sm text-gray-500 block mb-1">Decision</label>
                                      <Select
                                        value={item.decision?.decisionType || CampaignDecisionType.PENDING}
                                        onValueChange={(value) =>
                                          handleItemDecisionChange(selectedSubjectIndex, actualItemIndex, 'decisionType', value)
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.entries(decisionLabels).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                              {label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-sm text-gray-500 block mb-1">Reason Code</label>
                                      <Select
                                        value={item.decision?.reasonCode || ''}
                                        onValueChange={(value) =>
                                          handleItemDecisionChange(selectedSubjectIndex, actualItemIndex, 'reasonCode', value)
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.values(DecisionReasonCode).map((code) => (
                                            <SelectItem key={code} value={code}>
                                              {code.replace(/_/g, ' ')}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="md:col-span-1">
                                      <label className="text-sm text-gray-500 block mb-1">Comments</label>
                                      <Input
                                        placeholder="Add comments..."
                                        value={item.decision?.comments || ''}
                                        onChange={(e) =>
                                          handleItemDecisionChange(selectedSubjectIndex, actualItemIndex, 'comments', e.target.value)
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {getFilteredItems(currentSubject.items).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No items match the current filters.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Select a subject to view their access items
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No subjects added to this campaign yet
              </CardContent>
            </Card>
          )}

          {/* Submit Section */}
          {canEdit && campaign.subjects && campaign.subjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Submit for Approval</CardTitle>
                <CardDescription>
                  Review all decisions and submit the campaign for approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="attestation"
                    checked={submitAttestation}
                    onChange={(e) => setSubmitAttestation(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="attestation" className="text-sm text-gray-700">
                    I attest that I have reviewed all access entitlements for the subjects in this campaign
                    and the decisions made are accurate and complete to the best of my knowledge.
                  </label>
                </div>
                <PermissionGate permission={IamPermission.IAM_ACCESS_REVIEW_WRITE}>
                  <Button onClick={handleSubmit} disabled={isSubmitting || !submitAttestation}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Submit Campaign'}
                  </Button>
                </PermissionGate>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Group Certification
              </CardTitle>
              <CardDescription>
                Review and certify group memberships and permissions. This ensures groups have appropriate access levels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableGroups.length > 0 ? (
                <div className="space-y-4">
                  {availableGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const certification = groupCertifications[group.id] || {};
                    const isFullyCertified = certification.membershipCertified && certification.permissionsCertified;
                    
                    return (
                      <div 
                        key={group.id} 
                        className={`border rounded-lg transition-colors ${
                          isFullyCertified ? 'bg-green-50 border-green-200' : ''
                        }`}
                      >
                        {/* Group Header */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleGroupExpansion(group.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              )}
                              <Users className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="font-medium">{group.name}</p>
                                <p className="text-sm text-gray-500">{group.description || 'No description'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {certification.membershipCertified && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Membership
                                </Badge>
                              )}
                              {certification.permissionsCertified && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Permissions
                                </Badge>
                              )}
                              {!certification.membershipCertified && !certification.permissionsCertified && (
                                <Badge variant="outline">Pending Review</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Membership Certification */}
                              <div className="space-y-3">
                                <h5 className="font-medium flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Membership Review
                                </h5>
                                <p className="text-sm text-gray-600">
                                  Verify that all members of this group should have this access.
                                </p>
                                <div className="bg-white rounded border p-3">
                                  <p className="text-sm text-gray-500 mb-2">Group Members</p>
                                  <div className="text-sm">
                                    <p>• Member count verification</p>
                                    <p>• Employment type verification</p>
                                    <p>• Active user verification</p>
                                  </div>
                                </div>
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant={certification.membershipCertified ? "outline" : "default"}
                                    disabled={certification.membershipCertified}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGroupCertification(group.id, 'membership');
                                    }}
                                  >
                                    {certification.membershipCertified ? (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Certified
                                      </>
                                    ) : (
                                      'Certify Membership'
                                    )}
                                  </Button>
                                )}
                              </div>
                              
                              {/* Permissions Certification */}
                              <div className="space-y-3">
                                <h5 className="font-medium flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Permissions Review
                                </h5>
                                <p className="text-sm text-gray-600">
                                  Verify the permissions assigned to this group are appropriate.
                                </p>
                                <div className="bg-white rounded border p-3">
                                  <p className="text-sm text-gray-500 mb-2">Group Permissions</p>
                                  <div className="text-sm">
                                    <p>• Role assignments</p>
                                    <p>• Data access levels</p>
                                    <p>• System permissions</p>
                                  </div>
                                </div>
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant={certification.permissionsCertified ? "outline" : "default"}
                                    disabled={certification.permissionsCertified}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGroupCertification(group.id, 'permissions');
                                    }}
                                  >
                                    {certification.permissionsCertified ? (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Certified
                                      </>
                                    ) : (
                                      'Certify Permissions'
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No groups available for certification.</p>
                  <p className="text-sm mt-2">Groups will appear here when they are created in the system.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Group Certification Summary */}
          {availableGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Certification Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{availableGroups.length}</p>
                    <p className="text-sm text-gray-500">Total Groups</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {Object.values(groupCertifications).filter(c => c.membershipCertified && c.permissionsCertified).length}
                    </p>
                    <p className="text-sm text-gray-500">Fully Certified</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {availableGroups.length - Object.values(groupCertifications).filter(c => c.membershipCertified && c.permissionsCertified).length}
                    </p>
                    <p className="text-sm text-gray-500">Pending Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.approvals ? (
                <div className="space-y-6">
                  {/* Primary Reviewer */}
                  <div>
                    <h4 className="font-medium mb-3">Primary Reviewer</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">Name</span>
                        <span>{campaign.approvals.reviewerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Email</span>
                        <span>{campaign.approvals.reviewerEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Attestation</span>
                        <span>
                          {campaign.approvals.reviewerAttestation ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Attested
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Attested At</span>
                        <span>
                          {campaign.approvals.reviewerAttestedAt
                            ? new Date(campaign.approvals.reviewerAttestedAt).toLocaleString()
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Second-Level Approval */}
                  {campaign.approvals.secondLevelRequired && (
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        Second-Level Approval
                        <Badge className="bg-yellow-100 text-yellow-800">Required</Badge>
                      </h4>
                      {campaign.approvals.secondApproverName ? (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 block">Approver</span>
                            <span>{campaign.approvals.secondApproverName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Decision</span>
                            <span>
                              {campaign.approvals.secondDecision === SecondLevelDecision.APPROVED ? (
                                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                              ) : campaign.approvals.secondDecision === SecondLevelDecision.REJECTED ? (
                                <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                              )}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 block">Notes</span>
                            <span>{campaign.approvals.secondDecisionNotes || '-'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Awaiting second-level approval due to privileged access in this campaign.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No approval information available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Status</CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.workflow ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Due Date</span>
                      <span>{new Date(campaign.workflow.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Escalation Level</span>
                      <span>{campaign.workflow.escalationLevel || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Remediation Status</span>
                      <span>
                        {campaign.workflow.remediationStatus ? (
                          <Badge variant="outline">{campaign.workflow.remediationStatus}</Badge>
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Remediation Ticket</span>
                      <span>{campaign.workflow.remediationTicketId || '-'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No workflow information available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
