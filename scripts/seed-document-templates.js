/**
 * Seed Document Templates Script
 * Adds new document templates to an existing database without affecting other data
 * 
 * Usage: 
 *   node scripts/seed-document-templates.js
 * 
 * Environment variables required:
 *   MONGODB_URI - MongoDB connection string
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required');
  process.exit(1);
}

// Document Template Schema (inline to avoid import issues)
const mergeFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  source: { type: String, required: true, enum: ['business_profile', 'person', 'custom'] },
  sourcePath: { type: String },
  required: { type: Boolean, default: false },
  defaultValue: { type: String },
}, { _id: false });

const documentTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
  category: { type: String, required: true },
  version: { type: Number, required: true, default: 1 },
  isLatestVersion: { type: Boolean, default: true },
  previousVersionId: { type: mongoose.Schema.Types.ObjectId },
  content: { type: String, required: true },
  mergeFields: { type: [mergeFieldSchema], default: [] },
  applicableBusinessTypes: { type: [String], required: true },
  applicableStates: { type: [String] },
  applicableArchetypes: { type: [String] },
  priority: { type: String, enum: ['required', 'recommended', 'optional'], default: 'optional' },
  advisorReviewRequired: { type: Boolean, default: false },
  workflowStepKey: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const DocumentTemplate = mongoose.model('DocumentTemplate', documentTemplateSchema);

// All business types
const ALL_BUSINESS_TYPES = ['llc', 'corporation', 'sole_proprietorship', 'partnership', 'nonprofit', 'cooperative'];

// Common merge fields
const COMMON_MERGE_FIELDS = {
  businessName: { key: 'businessName', label: 'Business Name', source: 'business_profile', sourcePath: 'businessName', required: true },
  formationState: { key: 'formationState', label: 'Formation State', source: 'business_profile', sourcePath: 'formationState', required: true },
  businessAddress: { key: 'businessAddress', label: 'Business Address', source: 'business_profile', sourcePath: 'principalAddress', required: true },
  registeredAgentName: { key: 'registeredAgentName', label: 'Registered Agent Name', source: 'business_profile', sourcePath: 'registeredAgent.name', required: true },
  registeredAgentAddress: { key: 'registeredAgentAddress', label: 'Registered Agent Address', source: 'business_profile', sourcePath: 'registeredAgent.address', required: true },
  memberName: { key: 'memberName', label: 'Member Name', source: 'person', sourcePath: 'fullName', required: true },
  signatoryName: { key: 'signatoryName', label: 'Signatory Name', source: 'person', sourcePath: 'fullName', required: true },
  signatoryTitle: { key: 'signatoryTitle', label: 'Signatory Title', source: 'person', sourcePath: 'title', required: false, defaultValue: 'Member' },
  date: { key: 'date', label: 'Date', source: 'custom', required: true },
  effectiveDate: { key: 'effectiveDate', label: 'Effective Date', source: 'custom', required: true },
  year: { key: 'year', label: 'Year', source: 'custom', required: true },
  ein: { key: 'ein', label: 'EIN', source: 'business_profile', sourcePath: 'ein', required: false },
};

// Template definitions
const NEW_TEMPLATES = [
  // =================== FORMATION ===================
  {
    name: 'Registered Agent Consent',
    description: 'Written consent form for the registered agent accepting appointment to receive service of process.',
    type: 'registered_agent_consent',
    category: 'formation',
    content: `REGISTERED AGENT CONSENT TO APPOINTMENT

I, {{registeredAgentName}}, hereby consent to serve as the Registered Agent in the State of {{formationState}} for:

Company Name: {{businessName}}

Registered Office Address:
{{registeredAgentAddress}}

As Registered Agent, I acknowledge and agree to:

1. Maintain a registered office at the address stated above during normal business hours;
2. Accept service of process on behalf of the Company;
3. Forward all legal documents, correspondence, and notices received on behalf of the Company to the Company's principal place of business;
4. Notify the Company immediately of any service of process or legal notices received;
5. Notify the Secretary of State of any change in the registered office address prior to or within the time required by law;
6. Remain available during normal business hours to accept service of process;
7. Maintain records of all documents received in my capacity as Registered Agent.

I certify under penalty of perjury that I am at least 18 years of age and a resident of the State of {{formationState}} (if individual) or authorized to transact business in the State of {{formationState}} (if business entity).


_______________________________
{{registeredAgentName}}
Registered Agent

Date: {{date}}


ACCEPTED BY:

_______________________________
{{signatoryName}}, {{signatoryTitle}}
On behalf of {{businessName}}

Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.registeredAgentName,
      COMMON_MERGE_FIELDS.registeredAgentAddress,
      COMMON_MERGE_FIELDS.businessName,
      COMMON_MERGE_FIELDS.formationState,
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.signatoryTitle,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'recommended',
    advisorReviewRequired: false,
    workflowStepKey: 'entity_setup',
  },
  {
    name: 'Initial Member Resolution',
    description: 'Resolution documenting initial organizational actions taken by LLC members upon formation.',
    type: 'initial_member_resolution',
    category: 'formation',
    content: `INITIAL RESOLUTION OF THE MEMBER(S)
OF
{{businessName}}

A {{formationState}} Limited Liability Company

The undersigned, being all of the Members of {{businessName}} (the "Company"), hereby adopt the following resolutions effective as of {{effectiveDate}}:

FORMATION

RESOLVED, that the filing of the Articles of Organization with the Secretary of State of {{formationState}} and the formation of the Company are hereby ratified and approved.

OPERATING AGREEMENT

RESOLVED, that the Operating Agreement, in the form presented to and reviewed by the Members, is hereby adopted as the governing document of the Company.

REGISTERED AGENT

RESOLVED, that {{registeredAgentName}}, located at {{registeredAgentAddress}}, is hereby appointed as the Registered Agent of the Company for service of process in the State of {{formationState}}.

PRINCIPAL OFFICE

RESOLVED, that the principal office of the Company shall be located at:
{{businessAddress}}

FISCAL YEAR

RESOLVED, that the fiscal year of the Company shall be the calendar year ending December 31.

MANAGEMENT

RESOLVED, that the Company shall be managed by its Member(s) in accordance with the Operating Agreement.

BANK ACCOUNTS

RESOLVED, that the Company is authorized to open bank accounts at such financial institutions as the Members may select, and the following individuals are authorized signatories on all Company bank accounts:
{{authorizedSigners}}

TAX ELECTIONS

RESOLVED, that the Company shall be treated as a disregarded entity (if single-member) or as a partnership (if multi-member) for federal income tax purposes, unless the Members elect otherwise.

EMPLOYER IDENTIFICATION NUMBER

RESOLVED, that the Company is authorized to apply for an Employer Identification Number (EIN) from the Internal Revenue Service.

ORGANIZATIONAL EXPENSES

RESOLVED, that the Company is authorized to pay all expenses incurred in connection with the organization of the Company, including but not limited to filing fees, legal fees, and accounting fees.

GENERAL AUTHORITY

RESOLVED, that the Members are authorized to take any and all actions necessary or appropriate to carry out the purposes of the Company.

IN WITNESS WHEREOF, the undersigned Member(s) have executed this Resolution as of the date first written above.


MEMBER(S):

_______________________________
{{memberName}}
Member

Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      COMMON_MERGE_FIELDS.formationState,
      COMMON_MERGE_FIELDS.effectiveDate,
      COMMON_MERGE_FIELDS.registeredAgentName,
      COMMON_MERGE_FIELDS.registeredAgentAddress,
      COMMON_MERGE_FIELDS.businessAddress,
      { key: 'authorizedSigners', label: 'Authorized Signers', source: 'custom', required: true },
      COMMON_MERGE_FIELDS.memberName,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ['llc'],
    priority: 'required',
    advisorReviewRequired: true,
    workflowStepKey: 'initial_actions',
  },
  {
    name: 'Business Address Affidavit',
    description: 'Affidavit confirming the principal place of business address for company records.',
    type: 'business_address_affidavit',
    category: 'formation',
    content: `BUSINESS ADDRESS AFFIDAVIT

STATE OF {{formationState}}
COUNTY OF _____________________

I, {{signatoryName}}, being duly sworn, do hereby state and affirm as follows:

1. I am a {{signatoryTitle}} of {{businessName}} (the "Company"), a {{formationState}} Limited Liability Company.

2. I am authorized to make this affidavit on behalf of the Company.

3. The principal place of business of the Company is located at:
   {{businessAddress}}

4. This address:
   [ ] Is a commercial/business location
   [ ] Is a home-based business location
   [ ] Is a virtual/registered agent office

5. The Company has the legal right to conduct business at this location.

6. To the best of my knowledge, the business activities of the Company are permitted at this location under applicable zoning and land use regulations.

7. I will notify the appropriate state and local authorities of any change in the principal place of business within the time required by law.

I declare under penalty of perjury that the foregoing is true and correct.


_______________________________
{{signatoryName}}
{{signatoryTitle}}

Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.formationState,
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.signatoryTitle,
      COMMON_MERGE_FIELDS.businessName,
      COMMON_MERGE_FIELDS.businessAddress,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'recommended',
    advisorReviewRequired: false,
    workflowStepKey: 'business_readiness',
  },

  // =================== GOVERNANCE ===================
  {
    name: 'Banking Resolution',
    description: 'Resolution authorizing the opening of bank accounts and designating authorized signatories.',
    type: 'banking_resolution',
    category: 'governance',
    content: `BANKING RESOLUTION
OF
{{businessName}}

A {{formationState}} Limited Liability Company

The undersigned, being all of the Members of {{businessName}} (the "Company"), hereby adopt the following resolution:

RESOLVED, that the Company is hereby authorized to open and maintain one or more checking, savings, money market, and/or other deposit accounts at such banks and financial institutions as the Members may select from time to time.

FURTHER RESOLVED, that the following individuals are hereby authorized to:
- Open accounts in the name of the Company
- Deposit funds in the name of the Company
- Withdraw funds from Company accounts
- Sign checks, drafts, and other instruments
- Execute wire transfers and ACH transactions
- Access online banking services
- Order checks and deposit slips
- Stop payment on checks
- Reconcile and close accounts

AUTHORIZED SIGNATORIES:

Name: {{authorizedSigner1Name}}
Title: {{authorizedSigner1Title}}

Name: {{authorizedSigner2Name}}
Title: {{authorizedSigner2Title}}

RESOLVED, that any bank or financial institution may rely on this resolution until it receives written notice of revocation or amendment.

IN WITNESS WHEREOF, the undersigned have executed this Banking Resolution as of {{date}}.


MEMBER(S):

_______________________________
{{memberName}}
Member

EIN: {{ein}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      COMMON_MERGE_FIELDS.formationState,
      { key: 'authorizedSigner1Name', label: 'First Authorized Signer Name', source: 'person', sourcePath: 'fullName', required: true },
      { key: 'authorizedSigner1Title', label: 'First Authorized Signer Title', source: 'person', sourcePath: 'title', required: false, defaultValue: 'Member' },
      { key: 'authorizedSigner2Name', label: 'Second Authorized Signer Name', source: 'custom', required: false },
      { key: 'authorizedSigner2Title', label: 'Second Authorized Signer Title', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.memberName,
      COMMON_MERGE_FIELDS.ein,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'recommended',
    advisorReviewRequired: false,
    workflowStepKey: 'initial_actions',
  },
  {
    name: 'Conflict of Interest Policy',
    description: 'Policy establishing procedures for identifying and managing conflicts of interest.',
    type: 'conflict_of_interest_policy',
    category: 'governance',
    content: `CONFLICT OF INTEREST POLICY

{{businessName}}
Effective Date: {{effectiveDate}}

ARTICLE I - PURPOSE

The purpose of this Conflict of Interest Policy is to protect the interests of {{businessName}} (the "Company") when it is contemplating entering into a transaction or arrangement that might benefit the private interest of a member, officer, or other interested person.

ARTICLE II - DEFINITIONS

2.1 Interested Person
Any member, officer, manager, or key employee who has a direct or indirect financial interest, as defined below, is an interested person.

2.2 Financial Interest
A person has a financial interest if the person has, directly or indirectly:
a) An ownership or investment interest in any entity with which the Company has a transaction or arrangement;
b) A compensation arrangement with the Company or with any entity with which the Company has a transaction or arrangement; or
c) A potential ownership or investment interest in, or compensation arrangement with, any entity with which the Company is negotiating a transaction or arrangement.

ARTICLE III - PROCEDURES

3.1 Duty to Disclose
Any interested person must disclose the existence of any financial interest and be given the opportunity to disclose all material facts to the Members.

3.2 Determining Whether a Conflict Exists
After disclosure of the financial interest and all material facts, and after any discussion with the interested person, the interested person shall leave the meeting while the remaining Members determine whether a conflict of interest exists.

3.3 Procedures for Addressing the Conflict
a) The interested person may make a presentation, but shall leave the meeting during discussion and voting on the transaction.
b) The Members shall investigate alternatives that do not give rise to a conflict.
c) After exercising due diligence, the Members shall determine whether the Company can obtain a more advantageous transaction from another party.
d) If a more advantageous transaction is not reasonably possible, the Members shall determine by majority vote whether the transaction is in the Company's best interest and whether it is fair and reasonable.

ARTICLE IV - RECORDS

The minutes of meetings shall contain:
a) The names of persons who disclosed conflicts;
b) The nature of the conflicts;
c) Actions taken to determine whether conflicts exist;
d) Names of persons present for discussions and votes; and
e) The content of discussions and record of votes.

ARTICLE V - ANNUAL STATEMENTS

Each interested person shall annually sign a statement affirming that they:
a) Have received a copy of this policy;
b) Have read and understand the policy;
c) Have agreed to comply with the policy.

Adopted by the Members on {{date}}.


_______________________________
{{signatoryName}}, {{signatoryTitle}}

Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      COMMON_MERGE_FIELDS.effectiveDate,
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.signatoryTitle,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'recommended',
    advisorReviewRequired: true,
  },

  // =================== FINANCIAL ===================
  {
    name: 'EIN Confirmation Record',
    description: 'Internal record documenting the Employer Identification Number received from the IRS.',
    type: 'ein_confirmation_record',
    category: 'financial',
    content: `EMPLOYER IDENTIFICATION NUMBER (EIN) CONFIRMATION RECORD

{{businessName}}

This document serves as the official internal record of the Employer Identification Number (EIN) assigned to {{businessName}} by the Internal Revenue Service.

COMPANY INFORMATION:

Legal Name: {{businessName}}
Business Type: {{businessType}}
State of Formation: {{formationState}}
Principal Address: {{businessAddress}}

EIN DETAILS:

EIN: {{ein}}
Date Assigned: {{einAssignedDate}}
Application Method: [ ] Online  [ ] Fax  [ ] Mail  [ ] Phone

RESPONSIBLE PARTY INFORMATION:

Name: {{responsiblePartyName}}
Title: {{responsiblePartyTitle}}

IMPORTANT NOTICES:

1. This EIN is to be used for all federal tax filings, employment tax deposits, and business banking.
2. The EIN should be safeguarded as confidential business information.
3. The IRS should be notified of any changes to the responsible party or business address.
4. This EIN does not expire and will remain valid unless the business structure changes significantly.

DOCUMENT RETENTION:

This record should be retained permanently as part of the Company's permanent business records.

Record Created: {{date}}
Created By: {{signatoryName}}


_______________________________
{{signatoryName}}, {{signatoryTitle}}

Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      { key: 'businessType', label: 'Business Type', source: 'business_profile', sourcePath: 'businessType', required: true },
      COMMON_MERGE_FIELDS.formationState,
      COMMON_MERGE_FIELDS.businessAddress,
      COMMON_MERGE_FIELDS.ein,
      { key: 'einAssignedDate', label: 'EIN Assigned Date', source: 'custom', required: true },
      { key: 'responsiblePartyName', label: 'Responsible Party Name', source: 'person', sourcePath: 'fullName', required: true },
      { key: 'responsiblePartyTitle', label: 'Responsible Party Title', source: 'person', sourcePath: 'title', required: false },
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.signatoryTitle,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'required',
    advisorReviewRequired: false,
    workflowStepKey: 'federal_setup',
  },
  {
    name: 'Capital Contribution Record',
    description: 'Record of capital contributions made by members to the company.',
    type: 'capital_contribution_record',
    category: 'financial',
    content: `CAPITAL CONTRIBUTION RECORD

{{businessName}}
A {{formationState}} Limited Liability Company

This document records the capital contributions made by the members of {{businessName}}.

INITIAL CAPITAL CONTRIBUTIONS

Member: {{memberName}}
Date of Contribution: {{contributionDate}}

Cash Contributions:
- Amount: ${{cashAmount}}
- Payment Method: {{paymentMethod}}

Property Contributions:
- Description: {{propertyDescription}}
- Fair Market Value: ${{propertyFMV}}
- Valuation Method: {{valuationMethod}}

Services Contributions (if permitted by Operating Agreement):
- Description: {{servicesDescription}}
- Agreed Value: ${{servicesValue}}

TOTAL CONTRIBUTION: ${{totalContribution}}

OWNERSHIP INTEREST

Based on the contribution above, {{memberName}} holds:
- Ownership Percentage: {{ownershipPercentage}}%
- Capital Account Balance: ${{capitalAccountBalance}}
- Voting Rights: {{votingRights}}

ACKNOWLEDGMENT

The undersigned member acknowledges that:
1. The contribution has been made in accordance with the Operating Agreement;
2. The valuation of non-cash contributions is accurate and agreed upon;
3. No return of capital is guaranteed except as provided in the Operating Agreement.


MEMBER:

_______________________________
{{memberName}}
Date: {{date}}


ACKNOWLEDGED BY COMPANY:

_______________________________
{{signatoryName}}, {{signatoryTitle}}
Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      COMMON_MERGE_FIELDS.formationState,
      COMMON_MERGE_FIELDS.memberName,
      { key: 'contributionDate', label: 'Contribution Date', source: 'custom', required: true },
      { key: 'cashAmount', label: 'Cash Amount', source: 'custom', required: false, defaultValue: '0.00' },
      { key: 'paymentMethod', label: 'Payment Method', source: 'custom', required: false, defaultValue: 'Check/Wire' },
      { key: 'propertyDescription', label: 'Property Description', source: 'custom', required: false, defaultValue: 'N/A' },
      { key: 'propertyFMV', label: 'Property Fair Market Value', source: 'custom', required: false, defaultValue: '0.00' },
      { key: 'valuationMethod', label: 'Valuation Method', source: 'custom', required: false },
      { key: 'servicesDescription', label: 'Services Description', source: 'custom', required: false, defaultValue: 'N/A' },
      { key: 'servicesValue', label: 'Services Value', source: 'custom', required: false, defaultValue: '0.00' },
      { key: 'totalContribution', label: 'Total Contribution', source: 'custom', required: true },
      { key: 'ownershipPercentage', label: 'Ownership Percentage', source: 'custom', required: true, defaultValue: '100' },
      { key: 'capitalAccountBalance', label: 'Capital Account Balance', source: 'custom', required: false },
      { key: 'votingRights', label: 'Voting Rights', source: 'custom', required: false, defaultValue: 'Pro rata with ownership' },
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.signatoryTitle,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ['llc', 'partnership', 'corporation'],
    priority: 'recommended',
    advisorReviewRequired: true,
    workflowStepKey: 'ownership_setup',
  },

  // =================== OPERATIONS ===================
  {
    name: 'Business Process Inventory',
    description: 'Comprehensive inventory of all business processes for documentation and improvement initiatives.',
    type: 'business_process_inventory',
    category: 'operations',
    content: `BUSINESS PROCESS INVENTORY

{{businessName}}
Last Updated: {{date}}

1. OVERVIEW

This document provides a comprehensive inventory of business processes for {{businessName}}. 
It serves as the foundation for:
- Standard Operating Procedures (SOPs)
- Process improvement initiatives
- Training and onboarding
- Compliance documentation

2. PROCESS CATEGORIES

CATEGORY              | PROCESS NAME           | OWNER      | STATUS
─────────────────────────────────────────────────────────────────────
OPERATIONS            |                        |            |
                      | {{process1Name}}       | {{p1Owner}}| {{p1Status}}
                      | {{process2Name}}       | {{p2Owner}}| {{p2Status}}
                      | {{process3Name}}       | {{p3Owner}}| {{p3Status}}
─────────────────────────────────────────────────────────────────────
FINANCE               |                        |            |
                      | Invoicing              |            |
                      | Accounts Receivable    |            |
                      | Accounts Payable       |            |
─────────────────────────────────────────────────────────────────────
SALES & MARKETING     |                        |            |
                      | Lead Generation        |            |
                      | Customer Intake        |            |
                      | Proposal Development   |            |
─────────────────────────────────────────────────────────────────────
COMPLIANCE            |                        |            |
                      | License Renewals       |            |
                      | Tax Filings            |            |
                      | Annual Report Filing   |            |

3. PROCESS STATUS DEFINITIONS

- DOCUMENTED: SOP exists and is current
- NEEDS UPDATE: SOP exists but requires revision
- UNDOCUMENTED: Process exists but no SOP
- IN DEVELOPMENT: SOP being created
- N/A: Not applicable to this business

4. PRIORITY PROCESSES FOR SOP DEVELOPMENT

Based on business impact and frequency:
1. {{priorityProcess1}}
2. {{priorityProcess2}}
3. {{priorityProcess3}}

5. REVIEW SCHEDULE

This inventory will be reviewed: {{reviewFrequency}}
Next review date: {{nextReviewDate}}

Prepared by: {{signatoryName}}
Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      { key: 'process1Name', label: 'Process 1 Name', source: 'custom', required: false },
      { key: 'p1Owner', label: 'Process 1 Owner', source: 'custom', required: false },
      { key: 'p1Status', label: 'Process 1 Status', source: 'custom', required: false },
      { key: 'process2Name', label: 'Process 2 Name', source: 'custom', required: false },
      { key: 'p2Owner', label: 'Process 2 Owner', source: 'custom', required: false },
      { key: 'p2Status', label: 'Process 2 Status', source: 'custom', required: false },
      { key: 'process3Name', label: 'Process 3 Name', source: 'custom', required: false },
      { key: 'p3Owner', label: 'Process 3 Owner', source: 'custom', required: false },
      { key: 'p3Status', label: 'Process 3 Status', source: 'custom', required: false },
      { key: 'priorityProcess1', label: 'Priority Process 1', source: 'custom', required: false },
      { key: 'priorityProcess2', label: 'Priority Process 2', source: 'custom', required: false },
      { key: 'priorityProcess3', label: 'Priority Process 3', source: 'custom', required: false },
      { key: 'reviewFrequency', label: 'Review Frequency', source: 'custom', required: false, defaultValue: 'Quarterly' },
      { key: 'nextReviewDate', label: 'Next Review Date', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'required',
    advisorReviewRequired: false,
  },
  {
    name: 'Standard Operating Procedure (SOP) Template',
    description: 'Template for creating standardized operating procedures for any business process.',
    type: 'sop_template',
    category: 'operations',
    content: `STANDARD OPERATING PROCEDURE

{{businessName}}

SOP NUMBER: {{sopNumber}}
SOP TITLE: {{sopTitle}}
EFFECTIVE DATE: {{effectiveDate}}
VERSION: {{sopVersion}}

1. PURPOSE
{{sopPurpose}}

2. SCOPE
This procedure applies to: {{sopScope}}

3. RESPONSIBILITIES

Role: {{responsibleRole}}
Responsibilities:
{{roleResponsibilities}}

4. DEFINITIONS

{{definitions}}

5. EQUIPMENT/MATERIALS REQUIRED

{{equipmentRequired}}

6. PROCEDURE

Step 1: {{step1}}
Step 2: {{step2}}
Step 3: {{step3}}
Step 4: {{step4}}
Step 5: {{step5}}

7. QUALITY CHECKS

□ {{qualityCheck1}}
□ {{qualityCheck2}}
□ {{qualityCheck3}}

8. SAFETY CONSIDERATIONS

{{safetyConsiderations}}

9. TROUBLESHOOTING

Issue: {{issue1}}
Resolution: {{resolution1}}

Issue: {{issue2}}
Resolution: {{resolution2}}

10. RELATED DOCUMENTS

{{relatedDocuments}}

11. REVISION HISTORY

Version | Date | Author | Changes
{{sopVersion}} | {{effectiveDate}} | {{authorName}} | Initial Release

12. APPROVALS

Prepared By: {{authorName}}
Date: {{date}}

Approved By: {{approverName}}
Date: _______________`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      { key: 'sopNumber', label: 'SOP Number', source: 'custom', required: true },
      { key: 'sopTitle', label: 'SOP Title', source: 'custom', required: true },
      COMMON_MERGE_FIELDS.effectiveDate,
      { key: 'sopVersion', label: 'Version', source: 'custom', required: true, defaultValue: '1.0' },
      { key: 'sopPurpose', label: 'Purpose', source: 'custom', required: true },
      { key: 'sopScope', label: 'Scope', source: 'custom', required: true },
      { key: 'responsibleRole', label: 'Responsible Role', source: 'custom', required: true },
      { key: 'roleResponsibilities', label: 'Role Responsibilities', source: 'custom', required: false },
      { key: 'definitions', label: 'Definitions', source: 'custom', required: false, defaultValue: 'N/A' },
      { key: 'equipmentRequired', label: 'Equipment Required', source: 'custom', required: false, defaultValue: 'N/A' },
      { key: 'step1', label: 'Step 1', source: 'custom', required: true },
      { key: 'step2', label: 'Step 2', source: 'custom', required: false },
      { key: 'step3', label: 'Step 3', source: 'custom', required: false },
      { key: 'step4', label: 'Step 4', source: 'custom', required: false },
      { key: 'step5', label: 'Step 5', source: 'custom', required: false },
      { key: 'qualityCheck1', label: 'Quality Check 1', source: 'custom', required: false },
      { key: 'qualityCheck2', label: 'Quality Check 2', source: 'custom', required: false },
      { key: 'qualityCheck3', label: 'Quality Check 3', source: 'custom', required: false },
      { key: 'safetyConsiderations', label: 'Safety Considerations', source: 'custom', required: false, defaultValue: 'Follow standard safety protocols' },
      { key: 'issue1', label: 'Issue 1', source: 'custom', required: false },
      { key: 'resolution1', label: 'Resolution 1', source: 'custom', required: false },
      { key: 'issue2', label: 'Issue 2', source: 'custom', required: false },
      { key: 'resolution2', label: 'Resolution 2', source: 'custom', required: false },
      { key: 'relatedDocuments', label: 'Related Documents', source: 'custom', required: false, defaultValue: 'None' },
      { key: 'authorName', label: 'Author Name', source: 'person', sourcePath: 'fullName', required: true },
      { key: 'approverName', label: 'Approver Name', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'recommended',
    advisorReviewRequired: false,
  },

  // =================== COMPLIANCE ===================
  {
    name: 'Annual Compliance Calendar',
    description: 'Calendar tracking all compliance deadlines, renewals, and regulatory requirements.',
    type: 'annual_compliance_calendar',
    category: 'compliance',
    content: `ANNUAL COMPLIANCE CALENDAR

{{businessName}}
Year: {{year}}

This calendar tracks all compliance deadlines and regulatory requirements for {{businessName}}.

═══════════════════════════════════════════════════════════════════════════════
JANUARY
───────────────────────────────────────────────────────────────────────────────
[ ] 15th - Quarterly estimated tax payment (Q4 prior year)
[ ] 31st - W-2 and 1099 forms distributed to recipients
[ ] 31st - Annual inventory (if applicable)

═══════════════════════════════════════════════════════════════════════════════
FEBRUARY
───────────────────────────────────────────────────────────────────────────────
[ ] 28th - W-2 and 1099 forms filed with IRS/SSA

═══════════════════════════════════════════════════════════════════════════════
MARCH
───────────────────────────────────────────────────────────────────────────────
[ ] 15th - S-Corp/Partnership tax returns due (Form 1120-S/1065)
[ ] 15th - Issue K-1s to partners/shareholders

═══════════════════════════════════════════════════════════════════════════════
APRIL
───────────────────────────────────────────────────────────────────────────────
[ ] 15th - Individual tax returns due (if sole proprietor)
[ ] 15th - Q1 estimated tax payment
[ ] {{stateFiling}} - State annual report due ({{formationState}})

═══════════════════════════════════════════════════════════════════════════════
JUNE
───────────────────────────────────────────────────────────────────────────────
[ ] 15th - Q2 estimated tax payment
[ ] Mid-year financial review

═══════════════════════════════════════════════════════════════════════════════
SEPTEMBER
───────────────────────────────────────────────────────────────────────────────
[ ] 15th - Q3 estimated tax payment
[ ] 15th - Extended S-Corp/Partnership returns due

═══════════════════════════════════════════════════════════════════════════════
OCTOBER
───────────────────────────────────────────────────────────────────────────────
[ ] 15th - Extended individual returns due
[ ] Open enrollment for health insurance

═══════════════════════════════════════════════════════════════════════════════
DECEMBER
───────────────────────────────────────────────────────────────────────────────
[ ] Year-end closing procedures
[ ] Retirement plan contributions
[ ] Equipment purchases for tax deductions

═══════════════════════════════════════════════════════════════════════════════
CUSTOM DEADLINES FOR {{businessName}}
───────────────────────────────────────────────────────────────────────────────
{{customDeadline1}}
{{customDeadline2}}
{{customDeadline3}}

═══════════════════════════════════════════════════════════════════════════════

IMPORTANT CONTACTS:
- CPA/Tax Preparer: {{cpaName}}
- Registered Agent: {{registeredAgentName}}
- Insurance Agent: {{insuranceAgent}}
- Attorney: {{attorneyName}}

Last Updated: {{date}}
Prepared By: {{signatoryName}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      COMMON_MERGE_FIELDS.year,
      COMMON_MERGE_FIELDS.formationState,
      { key: 'stateFiling', label: 'State Filing Date', source: 'custom', required: false, defaultValue: 'Varies by state' },
      { key: 'customDeadline1', label: 'Custom Deadline 1', source: 'custom', required: false },
      { key: 'customDeadline2', label: 'Custom Deadline 2', source: 'custom', required: false },
      { key: 'customDeadline3', label: 'Custom Deadline 3', source: 'custom', required: false },
      { key: 'cpaName', label: 'CPA Name', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.registeredAgentName,
      { key: 'insuranceAgent', label: 'Insurance Agent', source: 'custom', required: false },
      { key: 'attorneyName', label: 'Attorney Name', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'required',
    advisorReviewRequired: false,
    workflowStepKey: 'final_review',
  },
  {
    name: 'Internal Controls Checklist',
    description: 'Checklist for establishing and reviewing internal controls for financial and operational integrity.',
    type: 'internal_controls_checklist',
    category: 'compliance',
    content: `INTERNAL CONTROLS CHECKLIST

{{businessName}}
Assessment Date: {{date}}
Assessed By: {{signatoryName}}

This checklist evaluates the adequacy of internal controls to prevent fraud, errors, and ensure compliance.

═══════════════════════════════════════════════════════════════════════════════
1. CASH AND BANKING CONTROLS
───────────────────────────────────────────────────────────────────────────────
[ ] Bank accounts are reconciled monthly
[ ] Bank statements are reviewed by someone other than the bookkeeper
[ ] Dual signatures required for checks over ${{dualSignatureThreshold}}
[ ] Petty cash is maintained with proper documentation
[ ] Cash receipts are deposited timely
[ ] Voided checks are retained and accounted for
[ ] Online banking access is restricted and monitored

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

═══════════════════════════════════════════════════════════════════════════════
2. ACCOUNTS PAYABLE CONTROLS
───────────────────────────────────────────────────────────────────────────────
[ ] Purchase orders are required for expenses over ${{poThreshold}}
[ ] Three-way match (PO, receipt, invoice) is performed
[ ] Invoices are reviewed and approved before payment
[ ] Vendor master file changes require approval
[ ] Duplicate payment controls are in place
[ ] Expense reports are reviewed and approved

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

═══════════════════════════════════════════════════════════════════════════════
3. ACCOUNTS RECEIVABLE CONTROLS
───────────────────────────────────────────────────────────────────────────────
[ ] Customer credit is approved before extending terms
[ ] Invoices are issued promptly
[ ] Aging reports are reviewed regularly
[ ] Write-offs are approved by management
[ ] Cash receipts are properly applied

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

═══════════════════════════════════════════════════════════════════════════════
4. INFORMATION TECHNOLOGY CONTROLS
───────────────────────────────────────────────────────────────────────────────
[ ] User access is restricted based on job function
[ ] Passwords are strong and changed regularly
[ ] Data is backed up regularly
[ ] Backup restoration is tested periodically
[ ] Antivirus/malware protection is current
[ ] Software is updated and patched
[ ] Terminated employee access is removed promptly

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

═══════════════════════════════════════════════════════════════════════════════
5. SEGREGATION OF DUTIES
───────────────────────────────────────────────────────────────────────────────
[ ] No single person controls a transaction from start to finish
[ ] Reconciliation is performed by someone other than processor
[ ] Access to assets is separate from record-keeping
[ ] Authorization, custody, and recording are separate

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

═══════════════════════════════════════════════════════════════════════════════
OVERALL ASSESSMENT
───────────────────────────────────────────────────────────────────────────────
Overall Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

Priority Action Items:
1. {{actionItem1}}
2. {{actionItem2}}
3. {{actionItem3}}

Next Review Date: {{nextReviewDate}}

Assessed By: {{signatoryName}}
Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      { key: 'dualSignatureThreshold', label: 'Dual Signature Threshold', source: 'custom', required: false, defaultValue: '5,000' },
      { key: 'poThreshold', label: 'PO Threshold', source: 'custom', required: false, defaultValue: '500' },
      { key: 'actionItem1', label: 'Action Item 1', source: 'custom', required: false },
      { key: 'actionItem2', label: 'Action Item 2', source: 'custom', required: false },
      { key: 'actionItem3', label: 'Action Item 3', source: 'custom', required: false },
      { key: 'nextReviewDate', label: 'Next Review Date', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'recommended',
    advisorReviewRequired: true,
  },

  // =================== IMPROVEMENT ===================
  {
    name: 'SIPOC Diagram',
    description: 'Suppliers, Inputs, Process, Outputs, Customers diagram for process mapping and improvement.',
    type: 'sipoc_diagram',
    category: 'improvement',
    content: `SIPOC DIAGRAM

{{businessName}}
Process Name: {{processName}}
Date: {{date}}
Prepared By: {{signatoryName}}

SIPOC (Suppliers, Inputs, Process, Outputs, Customers) is a high-level process map used to identify all relevant elements of a process improvement project.

═══════════════════════════════════════════════════════════════════════════════
PROCESS OVERVIEW
───────────────────────────────────────────────────────────────────────────────
Process Name: {{processName}}
Process Owner: {{processOwner}}
Process Purpose: {{processPurpose}}

Start Point: {{processStart}}
End Point: {{processEnd}}

═══════════════════════════════════════════════════════════════════════════════
S - SUPPLIERS
Who provides inputs to this process?
───────────────────────────────────────────────────────────────────────────────
1. {{supplier1}}
2. {{supplier2}}
3. {{supplier3}}

═══════════════════════════════════════════════════════════════════════════════
I - INPUTS
What inputs are required for this process?
───────────────────────────────────────────────────────────────────────────────
1. {{input1}}
2. {{input2}}
3. {{input3}}

═══════════════════════════════════════════════════════════════════════════════
P - PROCESS (High-Level Steps)
What are the major steps in this process?
───────────────────────────────────────────────────────────────────────────────
Step 1: {{step1}}
Step 2: {{step2}}
Step 3: {{step3}}
Step 4: {{step4}}
Step 5: {{step5}}

═══════════════════════════════════════════════════════════════════════════════
O - OUTPUTS
What outputs does this process produce?
───────────────────────────────────────────────────────────────────────────────
1. {{output1}}
2. {{output2}}
3. {{output3}}

═══════════════════════════════════════════════════════════════════════════════
C - CUSTOMERS
Who receives the outputs of this process?
───────────────────────────────────────────────────────────────────────────────
1. {{customer1}}
2. {{customer2}}
3. {{customer3}}

═══════════════════════════════════════════════════════════════════════════════
KEY METRICS
───────────────────────────────────────────────────────────────────────────────
Metric 1: {{metric1}} | Target: {{target1}}
Metric 2: {{metric2}} | Target: {{target2}}
Metric 3: {{metric3}} | Target: {{target3}}

═══════════════════════════════════════════════════════════════════════════════

Prepared By: {{signatoryName}}
Date: {{date}}`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      { key: 'processName', label: 'Process Name', source: 'custom', required: true },
      { key: 'processOwner', label: 'Process Owner', source: 'custom', required: true },
      { key: 'processPurpose', label: 'Process Purpose', source: 'custom', required: true },
      { key: 'processStart', label: 'Process Start', source: 'custom', required: true },
      { key: 'processEnd', label: 'Process End', source: 'custom', required: true },
      { key: 'supplier1', label: 'Supplier 1', source: 'custom', required: false },
      { key: 'supplier2', label: 'Supplier 2', source: 'custom', required: false },
      { key: 'supplier3', label: 'Supplier 3', source: 'custom', required: false },
      { key: 'input1', label: 'Input 1', source: 'custom', required: false },
      { key: 'input2', label: 'Input 2', source: 'custom', required: false },
      { key: 'input3', label: 'Input 3', source: 'custom', required: false },
      { key: 'step1', label: 'Step 1', source: 'custom', required: true },
      { key: 'step2', label: 'Step 2', source: 'custom', required: false },
      { key: 'step3', label: 'Step 3', source: 'custom', required: false },
      { key: 'step4', label: 'Step 4', source: 'custom', required: false },
      { key: 'step5', label: 'Step 5', source: 'custom', required: false },
      { key: 'output1', label: 'Output 1', source: 'custom', required: false },
      { key: 'output2', label: 'Output 2', source: 'custom', required: false },
      { key: 'output3', label: 'Output 3', source: 'custom', required: false },
      { key: 'customer1', label: 'Customer 1', source: 'custom', required: false },
      { key: 'customer2', label: 'Customer 2', source: 'custom', required: false },
      { key: 'customer3', label: 'Customer 3', source: 'custom', required: false },
      { key: 'metric1', label: 'Metric 1', source: 'custom', required: false },
      { key: 'target1', label: 'Target 1', source: 'custom', required: false },
      { key: 'metric2', label: 'Metric 2', source: 'custom', required: false },
      { key: 'target2', label: 'Target 2', source: 'custom', required: false },
      { key: 'metric3', label: 'Metric 3', source: 'custom', required: false },
      { key: 'target3', label: 'Target 3', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'optional',
    advisorReviewRequired: false,
  },
  {
    name: 'DMAIC Project Charter',
    description: 'Project charter template for Lean Six Sigma DMAIC improvement projects.',
    type: 'dmaic_project_charter',
    category: 'improvement',
    content: `DMAIC PROJECT CHARTER

{{businessName}}
Project Name: {{projectName}}
Charter Date: {{date}}

═══════════════════════════════════════════════════════════════════════════════
PROJECT IDENTIFICATION
───────────────────────────────────────────────────────────────────────────────
Project Name: {{projectName}}
Project Leader: {{projectLeader}}
Project Sponsor: {{projectSponsor}}
Start Date: {{startDate}}
Target Completion: {{targetCompletion}}

═══════════════════════════════════════════════════════════════════════════════
BUSINESS CASE
Why is this project important?
───────────────────────────────────────────────────────────────────────────────
{{businessCase}}

═══════════════════════════════════════════════════════════════════════════════
PROBLEM STATEMENT
What is the problem we are trying to solve?
───────────────────────────────────────────────────────────────────────────────
{{problemStatement}}

Specific: {{problemSpecific}}
Measurable: {{problemMeasurable}}
When did it start: {{problemWhen}}
Where does it occur: {{problemWhere}}
Impact/Magnitude: {{problemImpact}}

═══════════════════════════════════════════════════════════════════════════════
GOAL STATEMENT
What is our measurable target?
───────────────────────────────────────────────────────────────────────────────
{{goalStatement}}

Baseline: {{baseline}}
Target: {{target}}
Improvement: {{improvementTarget}}% improvement by {{targetDate}}

═══════════════════════════════════════════════════════════════════════════════
PROJECT SCOPE
───────────────────────────────────────────────────────────────────────────────
In Scope:
{{inScope}}

Out of Scope:
{{outOfScope}}

═══════════════════════════════════════════════════════════════════════════════
ESTIMATED BENEFITS
───────────────────────────────────────────────────────────────────────────────
Financial Benefits: ${{financialBenefits}}
Type: [ ] Hard Savings  [ ] Cost Avoidance  [ ] Revenue Increase

Non-Financial Benefits:
{{nonFinancialBenefits}}

═══════════════════════════════════════════════════════════════════════════════
DMAIC PHASE MILESTONES
───────────────────────────────────────────────────────────────────────────────
Phase     | Target Date      | Status
───────────────────────────────────────────────────────────────────────────────
Define    | {{defineDate}}   | [ ]
Measure   | {{measureDate}}  | [ ]
Analyze   | {{analyzeDate}}  | [ ]
Improve   | {{improveDate}}  | [ ]
Control   | {{controlDate}}  | [ ]

═══════════════════════════════════════════════════════════════════════════════
APPROVALS
───────────────────────────────────────────────────────────────────────────────

Project Leader: {{projectLeader}}
Signature: _______________________________  Date: _______________

Project Sponsor: {{projectSponsor}}
Signature: _______________________________  Date: _______________`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      { key: 'projectName', label: 'Project Name', source: 'custom', required: true },
      { key: 'projectLeader', label: 'Project Leader', source: 'custom', required: true },
      { key: 'projectSponsor', label: 'Project Sponsor', source: 'custom', required: true },
      { key: 'startDate', label: 'Start Date', source: 'custom', required: true },
      { key: 'targetCompletion', label: 'Target Completion', source: 'custom', required: true },
      { key: 'businessCase', label: 'Business Case', source: 'custom', required: true },
      { key: 'problemStatement', label: 'Problem Statement', source: 'custom', required: true },
      { key: 'problemSpecific', label: 'Specific', source: 'custom', required: false },
      { key: 'problemMeasurable', label: 'Measurable', source: 'custom', required: false },
      { key: 'problemWhen', label: 'When', source: 'custom', required: false },
      { key: 'problemWhere', label: 'Where', source: 'custom', required: false },
      { key: 'problemImpact', label: 'Impact', source: 'custom', required: false },
      { key: 'goalStatement', label: 'Goal Statement', source: 'custom', required: true },
      { key: 'baseline', label: 'Baseline', source: 'custom', required: true },
      { key: 'target', label: 'Target', source: 'custom', required: true },
      { key: 'improvementTarget', label: 'Improvement Target %', source: 'custom', required: false },
      { key: 'targetDate', label: 'Target Date', source: 'custom', required: false },
      { key: 'inScope', label: 'In Scope', source: 'custom', required: true },
      { key: 'outOfScope', label: 'Out of Scope', source: 'custom', required: true },
      { key: 'financialBenefits', label: 'Financial Benefits', source: 'custom', required: false },
      { key: 'nonFinancialBenefits', label: 'Non-Financial Benefits', source: 'custom', required: false },
      { key: 'defineDate', label: 'Define Date', source: 'custom', required: false },
      { key: 'measureDate', label: 'Measure Date', source: 'custom', required: false },
      { key: 'analyzeDate', label: 'Analyze Date', source: 'custom', required: false },
      { key: 'improveDate', label: 'Improve Date', source: 'custom', required: false },
      { key: 'controlDate', label: 'Control Date', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'optional',
    advisorReviewRequired: true,
  },
  {
    name: 'Control Plan',
    description: 'Document to maintain process improvements and ensure sustained performance.',
    type: 'control_plan',
    category: 'improvement',
    content: `CONTROL PLAN

{{businessName}}
Process: {{processName}}
Date: {{date}}
Prepared By: {{signatoryName}}

═══════════════════════════════════════════════════════════════════════════════
CONTROL PLAN INFORMATION
───────────────────────────────────────────────────────────────────────────────
Process Name: {{processName}}
Process Owner: {{processOwner}}
Related DMAIC Project: {{dmaicProject}}
Implementation Date: {{implementationDate}}
Review Frequency: {{reviewFrequency}}

═══════════════════════════════════════════════════════════════════════════════
CONTROL POINT #1
───────────────────────────────────────────────────────────────────────────────
Process Step: {{step1Name}}
What to Control: {{step1Control}}
Specification/Target: {{step1Target}}
Measurement Method: {{step1Method}}
Frequency: {{step1Frequency}}
Who Measures: {{step1Who}}
Response Plan: {{step1Response}}

═══════════════════════════════════════════════════════════════════════════════
CONTROL POINT #2
───────────────────────────────────────────────────────────────────────────────
Process Step: {{step2Name}}
What to Control: {{step2Control}}
Specification/Target: {{step2Target}}
Measurement Method: {{step2Method}}
Frequency: {{step2Frequency}}
Who Measures: {{step2Who}}
Response Plan: {{step2Response}}

═══════════════════════════════════════════════════════════════════════════════
MONITORING DASHBOARD
───────────────────────────────────────────────────────────────────────────────
Key Metrics:

Metric              | Target    | Current   | Status
───────────────────────────────────────────────────────────────────────────────
{{metric1Name}}     | {{m1Tgt}} | {{m1Cur}} | [ ] On Track  [ ] At Risk  [ ] Off Track
{{metric2Name}}     | {{m2Tgt}} | {{m2Cur}} | [ ] On Track  [ ] At Risk  [ ] Off Track
{{metric3Name}}     | {{m3Tgt}} | {{m3Cur}} | [ ] On Track  [ ] At Risk  [ ] Off Track

═══════════════════════════════════════════════════════════════════════════════
ESCALATION PROCEDURE
───────────────────────────────────────────────────────────────────────────────
Level 1 - Immediate Response:
Action: {{level1Action}}
Owner: {{level1Owner}}

Level 2 - Management Review:
Action: {{level2Action}}
Owner: {{level2Owner}}

═══════════════════════════════════════════════════════════════════════════════
CONTROL PLAN REVIEW
───────────────────────────────────────────────────────────────────────────────
Last Review Date: {{lastReviewDate}}
Next Review Date: {{nextReviewDate}}

═══════════════════════════════════════════════════════════════════════════════

Prepared By: {{signatoryName}}
Date: {{date}}

Approved By: {{approverName}}
Date: _______________`,
    mergeFields: [
      COMMON_MERGE_FIELDS.businessName,
      { key: 'processName', label: 'Process Name', source: 'custom', required: true },
      { key: 'processOwner', label: 'Process Owner', source: 'custom', required: true },
      { key: 'dmaicProject', label: 'Related DMAIC Project', source: 'custom', required: false },
      { key: 'implementationDate', label: 'Implementation Date', source: 'custom', required: true },
      { key: 'reviewFrequency', label: 'Review Frequency', source: 'custom', required: false, defaultValue: 'Monthly' },
      { key: 'step1Name', label: 'Step 1 Name', source: 'custom', required: false },
      { key: 'step1Control', label: 'Step 1 Control', source: 'custom', required: false },
      { key: 'step1Target', label: 'Step 1 Target', source: 'custom', required: false },
      { key: 'step1Method', label: 'Step 1 Method', source: 'custom', required: false },
      { key: 'step1Frequency', label: 'Step 1 Frequency', source: 'custom', required: false },
      { key: 'step1Who', label: 'Step 1 Who', source: 'custom', required: false },
      { key: 'step1Response', label: 'Step 1 Response', source: 'custom', required: false },
      { key: 'step2Name', label: 'Step 2 Name', source: 'custom', required: false },
      { key: 'step2Control', label: 'Step 2 Control', source: 'custom', required: false },
      { key: 'step2Target', label: 'Step 2 Target', source: 'custom', required: false },
      { key: 'step2Method', label: 'Step 2 Method', source: 'custom', required: false },
      { key: 'step2Frequency', label: 'Step 2 Frequency', source: 'custom', required: false },
      { key: 'step2Who', label: 'Step 2 Who', source: 'custom', required: false },
      { key: 'step2Response', label: 'Step 2 Response', source: 'custom', required: false },
      { key: 'metric1Name', label: 'Metric 1 Name', source: 'custom', required: false },
      { key: 'm1Tgt', label: 'Metric 1 Target', source: 'custom', required: false },
      { key: 'm1Cur', label: 'Metric 1 Current', source: 'custom', required: false },
      { key: 'metric2Name', label: 'Metric 2 Name', source: 'custom', required: false },
      { key: 'm2Tgt', label: 'Metric 2 Target', source: 'custom', required: false },
      { key: 'm2Cur', label: 'Metric 2 Current', source: 'custom', required: false },
      { key: 'metric3Name', label: 'Metric 3 Name', source: 'custom', required: false },
      { key: 'm3Tgt', label: 'Metric 3 Target', source: 'custom', required: false },
      { key: 'm3Cur', label: 'Metric 3 Current', source: 'custom', required: false },
      { key: 'level1Action', label: 'Level 1 Action', source: 'custom', required: false },
      { key: 'level1Owner', label: 'Level 1 Owner', source: 'custom', required: false },
      { key: 'level2Action', label: 'Level 2 Action', source: 'custom', required: false },
      { key: 'level2Owner', label: 'Level 2 Owner', source: 'custom', required: false },
      { key: 'lastReviewDate', label: 'Last Review Date', source: 'custom', required: false },
      { key: 'nextReviewDate', label: 'Next Review Date', source: 'custom', required: false },
      { key: 'approverName', label: 'Approver Name', source: 'custom', required: false },
      COMMON_MERGE_FIELDS.signatoryName,
      COMMON_MERGE_FIELDS.date,
    ],
    applicableBusinessTypes: ALL_BUSINESS_TYPES,
    priority: 'optional',
    advisorReviewRequired: true,
  },
];

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an admin user to use as createdBy
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String,
      primaryRoles: [String],
    }));

    // Find a system admin or IT admin user
    let adminUser = await User.findOne({
      $or: [
        { role: 'system_admin' },
        { primaryRoles: 'it_admin' },
      ]
    });

    if (!adminUser) {
      // Fall back to any user
      adminUser = await User.findOne();
    }

    if (!adminUser) {
      console.error('ERROR: No users found in database. Please create a user first.');
      process.exit(1);
    }

    console.log(`Using user ${adminUser.email} as template creator`);

    // Check existing templates
    const existingTypes = await DocumentTemplate.distinct('type');
    console.log(`Found ${existingTypes.length} existing template types`);

    // Filter out templates that already exist
    const newTemplates = NEW_TEMPLATES.filter(t => !existingTypes.includes(t.type));
    console.log(`${newTemplates.length} new templates to add`);

    if (newTemplates.length === 0) {
      console.log('All templates already exist. Nothing to do.');
      process.exit(0);
    }

    // Also update existing templates to have category if missing
    const existingTemplatesWithoutCategory = await DocumentTemplate.find({ category: { $exists: false } });
    if (existingTemplatesWithoutCategory.length > 0) {
      console.log(`Updating ${existingTemplatesWithoutCategory.length} existing templates with category field...`);
      for (const template of existingTemplatesWithoutCategory) {
        template.category = 'formation'; // Default to formation for existing templates
        template.priority = template.priority || 'optional';
        template.advisorReviewRequired = template.advisorReviewRequired || false;
        await template.save();
      }
      console.log('Existing templates updated');
    }

    // Add new templates
    console.log('Adding new templates...');
    const templatesWithCreator = newTemplates.map(t => ({
      ...t,
      version: 1,
      isLatestVersion: true,
      isActive: true,
      createdBy: adminUser._id,
    }));

    const created = await DocumentTemplate.insertMany(templatesWithCreator);
    console.log(`Successfully created ${created.length} new templates:`);

    // Group by category for summary
    const byCategory = {};
    for (const t of created) {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    }
    for (const [category, count] of Object.entries(byCategory)) {
      console.log(`  - ${category}: ${count} templates`);
    }

    console.log('\nDocument templates seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding document templates:', error);
    process.exit(1);
  }
}

main();
