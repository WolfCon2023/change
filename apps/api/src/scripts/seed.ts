/**
 * Database Seed Script
 * Creates demo data for development and testing
 */

import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  User,
  Tenant,
  BusinessProfile,
  Person,
  Cohort,
  Enrollment,
  WorkflowInstance,
  Task,
  DocumentTemplate,
  AuditLog,
} from '../db/models/index.js';
import {
  UserRole,
  BusinessType,
  USState,
  CohortStatus,
  EnrollmentStatus,
  WorkflowPhase,
  WorkflowStatus,
  FormationStep,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  DocumentType,
  AuditAction,
} from '@change/shared';

async function clearDatabase(): Promise<void> {
  console.log('🗑️  Clearing existing data...');
  
  await Promise.all([
    User.deleteMany({}),
    Tenant.deleteMany({}),
    BusinessProfile.deleteMany({}),
    Person.deleteMany({}),
    Cohort.deleteMany({}),
    Enrollment.deleteMany({}),
    WorkflowInstance.deleteMany({}),
    Task.deleteMany({}),
    DocumentTemplate.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
}

async function seedData(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ==========================================================================
  // 1. Create System Admin User (no tenant)
  // ==========================================================================
  console.log('   Creating system admin...');
  const systemAdmin = await User.create({
    email: config.seed.adminEmail,
    passwordHash: config.seed.adminPassword,
    firstName: 'System',
    lastName: 'Admin',
    role: UserRole.SYSTEM_ADMIN,
    isActive: true,
    emailVerified: true,
  });
  console.log(`   ✓ System admin: ${systemAdmin.email}`);

  // ==========================================================================
  // 2. Create Demo Tenant
  // ==========================================================================
  console.log('   Creating demo tenant...');
  const demoTenant = await Tenant.create({
    name: 'Demo Business Solutions',
    slug: 'demo-business',
    isActive: true,
    settings: {
      timezone: 'America/New_York',
      locale: 'en-US',
      features: ['onboarding', 'enrollment', 'formation', 'documents', 'tasks'],
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`   ✓ Demo tenant: ${demoTenant.name} (${demoTenant.slug})`);

  // ==========================================================================
  // 3. Create Advisor User
  // ==========================================================================
  console.log('   Creating advisor user...');
  const advisor = await User.create({
    email: 'advisor@change-platform.com',
    passwordHash: 'Advisor123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: UserRole.ADVISOR,
    isActive: true,
    emailVerified: true,
  });
  console.log(`   ✓ Advisor: ${advisor.email}`);

  // ==========================================================================
  // 4. Create Demo Client User
  // ==========================================================================
  console.log('   Creating demo client user...');
  const clientUser = await User.create({
    email: 'demo@example.com',
    passwordHash: 'Demo123!',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLIENT_OWNER,
    tenantId: demoTenant._id,
    isActive: true,
    emailVerified: true,
  });
  console.log(`   ✓ Client user: ${clientUser.email}`);

  // ==========================================================================
  // 5. Create Demo Cohort
  // ==========================================================================
  console.log('   Creating demo cohort...');
  const cohort = await Cohort.create({
    name: 'CHANGE Cohort 2026 - Q1',
    description: 'First quarter cohort for the CHANGE business formation program.',
    programId: 'change-beginning-step',
    status: CohortStatus.OPEN,
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-04-15'),
    maxCapacity: 25,
    currentEnrollment: 0,
    advisorIds: [advisor._id],
    settings: {
      autoEnrollment: false,
      requiresApproval: true,
      allowLateEnrollment: true,
    },
  });
  console.log(`   ✓ Cohort: ${cohort.name}`);

  // ==========================================================================
  // 6. Create Demo Business Profile
  // ==========================================================================
  console.log('   Creating demo business profile...');
  const businessProfile = await BusinessProfile.create({
    tenantId: demoTenant._id,
    businessName: 'Acme Consulting LLC',
    businessType: BusinessType.LLC,
    formationState: USState.DE,
    isExistingBusiness: false,
    email: 'contact@acmeconsulting.example.com',
    phone: '(555) 123-4567',
    businessAddress: {
      street1: '123 Main Street',
      street2: 'Suite 400',
      city: 'Wilmington',
      state: USState.DE,
      zipCode: '19801',
      country: 'USA',
    },
  });
  console.log(`   ✓ Business profile: ${businessProfile.businessName}`);

  // ==========================================================================
  // 7. Create Demo Person (Business Owner)
  // ==========================================================================
  console.log('   Creating demo business owner...');
  const person = await Person.create({
    tenantId: demoTenant._id,
    businessProfileId: businessProfile._id,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    roles: [
      {
        type: 'owner',
        title: 'CEO & Founder',
        startDate: new Date(),
      },
    ],
    ownershipPercentage: 100,
    isSigningAuthority: true,
    isPrimaryContact: true,
  });
  console.log(`   ✓ Person: ${person.firstName} ${person.lastName}`);

  // ==========================================================================
  // 8. Create Demo Enrollment
  // ==========================================================================
  console.log('   Creating demo enrollment...');
  const enrollment = await Enrollment.create({
    tenantId: demoTenant._id,
    cohortId: cohort._id,
    businessProfileId: businessProfile._id,
    status: EnrollmentStatus.ACTIVE,
    appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    activatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    advisorId: advisor._id,
    notes: 'Demo enrollment for testing purposes.',
  });

  // Update cohort enrollment count
  cohort.currentEnrollment = 1;
  await cohort.save();
  
  console.log(`   ✓ Enrollment: ${enrollment.status}`);

  // ==========================================================================
  // 9. Create Demo Workflow Instance
  // ==========================================================================
  console.log('   Creating demo workflow instance...');
  const workflowInstance = await WorkflowInstance.create({
    tenantId: demoTenant._id,
    businessProfileId: businessProfile._id,
    enrollmentId: enrollment._id,
    currentPhase: WorkflowPhase.FORMATION,
    currentStep: FormationStep.BUSINESS_TYPE,
    status: WorkflowStatus.IN_PROGRESS,
    phaseHistory: [
      {
        phase: WorkflowPhase.INTAKE,
        status: WorkflowStatus.COMPLETED,
        enteredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        phase: WorkflowPhase.ENROLLMENT,
        status: WorkflowStatus.COMPLETED,
        enteredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        phase: WorkflowPhase.FORMATION,
        status: WorkflowStatus.IN_PROGRESS,
        enteredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  });
  console.log(`   ✓ Workflow: Phase ${workflowInstance.currentPhase}`);

  // ==========================================================================
  // 10. Create Demo Tasks
  // ==========================================================================
  console.log('   Creating demo tasks...');
  const tasks = await Task.create([
    {
      tenantId: demoTenant._id,
      workflowInstanceId: workflowInstance._id,
      businessProfileId: businessProfile._id,
      title: 'Choose Business Entity Type',
      description: 'Select the appropriate business structure (LLC, Corporation, etc.)',
      category: TaskCategory.SOS_FILING,
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      phase: WorkflowPhase.FORMATION,
      step: FormationStep.BUSINESS_TYPE,
      isRequired: true,
      isBlocking: true,
      order: 1,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedBy: clientUser._id,
    },
    {
      tenantId: demoTenant._id,
      workflowInstanceId: workflowInstance._id,
      businessProfileId: businessProfile._id,
      title: 'Verify Business Name Availability',
      description: 'Check if the desired business name is available in your state',
      category: TaskCategory.SOS_FILING,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      phase: WorkflowPhase.FORMATION,
      step: FormationStep.BUSINESS_NAME,
      isRequired: true,
      isBlocking: true,
      order: 2,
    },
    {
      tenantId: demoTenant._id,
      workflowInstanceId: workflowInstance._id,
      businessProfileId: businessProfile._id,
      title: 'Select Registered Agent',
      description: 'Designate a registered agent to receive legal documents',
      category: TaskCategory.SOS_FILING,
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      phase: WorkflowPhase.FORMATION,
      step: FormationStep.REGISTERED_AGENT,
      isRequired: true,
      isBlocking: true,
      order: 3,
    },
    {
      tenantId: demoTenant._id,
      workflowInstanceId: workflowInstance._id,
      businessProfileId: businessProfile._id,
      title: 'Complete EIN Application (SS-4)',
      description: 'Apply for an Employer Identification Number with the IRS',
      category: TaskCategory.EIN_APPLICATION,
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      phase: WorkflowPhase.FORMATION,
      step: FormationStep.EIN_APPLICATION,
      isRequired: true,
      isBlocking: true,
      order: 4,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log(`   ✓ Tasks: ${tasks.length} created`);

  // ==========================================================================
  // 11. Create Document Templates
  // ==========================================================================
  console.log('   Creating document templates...');
  const templates = await DocumentTemplate.create([
    {
      name: 'Articles of Organization - LLC',
      description: 'Standard articles of organization template for Limited Liability Companies',
      type: DocumentType.ARTICLES_OF_ORGANIZATION,
      version: 1,
      isLatestVersion: true,
      content: `ARTICLES OF ORGANIZATION
OF
{{businessName}}

A Limited Liability Company

The undersigned, being a natural person of at least eighteen (18) years of age, hereby establishes a Limited Liability Company pursuant to the laws of the State of {{formationState}}.

ARTICLE I - NAME
The name of the Limited Liability Company is {{businessName}}.

ARTICLE II - REGISTERED AGENT
The name and address of the registered agent of the Limited Liability Company is:
{{registeredAgentName}}
{{registeredAgentAddress}}

ARTICLE III - PURPOSE
The purpose of the Limited Liability Company is to engage in any lawful business activity.

ARTICLE IV - MANAGEMENT
The Limited Liability Company shall be managed by its Members.

IN WITNESS WHEREOF, the undersigned has executed these Articles of Organization on this {{date}}.

_______________________
{{signatoryName}}
Organizer`,
      mergeFields: [
        { key: 'businessName', label: 'Business Name', source: 'business_profile', sourcePath: 'businessName', required: true },
        { key: 'formationState', label: 'Formation State', source: 'business_profile', sourcePath: 'formationState', required: true },
        { key: 'registeredAgentName', label: 'Registered Agent Name', source: 'business_profile', sourcePath: 'registeredAgent.name', required: true },
        { key: 'registeredAgentAddress', label: 'Registered Agent Address', source: 'business_profile', sourcePath: 'registeredAgent.address', required: true },
        { key: 'date', label: 'Date', source: 'custom', required: true },
        { key: 'signatoryName', label: 'Signatory Name', source: 'person', sourcePath: 'fullName', required: true },
      ],
      applicableBusinessTypes: [BusinessType.LLC],
      isActive: true,
      createdBy: systemAdmin._id,
    },
    {
      name: 'Operating Agreement - Single Member LLC',
      description: 'Operating agreement template for single-member LLCs',
      type: DocumentType.OPERATING_AGREEMENT,
      version: 1,
      isLatestVersion: true,
      content: `OPERATING AGREEMENT
OF
{{businessName}}

A {{formationState}} Limited Liability Company

This Operating Agreement is entered into as of {{effectiveDate}} by the sole member named below.

RECITALS
The undersigned Member desires to form a limited liability company under the laws of the State of {{formationState}}.

ARTICLE 1 - ORGANIZATION
1.1 Formation. The Company was formed upon the filing of the Articles of Organization with the Secretary of State.
1.2 Name. The name of the Company is {{businessName}}.
1.3 Principal Office. The principal office is located at {{businessAddress}}.

ARTICLE 2 - MEMBER
2.1 Member. {{memberName}} is the sole Member of the Company.
2.2 Ownership. The Member owns 100% of the Company.

ARTICLE 3 - MANAGEMENT
The Company shall be managed by its Member.

IN WITNESS WHEREOF, the Member has executed this Operating Agreement.

_______________________
{{memberName}}
Sole Member`,
      mergeFields: [
        { key: 'businessName', label: 'Business Name', source: 'business_profile', sourcePath: 'businessName', required: true },
        { key: 'formationState', label: 'Formation State', source: 'business_profile', sourcePath: 'formationState', required: true },
        { key: 'effectiveDate', label: 'Effective Date', source: 'custom', required: true },
        { key: 'businessAddress', label: 'Business Address', source: 'business_profile', sourcePath: 'businessAddress', required: true },
        { key: 'memberName', label: 'Member Name', source: 'person', sourcePath: 'fullName', required: true },
      ],
      applicableBusinessTypes: [BusinessType.LLC],
      isActive: true,
      createdBy: systemAdmin._id,
    },
  ]);
  console.log(`   ✓ Document templates: ${templates.length} created`);

  // ==========================================================================
  // 12. Create Sample Audit Logs
  // ==========================================================================
  console.log('   Creating sample audit logs...');
  await AuditLog.create([
    {
      tenantId: demoTenant._id,
      userId: clientUser._id,
      userEmail: clientUser.email,
      userRole: clientUser.role,
      action: AuditAction.BUSINESS_PROFILE_CREATED,
      resourceType: 'BusinessProfile',
      resourceId: businessProfile._id.toString(),
      newState: { businessName: businessProfile.businessName },
    },
    {
      tenantId: demoTenant._id,
      userId: clientUser._id,
      userEmail: clientUser.email,
      userRole: clientUser.role,
      action: AuditAction.ENROLLMENT_CREATED,
      resourceType: 'Enrollment',
      resourceId: enrollment._id.toString(),
      newState: { cohortId: cohort._id.toString(), status: EnrollmentStatus.APPLIED },
    },
    {
      tenantId: demoTenant._id,
      userId: advisor._id,
      userEmail: advisor.email,
      userRole: advisor.role,
      action: AuditAction.ENROLLMENT_STATUS_CHANGED,
      resourceType: 'Enrollment',
      resourceId: enrollment._id.toString(),
      previousState: { status: EnrollmentStatus.APPLIED },
      newState: { status: EnrollmentStatus.ACTIVE },
    },
    {
      tenantId: demoTenant._id,
      userId: clientUser._id,
      userEmail: clientUser.email,
      userRole: clientUser.role,
      action: AuditAction.WORKFLOW_STARTED,
      resourceType: 'WorkflowInstance',
      resourceId: workflowInstance._id.toString(),
      newState: { phase: WorkflowPhase.INTAKE },
    },
  ]);
  console.log('   ✓ Audit logs created');

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n📊 Seed Summary:');
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   System Admin:     ${systemAdmin.email} / ${config.seed.adminPassword}`);
  console.log(`   Advisor:          ${advisor.email} / Advisor123!`);
  console.log(`   Demo Client:      ${clientUser.email} / Demo123!`);
  console.log(`   Demo Tenant:      ${demoTenant.name}`);
  console.log(`   Demo Business:    ${businessProfile.businessName}`);
  console.log(`   Demo Cohort:      ${cohort.name}`);
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

async function main(): Promise<void> {
  console.log('🚀 CHANGE Platform Database Seeder\n');

  try {
    await connectDatabase();
    await clearDatabase();
    await seedData();
    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main();
