/**
 * Access Review Campaign Detail Page
 * View and manage a single access review campaign
 */

import { useState } from 'react';
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
  PrivilegeLevelLabels,
  EnvironmentTypeLabels,
  ReviewTypeLabels,
  EmploymentTypeLabels,
  DataClassificationLabels,
  EntitlementTypeLabels,
  GrantMethodLabels,
  SecondLevelDecision,
} from '@change/shared';

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

export function AccessReviewCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { context } = useAdminStore();
  const { user } = useAuthStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttestation, setSubmitAttestation] = useState(false);

  const { data: campaign, isLoading } = useAccessReviewCampaign(tenantId, id || '');
  const updateCampaign = useUpdateAccessReviewCampaign(tenantId, id || '');
  const submitCampaign = useSubmitAccessReviewCampaign(tenantId, id || '');
  const approveCampaign = useApproveAccessReviewCampaign(tenantId, id || '');

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
            Subjects ({campaign.subjects?.length || 0})
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
          {campaign.subjects && campaign.subjects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Subject List */}
              <div className="lg:col-span-1 space-y-2">
                <h3 className="font-medium text-gray-900 mb-2">Subjects</h3>
                {campaign.subjects.map((subject, index) => (
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
                    <div className="flex items-center gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {subject.items?.length || 0} items
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {EmploymentTypeLabels[subject.employmentType]}
                      </Badge>
                    </div>
                  </button>
                ))}
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
                      <h4 className="font-medium mb-3">Access Items</h4>
                      <div className="space-y-4">
                        {currentSubject.items?.map((item, itemIndex) => (
                          <div
                            key={item.id || itemIndex}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{item.roleName}</span>
                                  {item.isPrivileged && (
                                    <Badge className="bg-red-100 text-red-800">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Privileged
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {item.application} - {EnvironmentTypeLabels[item.environment]}
                                </p>
                              </div>
                              <Badge className={decisionColors[item.decision?.decisionType || CampaignDecisionType.PENDING]}>
                                {decisionLabels[item.decision?.decisionType || CampaignDecisionType.PENDING]}
                              </Badge>
                            </div>

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
                                        handleItemDecisionChange(selectedSubjectIndex, itemIndex, 'decisionType', value)
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
                                        handleItemDecisionChange(selectedSubjectIndex, itemIndex, 'reasonCode', value)
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
                                        handleItemDecisionChange(selectedSubjectIndex, itemIndex, 'comments', e.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
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
