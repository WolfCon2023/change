/**
 * CHANGE Platform Document Templates
 * Comprehensive document taxonomy for Business Transformation Platform
 */

import {
  DocumentType,
  DocumentCategory,
  BusinessType,
} from '@change/shared';

// Common merge fields used across multiple templates
const COMMON_MERGE_FIELDS = {
  businessName: { key: 'businessName', label: 'Business Name', source: 'business_profile' as const, sourcePath: 'businessName', required: true },
  formationState: { key: 'formationState', label: 'Formation State', source: 'business_profile' as const, sourcePath: 'formationState', required: true },
  businessAddress: { key: 'businessAddress', label: 'Business Address', source: 'business_profile' as const, sourcePath: 'principalAddress', required: true },
  registeredAgentName: { key: 'registeredAgentName', label: 'Registered Agent Name', source: 'business_profile' as const, sourcePath: 'registeredAgent.name', required: true },
  registeredAgentAddress: { key: 'registeredAgentAddress', label: 'Registered Agent Address', source: 'business_profile' as const, sourcePath: 'registeredAgent.address', required: true },
  memberName: { key: 'memberName', label: 'Member Name', source: 'person' as const, sourcePath: 'fullName', required: true },
  signatoryName: { key: 'signatoryName', label: 'Signatory Name', source: 'person' as const, sourcePath: 'fullName', required: true },
  signatoryTitle: { key: 'signatoryTitle', label: 'Signatory Title', source: 'person' as const, sourcePath: 'title', required: false, defaultValue: 'Member' },
  date: { key: 'date', label: 'Date', source: 'custom' as const, required: true },
  effectiveDate: { key: 'effectiveDate', label: 'Effective Date', source: 'custom' as const, required: true },
  year: { key: 'year', label: 'Year', source: 'custom' as const, required: true },
  ein: { key: 'ein', label: 'EIN', source: 'business_profile' as const, sourcePath: 'ein', required: false },
  ownerNames: { key: 'ownerNames', label: 'Owner Names', source: 'custom' as const, required: false },
};

// All business types for universal documents
const ALL_BUSINESS_TYPES = Object.values(BusinessType);

export interface DocumentTemplateData {
  name: string;
  description: string;
  type: string;
  category: string;
  content: string;
  mergeFields: Array<{
    key: string;
    label: string;
    source: 'business_profile' | 'person' | 'custom';
    sourcePath?: string;
    required: boolean;
    defaultValue?: string;
  }>;
  applicableBusinessTypes: string[];
  applicableArchetypes?: string[];
  priority: 'required' | 'recommended' | 'optional';
  advisorReviewRequired: boolean;
  workflowStepKey?: string;
}

// =============================================================================
// FORMATION DOCUMENTS
// =============================================================================

export const ARTICLES_OF_ORGANIZATION_TEMPLATE: DocumentTemplateData = {
  name: 'Articles of Organization - LLC',
  description: 'Comprehensive articles of organization template for Limited Liability Companies with optional clauses for management structure, duration, and effective date.',
  type: DocumentType.ARTICLES_OF_ORGANIZATION,
  category: DocumentCategory.FORMATION,
  content: `ARTICLES OF ORGANIZATION
OF
{{businessName}}

A Limited Liability Company

ARTICLE I - NAME
The name of the Limited Liability Company is {{businessName}}.

ARTICLE II - FORMATION
The undersigned, being a natural person of at least eighteen (18) years of age, hereby establishes a Limited Liability Company pursuant to the laws of the State of {{formationState}}.

ARTICLE III - EFFECTIVE DATE
These Articles of Organization shall be effective upon filing with the Secretary of State, unless a delayed effective date is specified: {{effectiveDate}}.

ARTICLE IV - DURATION
The period of duration of the Company shall be perpetual, unless terminated earlier in accordance with the Operating Agreement or by law.

ARTICLE V - PURPOSE
The purpose of the Limited Liability Company is to engage in any lawful business activity for which limited liability companies may be organized under the laws of the State of {{formationState}}.

ARTICLE VI - REGISTERED AGENT
The name and address of the registered agent of the Limited Liability Company in the State of {{formationState}} is:

Name: {{registeredAgentName}}
Address: {{registeredAgentAddress}}

ARTICLE VII - MANAGEMENT STRUCTURE
The Limited Liability Company shall be {{managementType}}.

[ ] Member-Managed: The Company shall be managed by its Members.
[ ] Manager-Managed: The Company shall be managed by one or more Managers.

ARTICLE VIII - PRINCIPAL OFFICE
The address of the principal office of the Limited Liability Company is:
{{businessAddress}}

ARTICLE IX - ORGANIZER
The name and address of the organizer is:
{{organizerName}}
{{organizerAddress}}

ARTICLE X - INDEMNIFICATION
The Company shall indemnify any Member, Manager, officer, employee, or agent of the Company to the fullest extent permitted by law.

IN WITNESS WHEREOF, the undersigned organizer has executed these Articles of Organization on this {{date}}.


_______________________________
{{signatoryName}}, Organizer

STATE OF {{formationState}}
COUNTY OF _______________

The foregoing instrument was acknowledged before me this ___ day of __________, {{year}}.

_______________________________
Notary Public
My Commission Expires: _______________`,
  mergeFields: [
    COMMON_MERGE_FIELDS.businessName,
    COMMON_MERGE_FIELDS.formationState,
    COMMON_MERGE_FIELDS.effectiveDate,
    COMMON_MERGE_FIELDS.registeredAgentName,
    COMMON_MERGE_FIELDS.registeredAgentAddress,
    COMMON_MERGE_FIELDS.businessAddress,
    { key: 'managementType', label: 'Management Type', source: 'business_profile', sourcePath: 'managementType', required: false, defaultValue: 'member-managed' },
    { key: 'organizerName', label: 'Organizer Name', source: 'person', sourcePath: 'fullName', required: true },
    { key: 'organizerAddress', label: 'Organizer Address', source: 'person', sourcePath: 'address', required: false },
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.date,
    COMMON_MERGE_FIELDS.year,
  ],
  applicableBusinessTypes: [BusinessType.LLC],
  priority: 'required',
  advisorReviewRequired: true,
  workflowStepKey: 'entity_setup',
};

