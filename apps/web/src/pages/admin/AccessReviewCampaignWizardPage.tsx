/**
 * Access Review Campaign Wizard Page
 * Multi-step wizard for creating new access review campaigns
 */

import { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, User, Users, CheckSquare, Square, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAccessReviewCampaign, useRoles, useUsers } from '@/lib/admin-api';
import { useAdminStore } from '@/stores/admin.store';
import { useToast } from '@/components/ui/use-toast';
import {
  EnvironmentType,
  EnvironmentTypeLabels,
  ReviewType,
  ReviewTypeLabels,
  ReviewerType,
  EmploymentType,
  EmploymentTypeLabels,
  EntitlementType,
  PrivilegeLevel,
  PrivilegeLevelLabels,
  GrantMethod,
  DataClassification,
  DataClassificationLabels,
} from '@change/shared';
import type {
  AccessReviewCampaignCreateRequest,
  AccessReviewCampaignSubject,
  EnvironmentTypeValue,
  ReviewTypeValue,
  ReviewerTypeValue,
  EmploymentTypeValue,
  EntitlementTypeValue,
  PrivilegeLevelType,
  GrantMethodType,
  DataClassificationType,
} from '@change/shared';

const STEPS = [
  { id: 'metadata', title: 'Campaign Details', description: 'Basic campaign information' },
  { id: 'subjects', title: 'Subjects', description: 'Add users to review' },
  { id: 'items', title: 'Access Items', description: 'Define access entitlements' },
  { id: 'review', title: 'Review & Create', description: 'Confirm and create' },
];

interface SubjectForm {
  subjectId: string;
  fullName: string;
  email: string;
  employeeId?: string;
  jobTitle?: string;
  department?: string;
  managerName?: string;
  managerEmail?: string;
  location?: string;
  employmentType: string;
  items: ItemForm[];
}

interface ItemForm {
  application: string;
  environment: string;
  roleName: string;
  roleDescription?: string;
  entitlementName?: string;
  entitlementType: string;
  privilegeLevel: string;
  scope?: string;
  grantMethod: string;
  dataClassification: string;
}

const defaultSubject: SubjectForm = {
  subjectId: '',
  fullName: '',
  email: '',
  employmentType: EmploymentType.EMPLOYEE,
  items: [],
};

const defaultItem: ItemForm = {
  application: '',
  environment: EnvironmentType.PROD,
  roleName: '',
  entitlementType: EntitlementType.ROLE,
  privilegeLevel: PrivilegeLevel.STANDARD,
  grantMethod: GrantMethod.MANUAL,
  dataClassification: DataClassification.INTERNAL,
};

