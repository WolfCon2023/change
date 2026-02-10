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
  IamRole,
  Group,
  IamAuditLog,
  AdvisorAssignment,
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
  SystemRole,
  SystemRolePermissions,
  IamAuditAction,
  PrimaryRole,
  PrimaryRolePermissions,
  AdvisorAssignmentStatus,
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
    // IAM models
    IamRole.deleteMany({}),
    Group.deleteMany({}),
    IamAuditLog.deleteMany({}),
    AdvisorAssignment.deleteMany({}),
  ]);
}

async function seedData(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ==========================================================================
  // 1. Create System IAM Roles (Legacy + New 4-Role Model)
  // ==========================================================================
  console.log('   Creating system IAM roles...');
  
  // Legacy roles (kept for backward compatibility)
  const globalAdminRole = await IamRole.create({
    name: 'Global Admin',
    description: 'Full access to all IAM features across all tenants (legacy)',
    isSystem: true,
    systemRole: SystemRole.GLOBAL_ADMIN,
    permissions: SystemRolePermissions[SystemRole.GLOBAL_ADMIN],
    isActive: true,
  });

  const tenantAdminRole = await IamRole.create({
    name: 'Tenant Admin',
    description: 'Full IAM access within a tenant (legacy)',
    isSystem: true,
    systemRole: SystemRole.TENANT_ADMIN,
    permissions: SystemRolePermissions[SystemRole.TENANT_ADMIN],
    isActive: true,
  });

  const advisorAdminRole = await IamRole.create({
    name: 'Advisor Admin',
    description: 'Limited IAM access for advisors (legacy)',
    isSystem: true,
    systemRole: SystemRole.ADVISOR_ADMIN,
    permissions: SystemRolePermissions[SystemRole.ADVISOR_ADMIN],
    isActive: true,
  });

  await IamRole.create({
    name: 'Auditor',
    description: 'Read-only access to audit logs and reviews (legacy)',
    isSystem: true,
    systemRole: SystemRole.AUDITOR,
    permissions: SystemRolePermissions[SystemRole.AUDITOR],
    isActive: true,
  });

  // New simplified 4-role model
  const itAdminRole = await IamRole.create({
    name: 'IT Admin',
    description: 'Full platform access including IAM management, audit logs, and cross-tenant operations',
    isSystem: true,
    systemRole: SystemRole.IT_ADMIN,
    permissions: PrimaryRolePermissions[PrimaryRole.IT_ADMIN].iam,
    isActive: true,
  });

  const managerRole = await IamRole.create({
    name: 'Manager',
    description: 'Manage users and operations within their tenant, invite users, manage tasks and documents',
    isSystem: true,
    systemRole: SystemRole.MANAGER,
    permissions: PrimaryRolePermissions[PrimaryRole.MANAGER].iam,
    isActive: true,
  });

  const advisorRole = await IamRole.create({
    name: 'Advisor',
    description: 'Access assigned tenants only, approve tasks and documents, no IAM management',
    isSystem: true,
    systemRole: SystemRole.ADVISOR,
    permissions: PrimaryRolePermissions[PrimaryRole.ADVISOR].iam,
    isActive: true,
  });

  const customerRole = await IamRole.create({
    name: 'Customer',
    description: 'Access own tenant only, manage onboarding, tasks, and documents',
    isSystem: true,
    systemRole: SystemRole.CUSTOMER,
    permissions: PrimaryRolePermissions[PrimaryRole.CUSTOMER].iam,
    isActive: true,
  });

  console.log('   ✓ System IAM roles: 8 created (4 legacy + 4 new)');

  // ==========================================================================
  // 2. Create IT Admin User (no tenant - platform level)
  // ==========================================================================
  console.log('   Creating IT admin...');
  const systemAdmin = await User.create({
    email: config.seed.adminEmail,
    passwordHash: config.seed.adminPassword,
    firstName: 'System',
    lastName: 'Admin',
    role: UserRole.SYSTEM_ADMIN, // Legacy role
    primaryRole: PrimaryRole.IT_ADMIN, // New role
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    mfaEnforced: false,
    iamRoles: [itAdminRole._id, globalAdminRole._id],
    failedLoginAttempts: 0,
    mustChangePassword: false,
  });
  console.log(`   ✓ IT Admin: ${systemAdmin.email}`);

  // ==========================================================================
  // 3. Create Demo Tenant
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
  // 4. Create Advisor User (platform level, assigned to tenants)
  // ==========================================================================
  console.log('   Creating advisor user...');
  const advisor = await User.create({
    email: 'advisor@change-platform.com',
    passwordHash: 'Advisor123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: UserRole.ADVISOR, // Legacy role
    primaryRole: PrimaryRole.ADVISOR, // New role
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    mfaEnforced: false,
    iamRoles: [advisorRole._id, advisorAdminRole._id],
    failedLoginAttempts: 0,
    mustChangePassword: false,
  });
  console.log(`   ✓ Advisor: ${advisor.email}`);

  // ==========================================================================
  // 5. Create Demo Customer User
  // ==========================================================================
  console.log('   Creating demo customer user...');
  const clientUser = await User.create({
    email: 'demo@example.com',
    passwordHash: 'Demo123!',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLIENT_OWNER, // Legacy role
    primaryRole: PrimaryRole.CUSTOMER, // New role
    tenantId: demoTenant._id,
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    mfaEnforced: false,
    iamRoles: [customerRole._id],
    failedLoginAttempts: 0,
    mustChangePassword: false,
  });
  console.log(`   ✓ Customer: ${clientUser.email}`);

  // ==========================================================================
  // 5b. Create Demo Manager User
  // ==========================================================================
  console.log('   Creating demo manager user...');
  const managerUser = await User.create({
    email: 'manager@example.com',
    passwordHash: 'Manager123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.PROGRAM_ADMIN, // Legacy role
    primaryRole: PrimaryRole.MANAGER, // New role
    tenantId: demoTenant._id,
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    mfaEnforced: false,
    iamRoles: [managerRole._id, tenantAdminRole._id],
    failedLoginAttempts: 0,
    mustChangePassword: false,
  });
  console.log(`   ✓ Manager: ${managerUser.email}`);

  // ==========================================================================
  // 6. Create Platform Groups (no tenant)
  // ==========================================================================
  console.log('   Creating platform groups...');
  const itAdminsGroup = await Group.create({
    name: 'IT Admins',
    description: 'Platform-wide IT administrators',
    members: [systemAdmin._id],
    roles: [itAdminRole._id],
    isActive: true,
    isPlatformGroup: true,
    createdBy: systemAdmin._id,
  });

  const advisorsGroup = await Group.create({
    name: 'Advisors',
    description: 'Platform-wide advisors',
    members: [advisor._id],
    roles: [advisorRole._id],
    isActive: true,
    isPlatformGroup: true,
    createdBy: systemAdmin._id,
  });

  await Group.create({
    name: 'Managers',
    description: 'All tenant managers',
    members: [],
    roles: [managerRole._id],
    isActive: true,
    isPlatformGroup: true,
    createdBy: systemAdmin._id,
  });
  console.log('   ✓ Platform groups: 3 created');

  // ==========================================================================
  // 6b. Create Tenant Groups
  // ==========================================================================
  console.log('   Creating tenant groups...');
  const customersGroup = await Group.create({
    tenantId: demoTenant._id,
    name: 'Customers',
    description: 'All customers in this tenant',
    members: [clientUser._id],
    roles: [customerRole._id],
    isActive: true,
    createdBy: systemAdmin._id,
  });

  const customerManagersGroup = await Group.create({
    tenantId: demoTenant._id,
    name: 'Customer Managers',
    description: 'Users who can manage other customers in this tenant',
    members: [managerUser._id],
    roles: [managerRole._id],
    isActive: true,
    createdBy: systemAdmin._id,
  });

  // Update users with groups
  clientUser.groups = [customersGroup._id];
  await clientUser.save();
  managerUser.groups = [customerManagersGroup._id];
  await managerUser.save();
  systemAdmin.groups = [itAdminsGroup._id];
  await systemAdmin.save();
  advisor.groups = [advisorsGroup._id];
  await advisor.save();
  console.log('   ✓ Tenant groups: 2 created');

  // ==========================================================================
  // 6c. Create Advisor Assignment (assign advisor to demo tenant)
  // ==========================================================================
  console.log('   Creating advisor assignment...');
  const advisorAssignment = await AdvisorAssignment.create({
    advisorId: advisor._id,
    tenantId: demoTenant._id,
    status: AdvisorAssignmentStatus.ACTIVE,
    assignedAt: new Date(),
    isActive: true,
    isPrimary: true,
    notes: 'Primary advisor for demo tenant',
    createdBy: systemAdmin._id,
  });
  console.log(`   ✓ Advisor assigned to: ${demoTenant.name}`);

  // ==========================================================================
  // 7. Create Demo Cohort
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
  // 8. Create Demo Business Profile
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
  // 9. Create Demo Person (Business Owner)
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
  // 10. Create Demo Enrollment
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
  // 11. Create Demo Workflow Instance
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
  // 12. Create Demo Tasks
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
  // 13. Create Document Templates
  // ==========================================================================
  console.log('   Creating document templates...');
  
  // Import comprehensive templates
  const { ALL_DOCUMENT_TEMPLATES } = await import('../data/document-templates.js');
  
  // Create all templates with the system admin as creator
  const templates = await DocumentTemplate.create(
    ALL_DOCUMENT_TEMPLATES.map(template => ({
      ...template,
      version: 1,
      isLatestVersion: true,
      isActive: true,
      createdBy: systemAdmin._id,
    }))
  );
  console.log(`   ✓ Document templates: ${templates.length} created (${[
    'Formation', 'Governance', 'Financial', 'Operations', 'Compliance', 'Improvement'
  ].join(', ')} categories)`);

  // ==========================================================================
  // 14. Create Sample Audit Logs
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
  // 15. Create Sample IAM Audit Logs
  // ==========================================================================
  console.log('   Creating sample IAM audit logs...');
  await IamAuditLog.create([
    {
      tenantId: demoTenant._id,
      actorId: systemAdmin._id,
      actorEmail: systemAdmin.email,
      actorType: 'user',
      action: IamAuditAction.USER_CREATED,
      targetType: 'User',
      targetId: clientUser._id.toString(),
      targetName: `${clientUser.firstName} ${clientUser.lastName}`,
      summary: `Created user ${clientUser.email}`,
      after: { email: clientUser.email, role: clientUser.role },
    },
    {
      tenantId: demoTenant._id,
      actorId: systemAdmin._id,
      actorEmail: systemAdmin.email,
      actorType: 'user',
      action: IamAuditAction.GROUP_CREATED,
      targetType: 'Group',
      targetId: customersGroup._id.toString(),
      targetName: customersGroup.name,
      summary: `Created group ${customersGroup.name}`,
      after: { name: customersGroup.name, memberCount: 1 },
    },
    {
      tenantId: demoTenant._id,
      actorId: systemAdmin._id,
      actorEmail: systemAdmin.email,
      actorType: 'user',
      action: IamAuditAction.GROUP_MEMBER_ADDED,
      targetType: 'Group',
      targetId: customersGroup._id.toString(),
      targetName: customersGroup.name,
      summary: `Added ${clientUser.email} to group ${customersGroup.name}`,
      after: { addedUser: clientUser.email },
    },
  ]);
  console.log('   ✓ IAM audit logs created');

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n📊 Seed Summary:');
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Users (4 Role Model):');
  console.log(`     IT Admin:     ${systemAdmin.email} / ${config.seed.adminPassword}`);
  console.log(`     Advisor:      ${advisor.email} / Advisor123!`);
  console.log(`     Manager:      ${managerUser.email} / Manager123!`);
  console.log(`     Customer:     ${clientUser.email} / Demo123!`);
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Tenant & Business:');
  console.log(`     Demo Tenant:  ${demoTenant.name}`);
  console.log(`     Business:     ${businessProfile.businessName}`);
  console.log(`     Cohort:       ${cohort.name}`);
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Roles:');
  console.log('     IT_ADMIN  - Full platform access, IAM management');
  console.log('     MANAGER   - Tenant operations, user invites');
  console.log('     ADVISOR   - Assigned tenants, task/doc approval');
  console.log('     CUSTOMER  - Own tenant access only');
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