export const OPERATING_AGREEMENT_TEMPLATE: DocumentTemplateData = {
  name: 'Operating Agreement - Single Member LLC',
  description: 'Comprehensive operating agreement for single-member LLCs including capital contributions, distributions, indemnification, dissolution, and amendment procedures.',
  type: DocumentType.OPERATING_AGREEMENT,
  category: DocumentCategory.FORMATION,
  content: `OPERATING AGREEMENT
OF
{{businessName}}

A {{formationState}} Limited Liability Company

This Operating Agreement ("Agreement") is entered into effective as of {{effectiveDate}}, by the undersigned sole member ("Member").

RECITALS

WHEREAS, the Member desires to form a limited liability company under the laws of the State of {{formationState}}; and

WHEREAS, the Member desires to set forth the terms and conditions governing the operations and management of the Company;

NOW, THEREFORE, the Member agrees as follows:

ARTICLE 1 - ORGANIZATION

1.1 Formation. The Company was formed as a Limited Liability Company under the laws of the State of {{formationState}} upon the filing of the Articles of Organization with the Secretary of State.

1.2 Name. The name of the Company is {{businessName}}.

1.3 Principal Office. The principal office of the Company is located at:
{{businessAddress}}

1.4 Registered Agent. The registered agent for service of process is:
{{registeredAgentName}}
{{registeredAgentAddress}}

1.5 Term. The Company shall continue until dissolved in accordance with this Agreement or by law.

ARTICLE 2 - PURPOSE AND POWERS

2.1 Purpose. The purpose of the Company is to engage in any lawful business activity.

2.2 Powers. The Company shall have all powers necessary or convenient to carry out its purposes.

ARTICLE 3 - MEMBER AND CAPITAL

3.1 Member. {{memberName}} is the sole Member of the Company.

3.2 Membership Interest. The Member owns 100% of the membership interest in the Company.

3.3 Initial Capital Contribution. The Member has contributed or agrees to contribute the following as initial capital:
    Cash: ${{initialCapitalCash}}
    Property: {{initialCapitalProperty}}
    Services: {{initialCapitalServices}}
    Total Value: ${{totalInitialCapital}}

3.4 Additional Capital Contributions. The Member may make additional capital contributions at any time. No additional capital contributions are required unless agreed in writing.

3.5 Capital Account. The Company shall maintain a capital account for the Member in accordance with Treasury Regulations.

3.6 No Interest on Capital. No interest shall be paid on capital contributions.

3.7 Return of Capital. The Member has no right to withdraw or be repaid any capital contribution except as provided in this Agreement or by law.

ARTICLE 4 - ALLOCATIONS AND DISTRIBUTIONS

4.1 Profits and Losses. All profits and losses of the Company shall be allocated to the Member.

4.2 Distributions. The Member may cause the Company to make distributions of available cash at any time, subject to restrictions under applicable law. The Company shall maintain reasonable reserves for working capital and anticipated expenses.

4.3 Tax Distributions. The Company shall distribute sufficient funds to enable the Member to pay income taxes on the Company's taxable income allocated to the Member, to the extent funds are available.

4.4 Distribution Limitations. No distribution shall be made if it would:
    (a) Violate applicable law;
    (b) Render the Company unable to pay its debts as they become due; or
    (c) Impair the capital of the Company.

ARTICLE 5 - MANAGEMENT

5.1 Management by Member. The Company shall be managed by its Member, who shall have full authority to manage and control the business and affairs of the Company.

5.2 Officers. The Member may appoint officers to carry out the day-to-day operations of the Company.

5.3 Bank Accounts. The Company shall maintain one or more bank accounts, and the Member or designated officers shall have signature authority.

5.4 Contracts. The Member may enter into contracts on behalf of the Company.

ARTICLE 6 - RECORDS AND ACCOUNTING

6.1 Records. The Company shall maintain complete and accurate records of all Company business.

6.2 Fiscal Year. The fiscal year of the Company shall be the calendar year.

6.3 Tax Elections. The Member shall make all tax elections for the Company.

6.4 Tax Returns. The Company shall file all required federal, state, and local tax returns.

ARTICLE 7 - LIABILITY AND INDEMNIFICATION

7.1 Limited Liability. The Member shall not be personally liable for the debts, obligations, or liabilities of the Company solely by reason of being a member.

7.2 Indemnification. The Company shall indemnify and hold harmless the Member and any officer, employee, or agent of the Company from any liability, loss, or damage incurred by reason of any act performed or omitted in good faith on behalf of the Company and in a manner reasonably believed to be within the scope of authority granted by this Agreement.

7.3 Insurance. The Company may purchase and maintain insurance on behalf of the Member and any officer, employee, or agent.

ARTICLE 8 - DISSOLUTION AND WINDING UP

8.1 Events of Dissolution. The Company shall be dissolved upon:
    (a) The written consent of the Member;
    (b) The death, incapacity, bankruptcy, or withdrawal of the Member, unless continued as provided herein;
    (c) Entry of a decree of judicial dissolution; or
    (d) Any other event causing dissolution under applicable law.

8.2 Continuation. Upon the death or incapacity of the Member, the Company may be continued by the Member's successors if they elect to continue within 90 days.

8.3 Winding Up. Upon dissolution, the Member or a liquidating agent shall wind up the Company's affairs, liquidate assets, pay creditors, and distribute remaining assets to the Member.

8.4 Articles of Dissolution. Upon completion of winding up, Articles of Dissolution shall be filed with the Secretary of State.

ARTICLE 9 - TRANSFER OF MEMBERSHIP INTEREST

9.1 Transfer Restrictions. The Member may freely transfer all or any portion of the membership interest.

9.2 New Members. A transferee shall become a Member upon acceptance of this Agreement.

ARTICLE 10 - AMENDMENTS

10.1 Amendment. This Agreement may be amended only by a written instrument signed by the Member.

10.2 Restated Agreement. The Member may restate this Agreement to incorporate amendments.

ARTICLE 11 - MISCELLANEOUS

11.1 Governing Law. This Agreement shall be governed by the laws of the State of {{formationState}}.

11.2 Severability. If any provision is held invalid, the remaining provisions shall continue in effect.

11.3 Entire Agreement. This Agreement constitutes the entire agreement of the Member with respect to the subject matter hereof.

11.4 Binding Effect. This Agreement shall be binding upon and inure to the benefit of the Member and the Member's heirs, successors, and assigns.

IN WITNESS WHEREOF, the Member has executed this Operating Agreement as of the date first written above.


MEMBER:

_______________________________
{{memberName}}
Sole Member


Date: {{date}}`,
  mergeFields: [
    COMMON_MERGE_FIELDS.businessName,
    COMMON_MERGE_FIELDS.formationState,
    COMMON_MERGE_FIELDS.effectiveDate,
    COMMON_MERGE_FIELDS.businessAddress,
    COMMON_MERGE_FIELDS.registeredAgentName,
    COMMON_MERGE_FIELDS.registeredAgentAddress,
    COMMON_MERGE_FIELDS.memberName,
    { key: 'initialCapitalCash', label: 'Initial Cash Capital', source: 'custom', required: false, defaultValue: '0.00' },
    { key: 'initialCapitalProperty', label: 'Property Contribution', source: 'custom', required: false, defaultValue: 'None' },
    { key: 'initialCapitalServices', label: 'Services Contribution', source: 'custom', required: false, defaultValue: 'None' },
    { key: 'totalInitialCapital', label: 'Total Initial Capital', source: 'custom', required: false, defaultValue: '0.00' },
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: [BusinessType.LLC],
  priority: 'required',
  advisorReviewRequired: true,
  workflowStepKey: 'ownership_setup',
};

export const REGISTERED_AGENT_CONSENT_TEMPLATE: DocumentTemplateData = {
  name: 'Registered Agent Consent',
  description: 'Written consent form for the registered agent accepting appointment to receive service of process.',
  type: DocumentType.REGISTERED_AGENT_CONSENT,
  category: DocumentCategory.FORMATION,
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

I understand that I may resign as Registered Agent by providing written notice to the Company and filing appropriate documents with the Secretary of State in accordance with applicable law.

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
};

export const INITIAL_MEMBER_RESOLUTION_TEMPLATE: DocumentTemplateData = {
  name: 'Initial Member Resolution',
  description: 'Resolution documenting initial organizational actions taken by LLC members upon formation.',
  type: DocumentType.INITIAL_MEMBER_RESOLUTION,
  category: DocumentCategory.FORMATION,
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

RESOLVED, that the Members are authorized to make any tax elections deemed appropriate for the Company.

EMPLOYER IDENTIFICATION NUMBER

RESOLVED, that the Company is authorized to apply for an Employer Identification Number (EIN) from the Internal Revenue Service.

ORGANIZATIONAL EXPENSES

RESOLVED, that the Company is authorized to pay all expenses incurred in connection with the organization of the Company, including but not limited to filing fees, legal fees, and accounting fees.

BUSINESS LICENSES AND PERMITS

RESOLVED, that the Members are authorized to apply for and obtain all business licenses and permits required for the Company to conduct business.

GENERAL AUTHORITY

RESOLVED, that the Members are authorized to take any and all actions necessary or appropriate to carry out the purposes of the Company and to execute any documents required in connection therewith.

RATIFICATION

RESOLVED, that any and all actions heretofore taken by the Members or any person acting on behalf of the Company in connection with the organization and initial operation of the Company are hereby ratified, approved, and confirmed.

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
  applicableBusinessTypes: [BusinessType.LLC],
  priority: 'required',
  advisorReviewRequired: true,
  workflowStepKey: 'initial_actions',
};

export const BUSINESS_ADDRESS_AFFIDAVIT_TEMPLATE: DocumentTemplateData = {
  name: 'Business Address Affidavit',
  description: 'Affidavit confirming the principal place of business address for company records.',
  type: DocumentType.BUSINESS_ADDRESS_AFFIDAVIT,
  category: DocumentCategory.FORMATION,
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

8. I make this affidavit for the purpose of establishing the official business address of the Company for all legal and regulatory purposes.

I declare under penalty of perjury that the foregoing is true and correct.


_______________________________
{{signatoryName}}
{{signatoryTitle}}

Date: {{date}}


NOTARIZATION (if required)

STATE OF {{formationState}}
COUNTY OF _____________________

Subscribed and sworn to before me this ___ day of __________, {{year}}.


_______________________________
Notary Public
My Commission Expires: _______________`,
  mergeFields: [
    COMMON_MERGE_FIELDS.formationState,
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.signatoryTitle,
    COMMON_MERGE_FIELDS.businessName,
    COMMON_MERGE_FIELDS.businessAddress,
    COMMON_MERGE_FIELDS.date,
    COMMON_MERGE_FIELDS.year,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  priority: 'recommended',
  advisorReviewRequired: false,
  workflowStepKey: 'business_readiness',
};

// =============================================================================
// GOVERNANCE DOCUMENTS
// =============================================================================

export const BANKING_RESOLUTION_TEMPLATE: DocumentTemplateData = {
  name: 'Banking Resolution',
  description: 'Resolution authorizing the opening of bank accounts and designating authorized signatories.',
  type: DocumentType.BANKING_RESOLUTION,
  category: DocumentCategory.GOVERNANCE,
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
Signature Authority: [ ] Single  [ ] Dual (requires second signature)

Name: {{authorizedSigner2Name}}
Title: {{authorizedSigner2Title}}
Signature Authority: [ ] Single  [ ] Dual (requires second signature)

SIGNATURE REQUIREMENTS:
[ ] Single signature required for amounts up to $___________
[ ] Two signatures required for amounts exceeding $___________
[ ] All transactions require dual signatures

RESOLVED, that any bank or financial institution may rely on this resolution until it receives written notice of revocation or amendment.

RESOLVED, that the Secretary or any Member is authorized to certify copies of this resolution to any bank or financial institution.

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
};

export const OFFICER_APPOINTMENT_RESOLUTION_TEMPLATE: DocumentTemplateData = {
  name: 'Officer/Manager Appointment Resolution',
  description: 'Resolution appointing officers or managers and defining their authority and responsibilities.',
  type: DocumentType.OFFICER_APPOINTMENT_RESOLUTION,
  category: DocumentCategory.GOVERNANCE,
  content: `RESOLUTION OF THE MEMBER(S)
APPOINTMENT OF OFFICERS/MANAGERS

{{businessName}}
A {{formationState}} Limited Liability Company

The undersigned, being all of the Members of {{businessName}} (the "Company"), hereby adopt the following resolution effective as of {{effectiveDate}}:

APPOINTMENT OF OFFICERS/MANAGERS

RESOLVED, that the following individuals are hereby appointed to serve in the capacities indicated until their successors are duly appointed or until their earlier resignation or removal:

PRESIDENT/MANAGING MEMBER:
Name: {{presidentName}}
Term: Until successor is appointed
Compensation: {{presidentCompensation}}

VICE PRESIDENT (if applicable):
Name: {{vicePresidentName}}
Term: Until successor is appointed
Compensation: {{vicePresidentCompensation}}

SECRETARY:
Name: {{secretaryName}}
Term: Until successor is appointed
Compensation: {{secretaryCompensation}}

TREASURER/CFO:
Name: {{treasurerName}}
Term: Until successor is appointed
Compensation: {{treasurerCompensation}}

AUTHORITY AND DUTIES

RESOLVED, that the officers/managers shall have the following authority and duties:

President/Managing Member:
- General supervision of the business and affairs of the Company
- Authority to sign contracts, agreements, and other documents on behalf of the Company
- Authority to hire and terminate employees
- Such other duties as assigned by the Members

Secretary:
- Maintenance of Company records and minutes
- Custody of the Company seal (if any)
- Certification of Company documents
- Such other duties as assigned by the Members

Treasurer/CFO:
- Oversight of financial affairs of the Company
- Maintenance of financial records
- Preparation of financial reports
- Such other duties as assigned by the Members

COMPENSATION

RESOLVED, that officers/managers shall be entitled to reasonable compensation for services rendered, as determined by the Members from time to time.

INDEMNIFICATION

RESOLVED, that the Company shall indemnify each officer/manager to the fullest extent permitted by law.

IN WITNESS WHEREOF, the undersigned have executed this Resolution as of the date first written above.


MEMBER(S):

_______________________________
{{memberName}}
Member

Date: {{date}}`,
  mergeFields: [
    COMMON_MERGE_FIELDS.businessName,
    COMMON_MERGE_FIELDS.formationState,
    COMMON_MERGE_FIELDS.effectiveDate,
    { key: 'presidentName', label: 'President Name', source: 'person', sourcePath: 'fullName', required: true },
    { key: 'presidentCompensation', label: 'President Compensation', source: 'custom', required: false, defaultValue: 'As determined by Members' },
    { key: 'vicePresidentName', label: 'Vice President Name', source: 'custom', required: false, defaultValue: 'N/A' },
    { key: 'vicePresidentCompensation', label: 'VP Compensation', source: 'custom', required: false, defaultValue: 'N/A' },
    { key: 'secretaryName', label: 'Secretary Name', source: 'custom', required: false },
    { key: 'secretaryCompensation', label: 'Secretary Compensation', source: 'custom', required: false, defaultValue: 'As determined by Members' },
    { key: 'treasurerName', label: 'Treasurer Name', source: 'custom', required: false },
    { key: 'treasurerCompensation', label: 'Treasurer Compensation', source: 'custom', required: false, defaultValue: 'As determined by Members' },
    COMMON_MERGE_FIELDS.memberName,
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  priority: 'optional',
  advisorReviewRequired: false,
};

export const CONFLICT_OF_INTEREST_POLICY_TEMPLATE: DocumentTemplateData = {
  name: 'Conflict of Interest Policy',
  description: 'Policy establishing procedures for identifying and managing conflicts of interest.',
  type: DocumentType.CONFLICT_OF_INTEREST_POLICY,
  category: DocumentCategory.GOVERNANCE,
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

3.4 Violations
If the Members have reasonable cause to believe a person has failed to disclose a conflict, they shall inform the person and afford an opportunity to explain. If the person has failed to disclose a conflict, the Members shall take appropriate disciplinary and corrective action.

ARTICLE IV - RECORDS

4.1 Minutes
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
c) Have agreed to comply with the policy; and
d) Understand that the Company must operate in the best interest of its members and stakeholders.

ARTICLE VI - PERIODIC REVIEWS

To ensure that the Company operates in a manner consistent with its purposes, periodic reviews shall be conducted.

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
  applicableArchetypes: ['nonprofit', 'professional_services'],
  priority: 'recommended',
  advisorReviewRequired: true,
};

// =============================================================================
// FINANCIAL DOCUMENTS
// =============================================================================

export const EIN_CONFIRMATION_RECORD_TEMPLATE: DocumentTemplateData = {
  name: 'EIN Confirmation Record',
  description: 'Internal record documenting the Employer Identification Number received from the IRS.',
  type: DocumentType.EIN_CONFIRMATION_RECORD,
  category: DocumentCategory.FINANCIAL,
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
SSN/ITIN (last 4 digits): XXX-XX-{{responsiblePartySSNLast4}}

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
    { key: 'responsiblePartySSNLast4', label: 'SSN Last 4 Digits', source: 'custom', required: false, defaultValue: '****' },
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.signatoryTitle,
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  priority: 'required',
  advisorReviewRequired: false,
  workflowStepKey: 'federal_setup',
};

export const CAPITAL_CONTRIBUTION_RECORD_TEMPLATE: DocumentTemplateData = {
  name: 'Capital Contribution Record',
  description: 'Record of capital contributions made by members to the company.',
  type: DocumentType.CAPITAL_CONTRIBUTION_RECORD,
  category: DocumentCategory.FINANCIAL,
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
- Bank/Account: {{bankInfo}}

Property Contributions:
- Description: {{propertyDescription}}
- Fair Market Value: ${{propertyFMV}}
- Valuation Method: {{valuationMethod}}
- Valuation Date: {{valuationDate}}

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
    { key: 'bankInfo', label: 'Bank Information', source: 'custom', required: false },
    { key: 'propertyDescription', label: 'Property Description', source: 'custom', required: false, defaultValue: 'N/A' },
    { key: 'propertyFMV', label: 'Property Fair Market Value', source: 'custom', required: false, defaultValue: '0.00' },
    { key: 'valuationMethod', label: 'Valuation Method', source: 'custom', required: false },
    { key: 'valuationDate', label: 'Valuation Date', source: 'custom', required: false },
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
  applicableBusinessTypes: [BusinessType.LLC, BusinessType.PARTNERSHIP, BusinessType.CORPORATION],
  priority: 'recommended',
  advisorReviewRequired: true,
  workflowStepKey: 'ownership_setup',
};

export const OWNER_COMPENSATION_POLICY_TEMPLATE: DocumentTemplateData = {
  name: 'Owner Compensation Policy',
  description: 'Policy establishing guidelines for owner compensation, guaranteed payments, and distributions.',
  type: DocumentType.OWNER_COMPENSATION_POLICY,
  category: DocumentCategory.FINANCIAL,
  content: `OWNER COMPENSATION POLICY

{{businessName}}
Effective Date: {{effectiveDate}}

1. PURPOSE

This policy establishes guidelines for compensating the owner(s) of {{businessName}} in a manner that:
- Reflects the value of services provided to the Company
- Complies with applicable tax laws
- Maintains adequate capital reserves
- Ensures fair treatment of all stakeholders

2. COMPENSATION TYPES

2.1 Guaranteed Payments (LLC) / Salary (S-Corp)
- Regular payments for services rendered, regardless of Company profits
- Subject to self-employment tax (LLC) or payroll taxes (S-Corp)
- Amount: {{guaranteedPaymentAmount}} per {{paymentFrequency}}

2.2 Distributions
- Payments to owners based on ownership percentage
- Made from available profits after expenses and reserves
- Timing: {{distributionSchedule}}

2.3 Expense Reimbursement
- Reimbursement for legitimate business expenses
- Requires proper documentation
- Processed within {{reimbursementTimeframe}} days of submission

3. COMPENSATION SCHEDULE

Owner: {{memberName}}
Ownership: {{ownershipPercentage}}%
Guaranteed Payment/Salary: ${{annualCompensation}} annually
Payment Frequency: {{paymentFrequency}}
Distribution Eligibility: Yes, pro rata with ownership

4. TAX CONSIDERATIONS

4.1 The Company will:
- Make required tax withholdings (if S-Corp election)
- Issue appropriate tax forms (K-1, W-2, 1099)
- Make estimated tax payments as required

4.2 Owners are responsible for:
- Payment of personal income taxes
- Payment of self-employment taxes (if applicable)
- Quarterly estimated tax payments

5. REVIEW AND MODIFICATION

This policy will be reviewed annually and may be modified by agreement of the Members.

Adopted on {{date}}.


_______________________________
{{signatoryName}}, {{signatoryTitle}}

Date: {{date}}`,
  mergeFields: [
    COMMON_MERGE_FIELDS.businessName,
    COMMON_MERGE_FIELDS.effectiveDate,
    { key: 'guaranteedPaymentAmount', label: 'Guaranteed Payment Amount', source: 'custom', required: false },
    { key: 'paymentFrequency', label: 'Payment Frequency', source: 'custom', required: false, defaultValue: 'month' },
    { key: 'distributionSchedule', label: 'Distribution Schedule', source: 'custom', required: false, defaultValue: 'Quarterly, as determined by Members' },
    { key: 'reimbursementTimeframe', label: 'Reimbursement Timeframe', source: 'custom', required: false, defaultValue: '30' },
    COMMON_MERGE_FIELDS.memberName,
    { key: 'ownershipPercentage', label: 'Ownership Percentage', source: 'custom', required: false, defaultValue: '100' },
    { key: 'annualCompensation', label: 'Annual Compensation', source: 'custom', required: false },
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.signatoryTitle,
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: [BusinessType.LLC, BusinessType.CORPORATION],
  applicableArchetypes: ['professional_services'],
  priority: 'recommended',
  advisorReviewRequired: true,
};

// =============================================================================
// OPERATIONS DOCUMENTS
// =============================================================================

export const BUSINESS_PROCESS_INVENTORY_TEMPLATE: DocumentTemplateData = {
  name: 'Business Process Inventory',
  description: 'Comprehensive inventory of all business processes for documentation and improvement initiatives.',
  type: DocumentType.BUSINESS_PROCESS_INVENTORY,
  category: DocumentCategory.OPERATIONS,
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

┌─────────────────────────────────────────────────────────────────────────────┐
│ CATEGORY              │ PROCESS NAME                │ OWNER     │ STATUS   │
├─────────────────────────────────────────────────────────────────────────────┤
│ OPERATIONS            │                             │           │          │
├───────────────────────┼─────────────────────────────┼───────────┼──────────┤
│                       │ {{process1Name}}            │ {{p1Owner}}│{{p1Status}}│
│                       │ {{process2Name}}            │ {{p2Owner}}│{{p2Status}}│
│                       │ {{process3Name}}            │ {{p3Owner}}│{{p3Status}}│
├─────────────────────────────────────────────────────────────────────────────┤
│ FINANCE               │                             │           │          │
├───────────────────────┼─────────────────────────────┼───────────┼──────────┤
│                       │ Invoicing                   │           │          │
│                       │ Accounts Receivable         │           │          │
│                       │ Accounts Payable            │           │          │
│                       │ Payroll Processing          │           │          │
├─────────────────────────────────────────────────────────────────────────────┤
│ SALES & MARKETING     │                             │           │          │
├───────────────────────┼─────────────────────────────┼───────────┼──────────┤
│                       │ Lead Generation             │           │          │
│                       │ Customer Intake             │           │          │
│                       │ Proposal Development        │           │          │
├─────────────────────────────────────────────────────────────────────────────┤
│ CUSTOMER SERVICE      │                             │           │          │
├───────────────────────┼─────────────────────────────┼───────────┼──────────┤
│                       │ Inquiry Handling            │           │          │
│                       │ Complaint Resolution        │           │          │
│                       │ Follow-up Process           │           │          │
├─────────────────────────────────────────────────────────────────────────────┤
│ COMPLIANCE            │                             │           │          │
├───────────────────────┼─────────────────────────────┼───────────┼──────────┤
│                       │ License Renewals            │           │          │
│                       │ Tax Filings                 │           │          │
│                       │ Annual Report Filing        │           │          │
└─────────────────────────────────────────────────────────────────────────────┘

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
};

export const SOP_TEMPLATE: DocumentTemplateData = {
  name: 'Standard Operating Procedure (SOP) Template',
  description: 'Template for creating standardized operating procedures for any business process.',
  type: DocumentType.SOP_TEMPLATE,
  category: DocumentCategory.OPERATIONS,
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

Reviewed By: {{reviewerName}}
Date: _______________

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
    { key: 'reviewerName', label: 'Reviewer Name', source: 'custom', required: false },
    { key: 'approverName', label: 'Approver Name', source: 'custom', required: false },
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  priority: 'recommended',
  advisorReviewRequired: false,
};

export const VENDOR_MANAGEMENT_CHECKLIST_TEMPLATE: DocumentTemplateData = {
  name: 'Vendor Management Checklist',
  description: 'Checklist for evaluating, onboarding, and managing vendor relationships.',
  type: DocumentType.VENDOR_MANAGEMENT_CHECKLIST,
  category: DocumentCategory.OPERATIONS,
  content: `VENDOR MANAGEMENT CHECKLIST

{{businessName}}

VENDOR INFORMATION
Vendor Name: {{vendorName}}
Contact Person: {{vendorContact}}
Phone: {{vendorPhone}}
Email: {{vendorEmail}}
Website: {{vendorWebsite}}

EVALUATION DATE: {{date}}
EVALUATED BY: {{signatoryName}}

SECTION 1: PRE-QUALIFICATION

□ Business license verified
□ Insurance certificates obtained (General Liability, Workers Comp)
□ References checked (minimum 3)
□ Financial stability reviewed
□ Compliance certifications verified
□ Service Level Agreement (SLA) terms reviewed

SECTION 2: PRICING & TERMS

□ Pricing is competitive
□ Payment terms are acceptable
□ Volume discounts negotiated
□ Price increase terms defined
□ Early payment discounts available

SECTION 3: QUALITY & PERFORMANCE

□ Quality standards defined
□ Performance metrics established
□ Inspection procedures agreed
□ Defect/return policy clear
□ Warranty terms acceptable

SECTION 4: COMPLIANCE & RISK

□ Data privacy requirements addressed
□ Confidentiality agreement signed
□ Insurance requirements met
□ Subcontractor policy clear
□ Termination terms acceptable

SECTION 5: ONGOING MANAGEMENT

□ Regular performance reviews scheduled
□ Issue escalation process defined
□ Renewal terms documented
□ Exit strategy planned

VENDOR RATING: {{vendorRating}}/5

RECOMMENDATION:
[ ] Approve    [ ] Conditional Approval    [ ] Reject

NOTES:
{{evaluationNotes}}


Evaluated By: {{signatoryName}}
Date: {{date}}

Approved By: {{approverName}}
Date: _______________`,
  mergeFields: [
    COMMON_MERGE_FIELDS.businessName,
    { key: 'vendorName', label: 'Vendor Name', source: 'custom', required: true },
    { key: 'vendorContact', label: 'Vendor Contact', source: 'custom', required: false },
    { key: 'vendorPhone', label: 'Vendor Phone', source: 'custom', required: false },
    { key: 'vendorEmail', label: 'Vendor Email', source: 'custom', required: false },
    { key: 'vendorWebsite', label: 'Vendor Website', source: 'custom', required: false },
    { key: 'vendorRating', label: 'Vendor Rating', source: 'custom', required: false, defaultValue: '0' },
    { key: 'evaluationNotes', label: 'Evaluation Notes', source: 'custom', required: false },
    { key: 'approverName', label: 'Approver Name', source: 'custom', required: false },
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  applicableArchetypes: ['ecommerce', 'food_business', 'home_services'],
  priority: 'recommended',
  advisorReviewRequired: false,
};

// =============================================================================
// COMPLIANCE DOCUMENTS
// =============================================================================

export const ANNUAL_COMPLIANCE_CALENDAR_TEMPLATE: DocumentTemplateData = {
  name: 'Annual Compliance Calendar',
  description: 'Calendar tracking all compliance deadlines, renewals, and regulatory requirements.',
  type: DocumentType.ANNUAL_COMPLIANCE_CALENDAR,
  category: DocumentCategory.COMPLIANCE,
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
MAY
───────────────────────────────────────────────────────────────────────────────
[ ] Business license renewal check
[ ] Insurance policy review

═══════════════════════════════════════════════════════════════════════════════
JUNE
───────────────────────────────────────────────────────────────────────────────
[ ] 15th - Q2 estimated tax payment
[ ] Mid-year financial review

═══════════════════════════════════════════════════════════════════════════════
JULY - AUGUST
───────────────────────────────────────────────────────────────────────────────
[ ] Professional license renewals
[ ] Industry certifications review

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
[ ] Workers' comp audit preparation

═══════════════════════════════════════════════════════════════════════════════
NOVEMBER
───────────────────────────────────────────────────────────────────────────────
[ ] Year-end tax planning review
[ ] Benefit plan renewals

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
- CPA/Tax Preparer: {{cpnName}}
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
    { key: 'cpnName', label: 'CPA Name', source: 'custom', required: false },
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
};

export const LICENSE_PERMIT_TRACKER_TEMPLATE: DocumentTemplateData = {
  name: 'License and Permit Tracker',
  description: 'Tracking document for all business licenses, permits, and certifications.',
  type: DocumentType.LICENSE_PERMIT_TRACKER,
  category: DocumentCategory.COMPLIANCE,
  content: `LICENSE AND PERMIT TRACKER

{{businessName}}
Last Updated: {{date}}

This document tracks all licenses, permits, and certifications required for {{businessName}} to operate legally.

═══════════════════════════════════════════════════════════════════════════════
FEDERAL LICENSES/REGISTRATIONS
───────────────────────────────────────────────────────────────────────────────
License: Employer Identification Number (EIN)
Number: {{ein}}
Status: [ ] Active  [ ] Pending  [ ] Expired
Expiration: N/A (Permanent)

═══════════════════════════════════════════════════════════════════════════════
STATE LICENSES
───────────────────────────────────────────────────────────────────────────────
License: State Business License
Issuing Authority: {{formationState}} Secretary of State
Number: {{stateLicenseNumber}}
Issue Date: {{stateLicenseIssueDate}}
Expiration: {{stateLicenseExpiration}}
Status: [ ] Active  [ ] Pending  [ ] Expired
Renewal Fee: ${{stateLicenseFee}}

═══════════════════════════════════════════════════════════════════════════════
LOCAL LICENSES
───────────────────────────────────────────────────────────────────────────────
License: {{localLicenseType}}
Issuing Authority: {{localAuthority}}
Number: {{localLicenseNumber}}
Issue Date: {{localLicenseIssueDate}}
Expiration: {{localLicenseExpiration}}
Status: [ ] Active  [ ] Pending  [ ] Expired
Renewal Fee: ${{localLicenseFee}}

═══════════════════════════════════════════════════════════════════════════════
PROFESSIONAL LICENSES/CERTIFICATIONS
───────────────────────────────────────────────────────────────────────────────
License: {{professionalLicenseType}}
Holder: {{licenseHolder}}
Number: {{professionalLicenseNumber}}
Issuing Body: {{issuingBody}}
Issue Date: {{professionalLicenseIssueDate}}
Expiration: {{professionalLicenseExpiration}}
Status: [ ] Active  [ ] Pending  [ ] Expired
CEU Requirements: {{ceuRequirements}}

═══════════════════════════════════════════════════════════════════════════════
PERMITS
───────────────────────────────────────────────────────────────────────────────
Permit: {{permitType}}
Issuing Authority: {{permitAuthority}}
Number: {{permitNumber}}
Issue Date: {{permitIssueDate}}
Expiration: {{permitExpiration}}
Status: [ ] Active  [ ] Pending  [ ] Expired

═══════════════════════════════════════════════════════════════════════════════
INSURANCE CERTIFICATES
───────────────────────────────────────────────────────────────────────────────
Type: General Liability Insurance
Carrier: {{glCarrier}}
Policy Number: {{glPolicyNumber}}
Coverage: ${{glCoverage}}
Expiration: {{glExpiration}}

Type: Professional Liability / E&O
Carrier: {{plCarrier}}
Policy Number: {{plPolicyNumber}}
Coverage: ${{plCoverage}}
Expiration: {{plExpiration}}

═══════════════════════════════════════════════════════════════════════════════
RENEWAL CALENDAR
───────────────────────────────────────────────────────────────────────────────
[ ] Q1 Renewals: {{q1Renewals}}
[ ] Q2 Renewals: {{q2Renewals}}
[ ] Q3 Renewals: {{q3Renewals}}
[ ] Q4 Renewals: {{q4Renewals}}

Prepared By: {{signatoryName}}
Date: {{date}}`,
  mergeFields: [
    COMMON_MERGE_FIELDS.businessName,
    COMMON_MERGE_FIELDS.ein,
    COMMON_MERGE_FIELDS.formationState,
    { key: 'stateLicenseNumber', label: 'State License Number', source: 'custom', required: false },
    { key: 'stateLicenseIssueDate', label: 'State License Issue Date', source: 'custom', required: false },
    { key: 'stateLicenseExpiration', label: 'State License Expiration', source: 'custom', required: false },
    { key: 'stateLicenseFee', label: 'State License Fee', source: 'custom', required: false },
    { key: 'localLicenseType', label: 'Local License Type', source: 'custom', required: false },
    { key: 'localAuthority', label: 'Local Authority', source: 'custom', required: false },
    { key: 'localLicenseNumber', label: 'Local License Number', source: 'custom', required: false },
    { key: 'localLicenseIssueDate', label: 'Local License Issue Date', source: 'custom', required: false },
    { key: 'localLicenseExpiration', label: 'Local License Expiration', source: 'custom', required: false },
    { key: 'localLicenseFee', label: 'Local License Fee', source: 'custom', required: false },
    { key: 'professionalLicenseType', label: 'Professional License Type', source: 'custom', required: false },
    { key: 'licenseHolder', label: 'License Holder', source: 'custom', required: false },
    { key: 'professionalLicenseNumber', label: 'Professional License Number', source: 'custom', required: false },
    { key: 'issuingBody', label: 'Issuing Body', source: 'custom', required: false },
    { key: 'professionalLicenseIssueDate', label: 'Professional License Issue Date', source: 'custom', required: false },
    { key: 'professionalLicenseExpiration', label: 'Professional License Expiration', source: 'custom', required: false },
    { key: 'ceuRequirements', label: 'CEU Requirements', source: 'custom', required: false },
    { key: 'permitType', label: 'Permit Type', source: 'custom', required: false },
    { key: 'permitAuthority', label: 'Permit Authority', source: 'custom', required: false },
    { key: 'permitNumber', label: 'Permit Number', source: 'custom', required: false },
    { key: 'permitIssueDate', label: 'Permit Issue Date', source: 'custom', required: false },
    { key: 'permitExpiration', label: 'Permit Expiration', source: 'custom', required: false },
    { key: 'glCarrier', label: 'GL Carrier', source: 'custom', required: false },
    { key: 'glPolicyNumber', label: 'GL Policy Number', source: 'custom', required: false },
    { key: 'glCoverage', label: 'GL Coverage', source: 'custom', required: false },
    { key: 'glExpiration', label: 'GL Expiration', source: 'custom', required: false },
    { key: 'plCarrier', label: 'PL Carrier', source: 'custom', required: false },
    { key: 'plPolicyNumber', label: 'PL Policy Number', source: 'custom', required: false },
    { key: 'plCoverage', label: 'PL Coverage', source: 'custom', required: false },
    { key: 'plExpiration', label: 'PL Expiration', source: 'custom', required: false },
    { key: 'q1Renewals', label: 'Q1 Renewals', source: 'custom', required: false },
    { key: 'q2Renewals', label: 'Q2 Renewals', source: 'custom', required: false },
    { key: 'q3Renewals', label: 'Q3 Renewals', source: 'custom', required: false },
    { key: 'q4Renewals', label: 'Q4 Renewals', source: 'custom', required: false },
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  applicableArchetypes: ['home_services', 'food_business', 'healthcare_adjacent'],
  priority: 'recommended',
  advisorReviewRequired: false,
};

export const INTERNAL_CONTROLS_CHECKLIST_TEMPLATE: DocumentTemplateData = {
  name: 'Internal Controls Checklist',
  description: 'Checklist for establishing and reviewing internal controls for financial and operational integrity.',
  type: DocumentType.INTERNAL_CONTROLS_CHECKLIST,
  category: DocumentCategory.COMPLIANCE,
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
[ ] Positive Pay or similar fraud prevention is enabled

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
[ ] Credit card statements are reconciled monthly

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

═══════════════════════════════════════════════════════════════════════════════
3. ACCOUNTS RECEIVABLE CONTROLS
───────────────────────────────────────────────────────────────────────────────
[ ] Customer credit is approved before extending terms
[ ] Invoices are issued promptly
[ ] Aging reports are reviewed regularly
[ ] Write-offs are approved by management
[ ] Cash receipts are properly applied
[ ] Customer statements are sent periodically

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

═══════════════════════════════════════════════════════════════════════════════
4. PAYROLL CONTROLS
───────────────────────────────────────────────────────────────────────────────
[ ] New hires are properly authorized
[ ] Time records are approved by supervisors
[ ] Payroll changes are documented and approved
[ ] Payroll register is reviewed before processing
[ ] Payroll bank account is reconciled monthly
[ ] Tax deposits are made timely
[ ] Year-end forms (W-2, 1099) are accurate

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak

═══════════════════════════════════════════════════════════════════════════════
5. INVENTORY CONTROLS (if applicable)
───────────────────────────────────────────────────────────────────────────────
[ ] Physical inventory counts are performed {{inventoryCountFrequency}}
[ ] Inventory records are reconciled to physical counts
[ ] Inventory is secured from unauthorized access
[ ] Obsolete/damaged inventory is identified and written off
[ ] Receiving and shipping are segregated

Rating: [ ] Strong  [ ] Adequate  [ ] Needs Improvement  [ ] Weak  [ ] N/A

═══════════════════════════════════════════════════════════════════════════════
6. INFORMATION TECHNOLOGY CONTROLS
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
7. SEGREGATION OF DUTIES
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
Date: {{date}}

Reviewed By: {{reviewerName}}
Date: _______________`,
  mergeFields: [
    COMMON_MERGE_FIELDS.businessName,
    { key: 'dualSignatureThreshold', label: 'Dual Signature Threshold', source: 'custom', required: false, defaultValue: '5,000' },
    { key: 'poThreshold', label: 'PO Threshold', source: 'custom', required: false, defaultValue: '500' },
    { key: 'inventoryCountFrequency', label: 'Inventory Count Frequency', source: 'custom', required: false, defaultValue: 'annually' },
    { key: 'actionItem1', label: 'Action Item 1', source: 'custom', required: false },
    { key: 'actionItem2', label: 'Action Item 2', source: 'custom', required: false },
    { key: 'actionItem3', label: 'Action Item 3', source: 'custom', required: false },
    { key: 'nextReviewDate', label: 'Next Review Date', source: 'custom', required: false },
    { key: 'reviewerName', label: 'Reviewer Name', source: 'custom', required: false },
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  priority: 'recommended',
  advisorReviewRequired: true,
};

// =============================================================================
// IMPROVEMENT DOCUMENTS (Lean Six Sigma)
// =============================================================================

export const SIPOC_DIAGRAM_TEMPLATE: DocumentTemplateData = {
  name: 'SIPOC Diagram',
  description: 'Suppliers, Inputs, Process, Outputs, Customers diagram for process mapping and improvement.',
  type: DocumentType.SIPOC_DIAGRAM,
  category: DocumentCategory.IMPROVEMENT,
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
4. {{supplier4}}

═══════════════════════════════════════════════════════════════════════════════
I - INPUTS
What inputs are required for this process?
───────────────────────────────────────────────────────────────────────────────
1. {{input1}}
2. {{input2}}
3. {{input3}}
4. {{input4}}

═══════════════════════════════════════════════════════════════════════════════
P - PROCESS (High-Level Steps)
What are the major steps in this process?
───────────────────────────────────────────────────────────────────────────────
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Step 1  │───▶│ Step 2  │───▶│ Step 3  │───▶│ Step 4  │───▶│ Step 5  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
 {{step1}}     {{step2}}      {{step3}}      {{step4}}      {{step5}}

═══════════════════════════════════════════════════════════════════════════════
O - OUTPUTS
What outputs does this process produce?
───────────────────────────────────────────────────────────────────────────────
1. {{output1}}
2. {{output2}}
3. {{output3}}
4. {{output4}}

═══════════════════════════════════════════════════════════════════════════════
C - CUSTOMERS
Who receives the outputs of this process?
───────────────────────────────────────────────────────────────────────────────
1. {{customer1}}
2. {{customer2}}
3. {{customer3}}
4. {{customer4}}

═══════════════════════════════════════════════════════════════════════════════
REQUIREMENTS (Voice of Customer)
───────────────────────────────────────────────────────────────────────────────
Customer Requirement 1: {{requirement1}}
Customer Requirement 2: {{requirement2}}
Customer Requirement 3: {{requirement3}}

═══════════════════════════════════════════════════════════════════════════════
KEY METRICS
───────────────────────────────────────────────────────────────────────────────
Metric 1: {{metric1}} | Target: {{target1}}
Metric 2: {{metric2}} | Target: {{target2}}
Metric 3: {{metric3}} | Target: {{target3}}

═══════════════════════════════════════════════════════════════════════════════

Prepared By: {{signatoryName}}
Date: {{date}}

Approved By: {{approverName}}
Date: _______________`,
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
    { key: 'supplier4', label: 'Supplier 4', source: 'custom', required: false },
    { key: 'input1', label: 'Input 1', source: 'custom', required: false },
    { key: 'input2', label: 'Input 2', source: 'custom', required: false },
    { key: 'input3', label: 'Input 3', source: 'custom', required: false },
    { key: 'input4', label: 'Input 4', source: 'custom', required: false },
    { key: 'step1', label: 'Step 1', source: 'custom', required: true },
    { key: 'step2', label: 'Step 2', source: 'custom', required: false },
    { key: 'step3', label: 'Step 3', source: 'custom', required: false },
    { key: 'step4', label: 'Step 4', source: 'custom', required: false },
    { key: 'step5', label: 'Step 5', source: 'custom', required: false },
    { key: 'output1', label: 'Output 1', source: 'custom', required: false },
    { key: 'output2', label: 'Output 2', source: 'custom', required: false },
    { key: 'output3', label: 'Output 3', source: 'custom', required: false },
    { key: 'output4', label: 'Output 4', source: 'custom', required: false },
    { key: 'customer1', label: 'Customer 1', source: 'custom', required: false },
    { key: 'customer2', label: 'Customer 2', source: 'custom', required: false },
    { key: 'customer3', label: 'Customer 3', source: 'custom', required: false },
    { key: 'customer4', label: 'Customer 4', source: 'custom', required: false },
    { key: 'requirement1', label: 'Requirement 1', source: 'custom', required: false },
    { key: 'requirement2', label: 'Requirement 2', source: 'custom', required: false },
    { key: 'requirement3', label: 'Requirement 3', source: 'custom', required: false },
    { key: 'metric1', label: 'Metric 1', source: 'custom', required: false },
    { key: 'target1', label: 'Target 1', source: 'custom', required: false },
    { key: 'metric2', label: 'Metric 2', source: 'custom', required: false },
    { key: 'target2', label: 'Target 2', source: 'custom', required: false },
    { key: 'metric3', label: 'Metric 3', source: 'custom', required: false },
    { key: 'target3', label: 'Target 3', source: 'custom', required: false },
    { key: 'approverName', label: 'Approver Name', source: 'custom', required: false },
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  priority: 'optional',
  advisorReviewRequired: false,
};

export const DMAIC_PROJECT_CHARTER_TEMPLATE: DocumentTemplateData = {
  name: 'DMAIC Project Charter',
  description: 'Project charter template for Lean Six Sigma DMAIC improvement projects.',
  type: DocumentType.DMAIC_PROJECT_CHARTER,
  category: DocumentCategory.IMPROVEMENT,
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
Champion: {{projectChampion}}
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
PROJECT TEAM
───────────────────────────────────────────────────────────────────────────────
Role                    | Name              | Time Commitment
───────────────────────────────────────────────────────────────────────────────
Project Leader          | {{projectLeader}} | {{leaderTime}}
Process Owner           | {{processOwner}}  | {{ownerTime}}
Team Member             | {{teamMember1}}   | {{member1Time}}
Team Member             | {{teamMember2}}   | {{member2Time}}
Subject Matter Expert   | {{sme}}           | {{smeTime}}

═══════════════════════════════════════════════════════════════════════════════
ESTIMATED BENEFITS
───────────────────────────────────────────────────────────────────────────────
Financial Benefits: ${{financialBenefits}}
Type: [ ] Hard Savings  [ ] Cost Avoidance  [ ] Revenue Increase
Calculation Method: {{calculationMethod}}

Non-Financial Benefits:
{{nonFinancialBenefits}}

═══════════════════════════════════════════════════════════════════════════════
RISKS AND CONSTRAINTS
───────────────────────────────────────────────────────────────────────────────
Risks:
1. {{risk1}}
2. {{risk2}}
3. {{risk3}}

Constraints:
{{constraints}}

═══════════════════════════════════════════════════════════════════════════════
DMAIC PHASE MILESTONES
───────────────────────────────────────────────────────────────────────────────
Phase     | Target Date      | Status    | Tollgate Review
───────────────────────────────────────────────────────────────────────────────
Define    | {{defineDate}}   | [ ]       | {{defineReview}}
Measure   | {{measureDate}}  | [ ]       | {{measureReview}}
Analyze   | {{analyzeDate}}  | [ ]       | {{analyzeReview}}
Improve   | {{improveDate}}  | [ ]       | {{improveReview}}
Control   | {{controlDate}}  | [ ]       | {{controlReview}}

═══════════════════════════════════════════════════════════════════════════════
APPROVALS
───────────────────────────────────────────────────────────────────────────────

Project Leader: {{projectLeader}}
Signature: _______________________________  Date: _______________

Project Sponsor: {{projectSponsor}}
Signature: _______________________________  Date: _______________

Champion: {{projectChampion}}
Signature: _______________________________  Date: _______________`,
  mergeFields: [
    COMMON_MERGE_FIELDS.businessName,
    { key: 'projectName', label: 'Project Name', source: 'custom', required: true },
    { key: 'projectLeader', label: 'Project Leader', source: 'custom', required: true },
    { key: 'projectSponsor', label: 'Project Sponsor', source: 'custom', required: true },
    { key: 'projectChampion', label: 'Project Champion', source: 'custom', required: false },
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
    { key: 'leaderTime', label: 'Leader Time', source: 'custom', required: false },
    { key: 'processOwner', label: 'Process Owner', source: 'custom', required: false },
    { key: 'ownerTime', label: 'Owner Time', source: 'custom', required: false },
    { key: 'teamMember1', label: 'Team Member 1', source: 'custom', required: false },
    { key: 'member1Time', label: 'Member 1 Time', source: 'custom', required: false },
    { key: 'teamMember2', label: 'Team Member 2', source: 'custom', required: false },
    { key: 'member2Time', label: 'Member 2 Time', source: 'custom', required: false },
    { key: 'sme', label: 'Subject Matter Expert', source: 'custom', required: false },
    { key: 'smeTime', label: 'SME Time', source: 'custom', required: false },
    { key: 'financialBenefits', label: 'Financial Benefits', source: 'custom', required: false },
    { key: 'calculationMethod', label: 'Calculation Method', source: 'custom', required: false },
    { key: 'nonFinancialBenefits', label: 'Non-Financial Benefits', source: 'custom', required: false },
    { key: 'risk1', label: 'Risk 1', source: 'custom', required: false },
    { key: 'risk2', label: 'Risk 2', source: 'custom', required: false },
    { key: 'risk3', label: 'Risk 3', source: 'custom', required: false },
    { key: 'constraints', label: 'Constraints', source: 'custom', required: false },
    { key: 'defineDate', label: 'Define Date', source: 'custom', required: false },
    { key: 'defineReview', label: 'Define Review', source: 'custom', required: false },
    { key: 'measureDate', label: 'Measure Date', source: 'custom', required: false },
    { key: 'measureReview', label: 'Measure Review', source: 'custom', required: false },
    { key: 'analyzeDate', label: 'Analyze Date', source: 'custom', required: false },
    { key: 'analyzeReview', label: 'Analyze Review', source: 'custom', required: false },
    { key: 'improveDate', label: 'Improve Date', source: 'custom', required: false },
    { key: 'improveReview', label: 'Improve Review', source: 'custom', required: false },
    { key: 'controlDate', label: 'Control Date', source: 'custom', required: false },
    { key: 'controlReview', label: 'Control Review', source: 'custom', required: false },
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  priority: 'optional',
  advisorReviewRequired: true,
};

export const CONTROL_PLAN_TEMPLATE: DocumentTemplateData = {
  name: 'Control Plan',
  description: 'Document to maintain process improvements and ensure sustained performance.',
  type: DocumentType.CONTROL_PLAN,
  category: DocumentCategory.IMPROVEMENT,
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
CONTROL POINTS
───────────────────────────────────────────────────────────────────────────────

┌───────────────────────────────────────────────────────────────────────────────┐
│ Control Point #1                                                              │
├───────────────────────────────────────────────────────────────────────────────┤
│ Process Step: {{step1Name}}                                                   │
│ What to Control: {{step1Control}}                                             │
│ Specification/Target: {{step1Target}}                                         │
│ Measurement Method: {{step1Method}}                                           │
│ Frequency: {{step1Frequency}}                                                 │
│ Who Measures: {{step1Who}}                                                    │
│ Response Plan: {{step1Response}}                                              │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│ Control Point #2                                                              │
├───────────────────────────────────────────────────────────────────────────────┤
│ Process Step: {{step2Name}}                                                   │
│ What to Control: {{step2Control}}                                             │
│ Specification/Target: {{step2Target}}                                         │
│ Measurement Method: {{step2Method}}                                           │
│ Frequency: {{step2Frequency}}                                                 │
│ Who Measures: {{step2Who}}                                                    │
│ Response Plan: {{step2Response}}                                              │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│ Control Point #3                                                              │
├───────────────────────────────────────────────────────────────────────────────┤
│ Process Step: {{step3Name}}                                                   │
│ What to Control: {{step3Control}}                                             │
│ Specification/Target: {{step3Target}}                                         │
│ Measurement Method: {{step3Method}}                                           │
│ Frequency: {{step3Frequency}}                                                 │
│ Who Measures: {{step3Who}}                                                    │
│ Response Plan: {{step3Response}}                                              │
└───────────────────────────────────────────────────────────────────────────────┘

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
STANDARD WORK DOCUMENTS
───────────────────────────────────────────────────────────────────────────────
[ ] SOP Updated: {{sopReference}}
[ ] Training Materials Updated
[ ] Work Instructions Posted
[ ] Visual Controls Implemented

═══════════════════════════════════════════════════════────────────────────────
TRAINING REQUIREMENTS
───────────────────────────────────────────────────────────────────────────────
Who needs training: {{trainingWho}}
Training topics: {{trainingTopics}}
Training frequency: {{trainingFrequency}}
Training records location: {{trainingRecords}}

═══════════════════════════════════════════════════════════════════════════════
ESCALATION PROCEDURE
───────────────────────────────────────────────────────────────────────────────
Level 1 - Immediate Response:
Action: {{level1Action}}
Owner: {{level1Owner}}
Timeframe: {{level1Time}}

Level 2 - Management Review:
Action: {{level2Action}}
Owner: {{level2Owner}}
Timeframe: {{level2Time}}

Level 3 - Executive Escalation:
Action: {{level3Action}}
Owner: {{level3Owner}}
Timeframe: {{level3Time}}

═══════════════════════════════════════════════════════════════════════════════
CONTROL PLAN REVIEW
───────────────────────────────────────────────────────────────────────────────
Last Review Date: {{lastReviewDate}}
Next Review Date: {{nextReviewDate}}
Review Team: {{reviewTeam}}

Changes from Last Review:
{{reviewChanges}}

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
    { key: 'step3Name', label: 'Step 3 Name', source: 'custom', required: false },
    { key: 'step3Control', label: 'Step 3 Control', source: 'custom', required: false },
    { key: 'step3Target', label: 'Step 3 Target', source: 'custom', required: false },
    { key: 'step3Method', label: 'Step 3 Method', source: 'custom', required: false },
    { key: 'step3Frequency', label: 'Step 3 Frequency', source: 'custom', required: false },
    { key: 'step3Who', label: 'Step 3 Who', source: 'custom', required: false },
    { key: 'step3Response', label: 'Step 3 Response', source: 'custom', required: false },
    { key: 'metric1Name', label: 'Metric 1 Name', source: 'custom', required: false },
    { key: 'm1Tgt', label: 'Metric 1 Target', source: 'custom', required: false },
    { key: 'm1Cur', label: 'Metric 1 Current', source: 'custom', required: false },
    { key: 'metric2Name', label: 'Metric 2 Name', source: 'custom', required: false },
    { key: 'm2Tgt', label: 'Metric 2 Target', source: 'custom', required: false },
    { key: 'm2Cur', label: 'Metric 2 Current', source: 'custom', required: false },
    { key: 'metric3Name', label: 'Metric 3 Name', source: 'custom', required: false },
    { key: 'm3Tgt', label: 'Metric 3 Target', source: 'custom', required: false },
    { key: 'm3Cur', label: 'Metric 3 Current', source: 'custom', required: false },
    { key: 'sopReference', label: 'SOP Reference', source: 'custom', required: false },
    { key: 'trainingWho', label: 'Training Who', source: 'custom', required: false },
    { key: 'trainingTopics', label: 'Training Topics', source: 'custom', required: false },
    { key: 'trainingFrequency', label: 'Training Frequency', source: 'custom', required: false },
    { key: 'trainingRecords', label: 'Training Records', source: 'custom', required: false },
    { key: 'level1Action', label: 'Level 1 Action', source: 'custom', required: false },
    { key: 'level1Owner', label: 'Level 1 Owner', source: 'custom', required: false },
    { key: 'level1Time', label: 'Level 1 Time', source: 'custom', required: false },
    { key: 'level2Action', label: 'Level 2 Action', source: 'custom', required: false },
    { key: 'level2Owner', label: 'Level 2 Owner', source: 'custom', required: false },
    { key: 'level2Time', label: 'Level 2 Time', source: 'custom', required: false },
    { key: 'level3Action', label: 'Level 3 Action', source: 'custom', required: false },
    { key: 'level3Owner', label: 'Level 3 Owner', source: 'custom', required: false },
    { key: 'level3Time', label: 'Level 3 Time', source: 'custom', required: false },
    { key: 'lastReviewDate', label: 'Last Review Date', source: 'custom', required: false },
    { key: 'nextReviewDate', label: 'Next Review Date', source: 'custom', required: false },
    { key: 'reviewTeam', label: 'Review Team', source: 'custom', required: false },
    { key: 'reviewChanges', label: 'Review Changes', source: 'custom', required: false },
    { key: 'approverName', label: 'Approver Name', source: 'custom', required: false },
    COMMON_MERGE_FIELDS.signatoryName,
    COMMON_MERGE_FIELDS.date,
  ],
  applicableBusinessTypes: ALL_BUSINESS_TYPES,
  priority: 'optional',
  advisorReviewRequired: true,
};

// =============================================================================
// EXPORT ALL TEMPLATES
// =============================================================================

export const ALL_DOCUMENT_TEMPLATES: DocumentTemplateData[] = [
  // Formation
  ARTICLES_OF_ORGANIZATION_TEMPLATE,
  OPERATING_AGREEMENT_TEMPLATE,
  REGISTERED_AGENT_CONSENT_TEMPLATE,
  INITIAL_MEMBER_RESOLUTION_TEMPLATE,
  BUSINESS_ADDRESS_AFFIDAVIT_TEMPLATE,
  
  // Governance
  BANKING_RESOLUTION_TEMPLATE,
  OFFICER_APPOINTMENT_RESOLUTION_TEMPLATE,
  CONFLICT_OF_INTEREST_POLICY_TEMPLATE,
  
  // Financial
  EIN_CONFIRMATION_RECORD_TEMPLATE,
  CAPITAL_CONTRIBUTION_RECORD_TEMPLATE,
  OWNER_COMPENSATION_POLICY_TEMPLATE,
  
  // Operations
  BUSINESS_PROCESS_INVENTORY_TEMPLATE,
  SOP_TEMPLATE,
  VENDOR_MANAGEMENT_CHECKLIST_TEMPLATE,
  
  // Compliance
  ANNUAL_COMPLIANCE_CALENDAR_TEMPLATE,
  LICENSE_PERMIT_TRACKER_TEMPLATE,
  INTERNAL_CONTROLS_CHECKLIST_TEMPLATE,
  
  // Improvement
  SIPOC_DIAGRAM_TEMPLATE,
  DMAIC_PROJECT_CHARTER_TEMPLATE,
  CONTROL_PLAN_TEMPLATE,
];