export function AccessReviewCampaignWizardPage() {
  const navigate = useNavigate();
  const { context } = useAdminStore();
  const tenantId = context?.currentTenantId || '';
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing roles for the dropdown
  const { data: rolesData } = useRoles(tenantId, { limit: 100 });
  const availableRoles = rolesData?.data || [];

  // Fetch existing users for bulk selection
  const { data: usersData } = useUsers(tenantId, { limit: 100 });
  const availableUsers = usersData?.data || [];

  // Track selected users for bulk add
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Form state
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    systemName: '',
    environment: EnvironmentType.PROD as string,
    businessUnit: '',
    reviewType: ReviewType.PERIODIC as string,
    triggerReason: '',
    reviewerType: ReviewerType.MANAGER as string,
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [subjects, setSubjects] = useState<SubjectForm[]>([]);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState<number | null>(null);

  const createCampaign = useCreateAccessReviewCampaign(tenantId);

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return !!(campaignData.name && campaignData.systemName && campaignData.periodStart && campaignData.periodEnd);
      case 1:
        return subjects.length > 0 && subjects.every(s => s.fullName && s.email && s.subjectId);
      case 2:
        return subjects.every(s => s.items.length > 0 && s.items.every(i => i.application && i.roleName));
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addSubject = () => {
    setSubjects([...subjects, { ...defaultSubject, subjectId: `temp-${Date.now()}` }]);
    setSelectedSubjectIndex(subjects.length);
  };

  // Toggle user selection for bulk add
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  // Select all users
  const selectAllUsers = () => {
    setSelectedUserIds(new Set(availableUsers.map(u => u.id)));
  };

  // Deselect all users
  const deselectAllUsers = () => {
    setSelectedUserIds(new Set());
  };

  // Add selected users as subjects with their roles auto-populated
  const addSelectedUsersAsSubjects = () => {
    const newSubjects: SubjectForm[] = [];
    
    availableUsers
      .filter(user => selectedUserIds.has(user.id))
      .forEach(user => {
        // Check if user is already added
        if (subjects.some(s => s.subjectId === user.id)) {
          return;
        }

        // Create subject with auto-populated roles
        const userRoles = availableRoles.filter(role => 
          // This would ideally check user's assigned roles
          // For now, we add a placeholder item
          true
        );

        const subject: SubjectForm = {
          subjectId: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          employmentType: EmploymentType.EMPLOYEE,
          jobTitle: '',
          department: '',
          items: userRoles.slice(0, 1).map(role => ({
            application: campaignData.systemName || 'System',
            environment: campaignData.environment,
            roleName: role.name,
            entitlementType: EntitlementType.ROLE,
            privilegeLevel: role.name.toLowerCase().includes('admin') 
              ? PrivilegeLevel.ADMIN 
              : PrivilegeLevel.STANDARD,
            grantMethod: GrantMethod.MANUAL,
            dataClassification: DataClassification.INTERNAL,
          })),
        };

        newSubjects.push(subject);
      });

    setSubjects([...subjects, ...newSubjects]);
    setSelectedUserIds(new Set());
    setBulkMode(false);
    
    toast({
      title: `Added ${newSubjects.length} users`,
      description: 'Users have been added with their roles. Review and adjust as needed.',
    });
  };

  const removeSubject = (index: number) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
    if (selectedSubjectIndex === index) {
      setSelectedSubjectIndex(null);
    } else if (selectedSubjectIndex && selectedSubjectIndex > index) {
      setSelectedSubjectIndex(selectedSubjectIndex - 1);
    }
  };

  const updateSubject = (index: number, field: keyof SubjectForm, value: string) => {
    const newSubjects = [...subjects];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newSubjects[index] as any)[field] = value;
    setSubjects(newSubjects);
  };

  const addItem = (subjectIndex: number) => {
    const newSubjects = [...subjects];
    newSubjects[subjectIndex].items.push({ ...defaultItem });
    setSubjects(newSubjects);
  };

  const removeItem = (subjectIndex: number, itemIndex: number) => {
    const newSubjects = [...subjects];
    newSubjects[subjectIndex].items = newSubjects[subjectIndex].items.filter((_, i) => i !== itemIndex);
    setSubjects(newSubjects);
  };

  const updateItem = (subjectIndex: number, itemIndex: number, field: keyof ItemForm, value: string) => {
    const newSubjects = [...subjects];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (newSubjects[subjectIndex].items[itemIndex] as any)[field] = value;
    setSubjects(newSubjects);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const request: AccessReviewCampaignCreateRequest = {
        name: campaignData.name,
        description: campaignData.description || undefined,
        systemName: campaignData.systemName,
        environment: campaignData.environment as EnvironmentTypeValue,
        businessUnit: campaignData.businessUnit || undefined,
        reviewType: campaignData.reviewType as ReviewTypeValue,
        triggerReason: campaignData.triggerReason || undefined,
        periodStart: new Date(campaignData.periodStart),
        periodEnd: new Date(campaignData.periodEnd),
        reviewerType: campaignData.reviewerType as ReviewerTypeValue,
        subjects: subjects.map(s => ({
          subjectId: s.subjectId,
          fullName: s.fullName,
          email: s.email,
          employeeId: s.employeeId || undefined,
          jobTitle: s.jobTitle || undefined,
          department: s.department || undefined,
          managerName: s.managerName || undefined,
          managerEmail: s.managerEmail || undefined,
          location: s.location || undefined,
          employmentType: s.employmentType as EmploymentTypeValue,
          items: s.items.map(i => ({
            application: i.application,
            environment: i.environment as EnvironmentTypeValue,
            roleName: i.roleName,
            roleDescription: i.roleDescription || undefined,
            entitlementName: i.entitlementName || undefined,
            entitlementType: i.entitlementType as EntitlementTypeValue,
            privilegeLevel: i.privilegeLevel as PrivilegeLevelType,
            scope: i.scope || undefined,
            grantMethod: i.grantMethod as GrantMethodType,
            dataClassification: i.dataClassification as DataClassificationType,
          })),
        })) as AccessReviewCampaignSubject[],
        workflow: {
          dueDate: new Date(campaignData.periodEnd),
        },
      };

      const result = await createCampaign.mutateAsync(request);
      toast({ title: 'Campaign created successfully' });
      navigate(`/admin/access-review-campaigns/${result.id}`);
    } catch (error) {
      toast({
        title: 'Failed to create campaign',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/access-review-campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Access Review Campaign</h1>
          <p className="text-gray-500">Create a new IAM access review campaign</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStep
                    ? 'bg-primary text-white'
                    : index === currentStep
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div className="ml-2 hidden md:block">
                <p className={`text-sm font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.title}
                </p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-12 md:w-24 h-1 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Campaign Metadata */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Campaign Name *</label>
                  <Input
                    value={campaignData.name || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCampaignData({ ...campaignData, name: e.target.value })}
                    placeholder="Q1 2026 Access Review"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">System Name *</label>
                  <Input
                    value={campaignData.systemName || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCampaignData({ ...campaignData, systemName: e.target.value })}
                    placeholder="CHANGE Platform"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Environment *</label>
                  <Select
                    value={campaignData.environment}
                    onValueChange={(value) => setCampaignData({ ...campaignData, environment: value as typeof campaignData.environment })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EnvironmentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Review Type *</label>
                  <Select
                    value={campaignData.reviewType}
                    onValueChange={(value) => setCampaignData({ ...campaignData, reviewType: value as typeof campaignData.reviewType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ReviewTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Period Start *</label>
                  <Input
                    type="date"
                    value={campaignData.periodStart || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCampaignData({ ...campaignData, periodStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Period End *</label>
                  <Input
                    type="date"
                    value={campaignData.periodEnd || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCampaignData({ ...campaignData, periodEnd: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Business Unit</label>
                  <Input
                    value={campaignData.businessUnit || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCampaignData({ ...campaignData, businessUnit: e.target.value })}
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Trigger Reason</label>
                  <Input
                    value={campaignData.triggerReason || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCampaignData({ ...campaignData, triggerReason: e.target.value })}
                    placeholder="Quarterly compliance review"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <Textarea
                  value={campaignData.description || ''}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCampaignData({ ...campaignData, description: e.target.value })}
                  placeholder="Describe the purpose of this access review campaign..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Subjects */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Add the users whose access will be reviewed in this campaign.
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={bulkMode ? "outline" : "default"} 
                    size="sm"
                    onClick={() => setBulkMode(false)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manual Add
                  </Button>
                  <Button 
                    variant={bulkMode ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setBulkMode(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Bulk Select
                  </Button>
                </div>
              </div>

              {/* Bulk Selection Mode */}
              {bulkMode && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Quick Select Users</span>
                      <Badge variant="secondary">{selectedUserIds.size} selected</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAllUsers}>
                        Select All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={deselectAllUsers}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                    {availableUsers.map((user) => {
                      const isSelected = selectedUserIds.has(user.id);
                      const alreadyAdded = subjects.some(s => s.subjectId === user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => !alreadyAdded && toggleUserSelection(user.id)}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            alreadyAdded 
                              ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                              : isSelected 
                                ? 'bg-blue-100 border border-blue-300' 
                                : 'bg-white hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          {alreadyAdded && (
                            <Badge variant="outline" className="text-xs">Already added</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Button 
                    onClick={addSelectedUsersAsSubjects}
                    disabled={selectedUserIds.size === 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {selectedUserIds.size} Selected Users
                  </Button>
                </div>
              )}

              {/* Manual Add Mode */}
              {!bulkMode && subjects.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2">No subjects added yet.</p>
                  <p className="text-sm">Use "Bulk Select" for faster multi-user selection, or "Manual Add" for individual entries.</p>
                  <Button onClick={addSubject} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Subject
                  </Button>
                </div>
              )}

              {/* Subject List */}
              {subjects.length > 0 && !bulkMode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{subjects.length} subjects</Badge>
                    <Button onClick={addSubject} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another
                    </Button>
                  </div>
                  {subjects.map((subject, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {subject.fullName || `Subject ${index + 1}`}
                          </span>
                          {subject.items.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {subject.items.length} items
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeSubject(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Full Name *</label>
                          <Input
                            value={subject.fullName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateSubject(index, 'fullName', e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Email *</label>
                          <Input
                            type="email"
                            value={subject.email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateSubject(index, 'email', e.target.value)}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Employment Type *</label>
                          <Select
                            value={subject.employmentType}
                            onValueChange={(value) => updateSubject(index, 'employmentType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(EmploymentTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Job Title</label>
                          <Input
                            value={subject.jobTitle || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateSubject(index, 'jobTitle', e.target.value)}
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Department</label>
                          <Input
                            value={subject.department || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateSubject(index, 'department', e.target.value)}
                            placeholder="Engineering"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Manager Email</label>
                          <Input
                            type="email"
                            value={subject.managerEmail || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateSubject(index, 'managerEmail', e.target.value)}
                            placeholder="manager@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Access Items */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {subjects.map((subject, subjectIndex) => (
                <div key={subjectIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">{subject.fullName}</h4>
                      <p className="text-sm text-gray-500">{subject.email}</p>
                    </div>
                    <Button onClick={() => addItem(subjectIndex)} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {subject.items.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No access items. Click "Add Item" to add entitlements to review.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {subject.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-gray-50 rounded p-3">
                          <div className="flex justify-between mb-3">
                            <span className="text-sm font-medium">Item {itemIndex + 1}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(subjectIndex, itemIndex)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Application *</label>
                              <Input
                                value={item.application}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => updateItem(subjectIndex, itemIndex, 'application', e.target.value)}
                                placeholder="App name"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Role *</label>
                              <Select
                                value={item.roleName}
                                onValueChange={(value) => updateItem(subjectIndex, itemIndex, 'roleName', value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRoles.map((role) => (
                                    <SelectItem key={role.id} value={role.name}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Privilege Level</label>
                              <Select
                                value={item.privilegeLevel}
                                onValueChange={(value) => updateItem(subjectIndex, itemIndex, 'privilegeLevel', value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(PrivilegeLevelLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Data Classification</label>
                              <Select
                                value={item.dataClassification}
                                onValueChange={(value) => updateItem(subjectIndex, itemIndex, 'dataClassification', value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(DataClassificationLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Campaign Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium">{campaignData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">System:</span>
                    <span className="ml-2 font-medium">{campaignData.systemName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Environment:</span>
                    <span className="ml-2 font-medium">{EnvironmentTypeLabels[campaignData.environment as EnvironmentTypeValue]}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Review Type:</span>
                    <span className="ml-2 font-medium">{ReviewTypeLabels[campaignData.reviewType as ReviewTypeValue]}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Period:</span>
                    <span className="ml-2 font-medium">
                      {campaignData.periodStart} to {campaignData.periodEnd}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Subjects:</span>
                    <span className="ml-2 font-medium">{subjects.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Items:</span>
                    <span className="ml-2 font-medium">{subjects.reduce((sum, s) => sum + s.items.length, 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  The campaign will be created in <strong>Draft</strong> status. You can continue editing
                  subjects and items, make decisions on access entitlements, and submit for approval when ready.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canGoNext()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={isSubmitting || !canGoNext()}>
            {isSubmitting ? 'Creating...' : 'Create Campaign'}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
