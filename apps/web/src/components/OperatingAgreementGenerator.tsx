/**
 * Operating Agreement Generator
 * A comprehensive wizard to generate legally-sound operating agreements
 * with smart pre-fill, real-time preview, and PDF export
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  FileText,
  Users,
  DollarSign,
  Scale,
  Printer,
  Eye,
  Edit3,
  Building2,
  Briefcase,
  Vote,
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// Types
interface Member {
  id: string;
  name: string;
  address: string;
  ownershipPercentage: number;
  capitalContribution: number;
  isManager: boolean;
}

interface AgreementData {
  // Company Info
  companyName: string;
  stateFiled: string;
  stateGoverning: string;
  effectiveDate: string;
  principalAddress: string;
  businessPurpose: string;
  
  // Members
  members: Member[];
  isSingleMember: boolean;
  
  // Management
  managementType: 'member-managed' | 'manager-managed';
  managers: string[];
  
  // Financial
  fiscalYearEnd: string;
  profitDistribution: 'ownership' | 'custom';
  distributionFrequency: 'quarterly' | 'annually' | 'as-determined';
  
  // Voting
  votingThreshold: 'majority' | 'supermajority' | 'unanimous';
  majorDecisionThreshold: 'majority' | 'supermajority' | 'unanimous';
  
  // Transfers
  transferRestrictions: 'rofr' | 'consent' | 'none';
  buyoutMethod: 'fair-market' | 'book-value' | 'formula';
  
  // Dissolution
  dissolutionTriggers: string[];
  
  // Signatures
  signatures: { name: string; signed: boolean; signatureData?: string }[];
}

interface OperatingAgreementGeneratorProps {
  profile: any;
  onComplete: (data: any) => void;
  onClose: () => void;
}

// State full names
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Wizard steps
const WIZARD_STEPS = [
  { key: 'company', title: 'Company Information', icon: Building2 },
  { key: 'members', title: 'Members & Ownership', icon: Users },
  { key: 'management', title: 'Management Structure', icon: Briefcase },
  { key: 'financial', title: 'Financial Terms', icon: DollarSign },
  { key: 'voting', title: 'Voting & Decisions', icon: Vote },
  { key: 'transfers', title: 'Transfers & Exit', icon: Scale },
  { key: 'preview', title: 'Review & Sign', icon: FileText },
];

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Helper to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Document Preview Component
function DocumentPreview({ data }: { data: AgreementData }) {
  const stateName = STATE_NAMES[data.stateFiled] || data.stateFiled;
  const governingStateName = STATE_NAMES[data.stateGoverning] || data.stateGoverning;
  
  return (
    <div className="bg-white p-8 shadow-lg max-w-4xl mx-auto font-serif text-sm leading-relaxed print:shadow-none print:p-0">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">
          Operating Agreement
        </h1>
        <h2 className="text-xl font-bold">
          {data.companyName || '[Company Name]'}
        </h2>
        <p className="text-gray-600 mt-2">
          A {stateName} Limited Liability Company
        </p>
      </div>

      {/* Preamble */}
      <section className="mb-6">
        <p className="mb-4">
          This Operating Agreement (the "<strong>Agreement</strong>") of <strong>{data.companyName || '[Company Name]'}</strong>, 
          a limited liability company organized under the laws of the State of {stateName} (the "<strong>Company</strong>"), 
          is entered into and effective as of <strong>{formatDate(data.effectiveDate) || '[Effective Date]'}</strong>, 
          by and among the members whose names and addresses are set forth in <em>Schedule A</em> attached hereto 
          (individually, a "<strong>Member</strong>" and collectively, the "<strong>Members</strong>").
        </p>
      </section>

      {/* Article I - Formation */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          ARTICLE I - FORMATION AND NAME
        </h3>
        <p className="mb-2">
          <strong>1.1 Formation.</strong> The Company was formed as a limited liability company under the laws 
          of the State of {stateName} upon the filing of Articles of Organization with the Secretary of State.
        </p>
        <p className="mb-2">
          <strong>1.2 Name.</strong> The name of the Company is <strong>{data.companyName || '[Company Name]'}</strong>.
        </p>
        <p className="mb-2">
          <strong>1.3 Principal Office.</strong> The principal place of business of the Company shall be at{' '}
          <strong>{data.principalAddress || '[Address]'}</strong>, or such other location as the Members may determine.
        </p>
        <p className="mb-2">
          <strong>1.4 Purpose.</strong> The Company is organized for the purpose of {data.businessPurpose || 'engaging in any lawful business activity'} 
          {' '}and any other lawful purpose permitted under the {stateName} Limited Liability Company Act.
        </p>
      </section>

      {/* Article II - Members */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          ARTICLE II - MEMBERS AND CAPITAL CONTRIBUTIONS
        </h3>
        <p className="mb-2">
          <strong>2.1 Initial Members.</strong> The initial Members of the Company, their addresses, capital contributions, 
          and ownership percentages are set forth in <em>Schedule A</em>.
        </p>
        <p className="mb-2">
          <strong>2.2 Capital Contributions.</strong> Each Member has contributed or agrees to contribute the amount 
          of capital set forth opposite such Member's name in <em>Schedule A</em>.
        </p>
        {data.members.length > 0 && (
          <div className="my-4 p-4 bg-gray-50 rounded">
            <p className="font-bold mb-2">Schedule A - Members:</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Name</th>
                  <th className="text-right py-1">Capital</th>
                  <th className="text-right py-1">Ownership</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((member, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-1">{member.name}</td>
                    <td className="text-right py-1">{formatCurrency(member.capitalContribution)}</td>
                    <td className="text-right py-1">{member.ownershipPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Article III - Management */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          ARTICLE III - MANAGEMENT
        </h3>
        <p className="mb-2">
          <strong>3.1 Management Structure.</strong> The Company shall be{' '}
          <strong>{data.managementType === 'member-managed' ? 'member-managed' : 'manager-managed'}</strong>.
          {data.managementType === 'member-managed' 
            ? ' Each Member shall have the authority to bind the Company and participate in the management of the Company\'s business affairs.'
            : ` The Manager(s) shall have full authority to manage the business and affairs of the Company. The initial Manager(s) shall be: ${data.managers.join(', ') || '[Manager Names]'}.`
          }
        </p>
        <p className="mb-2">
          <strong>3.2 Duties.</strong> The {data.managementType === 'member-managed' ? 'Members' : 'Manager(s)'} shall 
          manage the Company in good faith and in a manner reasonably believed to be in the best interests of the Company.
        </p>
      </section>

      {/* Article IV - Allocations and Distributions */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          ARTICLE IV - ALLOCATIONS AND DISTRIBUTIONS
        </h3>
        <p className="mb-2">
          <strong>4.1 Profits and Losses.</strong> The profits and losses of the Company shall be allocated among 
          the Members {data.profitDistribution === 'ownership' 
            ? 'in proportion to their respective ownership percentages' 
            : 'as determined by the Members from time to time'}.
        </p>
        <p className="mb-2">
          <strong>4.2 Distributions.</strong> Distributions of available cash shall be made to the Members{' '}
          {data.distributionFrequency === 'quarterly' ? 'on a quarterly basis' :
           data.distributionFrequency === 'annually' ? 'on an annual basis' :
           'at such times as determined by the Members'}, 
          in proportion to their respective ownership percentages, subject to the retention of reasonable reserves 
          for Company operations.
        </p>
        <p className="mb-2">
          <strong>4.3 Fiscal Year.</strong> The fiscal year of the Company shall end on{' '}
          <strong>{data.fiscalYearEnd || 'December 31'}</strong> of each year.
        </p>
      </section>

      {/* Article V - Voting */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          ARTICLE V - VOTING AND DECISION MAKING
        </h3>
        <p className="mb-2">
          <strong>5.1 Voting Rights.</strong> Each Member shall be entitled to vote on Company matters in proportion 
          to such Member's ownership percentage.
        </p>
        <p className="mb-2">
          <strong>5.2 Ordinary Decisions.</strong> Except as otherwise provided herein, decisions on ordinary business 
          matters shall be made by a{' '}
          {data.votingThreshold === 'majority' ? 'majority vote (more than 50%)' :
           data.votingThreshold === 'supermajority' ? 'supermajority vote (at least 67%)' :
           'unanimous vote'} of the Members.
        </p>
        <p className="mb-2">
          <strong>5.3 Major Decisions.</strong> The following decisions shall require a{' '}
          {data.majorDecisionThreshold === 'majority' ? 'majority vote' :
           data.majorDecisionThreshold === 'supermajority' ? 'supermajority vote (at least 67%)' :
           'unanimous vote'} of the Members: (a) admission of new Members; (b) sale of substantially all assets; 
          (c) merger or dissolution of the Company; (d) amendment of this Agreement; and (e) any single expenditure 
          exceeding $10,000.
        </p>
      </section>

      {/* Article VI - Transfer of Interests */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          ARTICLE VI - TRANSFER OF MEMBERSHIP INTERESTS
        </h3>
        <p className="mb-2">
          <strong>6.1 Restrictions on Transfer.</strong>{' '}
          {data.transferRestrictions === 'rofr' 
            ? 'No Member may transfer, sell, or assign their membership interest without first offering the interest to the other Members on the same terms (Right of First Refusal).'
            : data.transferRestrictions === 'consent'
            ? 'No Member may transfer, sell, or assign their membership interest without the prior written consent of all other Members.'
            : 'Members may freely transfer their membership interests, subject to compliance with applicable securities laws.'
          }
        </p>
        <p className="mb-2">
          <strong>6.2 Buyout Valuation.</strong> In the event of a buyout of a Member's interest, the purchase price 
          shall be determined based on{' '}
          {data.buyoutMethod === 'fair-market' ? 'fair market value as determined by an independent appraiser' :
           data.buyoutMethod === 'book-value' ? 'the book value of the Member\'s capital account' :
           'a formula agreed upon by the Members'}.
        </p>
      </section>

      {/* Article VII - Dissolution */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          ARTICLE VII - DISSOLUTION AND WINDING UP
        </h3>
        <p className="mb-2">
          <strong>7.1 Events of Dissolution.</strong> The Company shall be dissolved upon: (a) the unanimous vote 
          of all Members to dissolve; (b) the occurrence of any event that makes it unlawful for the Company's 
          business to be continued; or (c) any other event specified in the Articles of Organization.
        </p>
        <p className="mb-2">
          <strong>7.2 Winding Up.</strong> Upon dissolution, the Company's affairs shall be wound up, its assets 
          liquidated, and the proceeds distributed: first, to creditors; second, to Members in respect of their 
          capital accounts.
        </p>
      </section>

      {/* Article VIII - General */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">
          ARTICLE VIII - GENERAL PROVISIONS
        </h3>
        <p className="mb-2">
          <strong>8.1 Governing Law.</strong> This Agreement shall be governed by and construed in accordance with 
          the laws of the State of {governingStateName}, without regard to conflicts of law principles.
        </p>
        <p className="mb-2">
          <strong>8.2 Amendments.</strong> This Agreement may be amended only by a written instrument signed by all Members.
        </p>
        <p className="mb-2">
          <strong>8.3 Entire Agreement.</strong> This Agreement constitutes the entire agreement among the Members 
          with respect to the subject matter hereof and supersedes all prior agreements and understandings.
        </p>
        <p className="mb-2">
          <strong>8.4 Severability.</strong> If any provision of this Agreement is held invalid, the remaining 
          provisions shall continue in full force and effect.
        </p>
      </section>

      {/* Signature Block */}
      <section className="mt-12">
        <p className="mb-6">
          <strong>IN WITNESS WHEREOF</strong>, the undersigned have executed this Operating Agreement as of the 
          date first written above.
        </p>
        
        <div className="grid gap-8 mt-8">
          {data.members.map((member, idx) => (
            <div key={idx} className="border-t pt-4">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <div className="border-b border-black w-64 h-8 mb-1">
                    {data.signatures[idx]?.signatureData && (
                      <img 
                        src={data.signatures[idx].signatureData} 
                        alt="Signature" 
                        className="h-full object-contain"
                      />
                    )}
                  </div>
                  <p className="text-xs">{member.name}</p>
                  <p className="text-xs text-gray-600">Member</p>
                </div>
                <div className="w-40">
                  <div className="border-b border-black h-8 mb-1"></div>
                  <p className="text-xs">Date</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Signature Pad Component
function SignaturePad({ 
  onSave, 
  onCancel,
  memberName,
}: { 
  onSave: (data: string) => void; 
  onCancel: () => void;
  memberName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx?.beginPath();
      ctx?.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx?.lineTo(x, y);
      ctx?.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const data = canvas.toDataURL('image/png');
      onSave(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign as {memberName}</h3>
        <p className="text-sm text-gray-600 mb-4">Draw your signature in the box below</p>
        
        <div className="border-2 border-gray-300 rounded-lg mb-4 bg-gray-50">
          <canvas
            ref={canvasRef}
            width={450}
            height={150}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={clearSignature}>
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={saveSignature} disabled={!hasSignature}>
              Apply Signature
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Generator Component
export function OperatingAgreementGenerator({ profile, onComplete, onClose }: OperatingAgreementGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [signingMember, setSigningMember] = useState<number | null>(null);
  
  // Initialize with profile data
  const [data, setData] = useState<AgreementData>(() => {
    const address = profile?.businessAddress;
    const addressString = address 
      ? `${address.street1}${address.street2 ? ', ' + address.street2 : ''}, ${address.city}, ${address.state} ${address.zipCode}`
      : '';
    
    return {
      companyName: profile?.businessName || '',
      stateFiled: profile?.formationState || '',
      stateGoverning: profile?.formationState || '',
      effectiveDate: new Date().toISOString().split('T')[0],
      principalAddress: addressString,
      businessPurpose: 'engaging in any lawful business activity',
      members: [],
      isSingleMember: false,
      managementType: 'member-managed',
      managers: [],
      fiscalYearEnd: 'December 31',
      profitDistribution: 'ownership',
      distributionFrequency: 'quarterly',
      votingThreshold: 'majority',
      majorDecisionThreshold: 'supermajority',
      transferRestrictions: 'rofr',
      buyoutMethod: 'fair-market',
      dissolutionTriggers: [],
      signatures: [],
    };
  });

  // Update data helper
  const updateData = (updates: Partial<AgreementData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  // Add member
  const addMember = () => {
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name: '',
      address: '',
      ownershipPercentage: 0,
      capitalContribution: 0,
      isManager: false,
    };
    updateData({ 
      members: [...data.members, newMember],
      signatures: [...data.signatures, { name: '', signed: false }],
    });
  };

  // Update member
  const updateMember = (index: number, updates: Partial<Member>) => {
    const newMembers = [...data.members];
    newMembers[index] = { ...newMembers[index], ...updates };
    
    const newSignatures = [...data.signatures];
    if (updates.name) {
      newSignatures[index] = { ...newSignatures[index], name: updates.name };
    }
    
    updateData({ 
      members: newMembers,
      signatures: newSignatures,
      isSingleMember: newMembers.length === 1,
    });
  };

  // Remove member
  const removeMember = (index: number) => {
    const newMembers = data.members.filter((_, i) => i !== index);
    const newSignatures = data.signatures.filter((_, i) => i !== index);
    updateData({ 
      members: newMembers,
      signatures: newSignatures,
      isSingleMember: newMembers.length === 1,
    });
  };

  // Handle signature
  const handleSignature = (index: number, signatureData: string) => {
    const newSignatures = [...data.signatures];
    newSignatures[index] = { 
      ...newSignatures[index], 
      signed: true, 
      signatureData,
    };
    updateData({ signatures: newSignatures });
    setSigningMember(null);
  };

  // Print/Download PDF
  const handlePrint = () => {
    window.print();
  };

  // Calculate total ownership
  const totalOwnership = data.members.reduce((sum, m) => sum + (m.ownershipPercentage || 0), 0);
  
  // Check if step is complete
  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Company Info
        return !!(data.companyName && data.stateFiled && data.effectiveDate && data.principalAddress);
      case 1: // Members
        return data.members.length > 0 && totalOwnership === 100 && data.members.every(m => m.name);
      case 2: // Management
        return !!(data.managementType && (data.managementType === 'member-managed' || data.managers.length > 0));
      case 3: // Financial
        return !!(data.fiscalYearEnd && data.profitDistribution && data.distributionFrequency);
      case 4: // Voting
        return !!(data.votingThreshold && data.majorDecisionThreshold);
      case 5: // Transfers
        return !!(data.transferRestrictions && data.buyoutMethod);
      case 6: // Preview
        return data.signatures.every(s => s.signed);
      default:
        return false;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Company Information
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Smart Pre-fill Active</h4>
                <p className="text-sm text-blue-800">
                  We've pre-filled information from your business profile. Review and adjust as needed.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={data.companyName}
                onChange={(e) => updateData({ companyName: e.target.value })}
                placeholder="Your LLC Name"
                className="mt-1"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="stateFiled">State of Formation *</Label>
                <select
                  id="stateFiled"
                  value={data.stateFiled}
                  onChange={(e) => updateData({ stateFiled: e.target.value, stateGoverning: e.target.value })}
                  className="mt-1 w-full border rounded-md px-3 py-2"
                >
                  <option value="">Select state...</option>
                  {Object.entries(STATE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={data.effectiveDate}
                  onChange={(e) => updateData({ effectiveDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="principalAddress">Principal Business Address *</Label>
              <Input
                id="principalAddress"
                value={data.principalAddress}
                onChange={(e) => updateData({ principalAddress: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="businessPurpose">Business Purpose</Label>
              <textarea
                id="businessPurpose"
                value={data.businessPurpose}
                onChange={(e) => updateData({ businessPurpose: e.target.value })}
                placeholder="Describe the primary purpose of the business..."
                className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default language allows for any lawful business activity
              </p>
            </div>
          </div>
        );

      case 1: // Members & Ownership
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Members</h4>
                <p className="text-sm text-gray-600">Add all members (owners) of the LLC</p>
              </div>
              <Button onClick={addMember} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </div>

            {data.members.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No members added yet</p>
                <Button onClick={addMember}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Your First Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.members.map((member, index) => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Member {index + 1}</h5>
                      <button
                        onClick={() => removeMember(index)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label>Full Legal Name *</Label>
                        <Input
                          value={member.name}
                          onChange={(e) => updateMember(index, { name: e.target.value })}
                          placeholder="John Doe"
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Address</Label>
                        <Input
                          value={member.address}
                          onChange={(e) => updateMember(index, { address: e.target.value })}
                          placeholder="123 Main St, City, State ZIP"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Ownership Percentage *</Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={member.ownershipPercentage || ''}
                            onChange={(e) => updateMember(index, { ownershipPercentage: parseFloat(e.target.value) || 0 })}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                      <div>
                        <Label>Capital Contribution</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            value={member.capitalContribution || ''}
                            onChange={(e) => updateMember(index, { capitalContribution: parseFloat(e.target.value) || 0 })}
                            className="pl-7"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Ownership Summary */}
                <div className={`p-4 rounded-lg ${totalOwnership === 100 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${totalOwnership === 100 ? 'text-green-800' : 'text-amber-800'}`}>
                      Total Ownership
                    </span>
                    <span className={`font-bold ${totalOwnership === 100 ? 'text-green-800' : 'text-amber-800'}`}>
                      {totalOwnership}%
                    </span>
                  </div>
                  {totalOwnership !== 100 && (
                    <p className="text-sm text-amber-700 mt-1">
                      Ownership percentages must equal 100%
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 2: // Management Structure
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Management Structure *</Label>
              <p className="text-sm text-gray-600 mb-3">Choose how your LLC will be managed</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  data.managementType === 'member-managed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="managementType"
                    checked={data.managementType === 'member-managed'}
                    onChange={() => updateData({ managementType: 'member-managed' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Member-Managed</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      All members participate in day-to-day management and can bind the company. 
                      Best for small LLCs where all owners are actively involved.
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  data.managementType === 'manager-managed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="managementType"
                    checked={data.managementType === 'manager-managed'}
                    onChange={() => updateData({ managementType: 'manager-managed' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Manager-Managed</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      One or more designated managers handle operations. Other members are passive investors. 
                      Best for LLCs with investors who won't be involved in daily operations.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {data.managementType === 'manager-managed' && (
              <div>
                <Label>Designated Manager(s)</Label>
                <p className="text-sm text-gray-600 mb-2">Select which members will serve as managers</p>
                <div className="space-y-2">
                  {data.members.map((member, index) => (
                    <label key={member.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={data.managers.includes(member.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateData({ managers: [...data.managers, member.name] });
                          } else {
                            updateData({ managers: data.managers.filter(m => m !== member.name) });
                          }
                        }}
                      />
                      <span>{member.name || `Member ${index + 1}`}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Financial Terms
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fiscalYearEnd">Fiscal Year End *</Label>
              <select
                id="fiscalYearEnd"
                value={data.fiscalYearEnd}
                onChange={(e) => updateData({ fiscalYearEnd: e.target.value })}
                className="mt-1 w-full border rounded-md px-3 py-2"
              >
                <option value="December 31">December 31 (Calendar Year)</option>
                <option value="March 31">March 31</option>
                <option value="June 30">June 30</option>
                <option value="September 30">September 30</option>
              </select>
            </div>

            <div>
              <Label className="text-base font-medium">Profit & Loss Distribution *</Label>
              <p className="text-sm text-gray-600 mb-3">How will profits and losses be allocated?</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                  data.profitDistribution === 'ownership' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="profitDistribution"
                    checked={data.profitDistribution === 'ownership'}
                    onChange={() => updateData({ profitDistribution: 'ownership' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">By Ownership Percentage</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Profits and losses are allocated in proportion to each member's ownership stake. 
                      This is the most common and straightforward approach.
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                  data.profitDistribution === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="profitDistribution"
                    checked={data.profitDistribution === 'custom'}
                    onChange={() => updateData({ profitDistribution: 'custom' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Custom Allocation</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Members can agree to special allocations that differ from ownership percentages. 
                      Useful for rewarding sweat equity or preferred returns.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Distribution Frequency *</Label>
              <p className="text-sm text-gray-600 mb-3">How often will profits be distributed?</p>
              
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: 'quarterly', label: 'Quarterly', desc: 'Every 3 months' },
                  { value: 'annually', label: 'Annually', desc: 'Once per year' },
                  { value: 'as-determined', label: 'As Determined', desc: 'When members decide' },
                ].map((option) => (
                  <label key={option.value} className={`flex flex-col p-3 border rounded-lg cursor-pointer text-center ${
                    data.distributionFrequency === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="distributionFrequency"
                      checked={data.distributionFrequency === option.value}
                      onChange={() => updateData({ distributionFrequency: option.value as any })}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <span className="text-xs text-gray-600">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Voting & Decisions
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Ordinary Business Decisions *</Label>
              <p className="text-sm text-gray-600 mb-3">What vote is required for day-to-day business decisions?</p>
              
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: 'majority', label: 'Majority', desc: 'More than 50%' },
                  { value: 'supermajority', label: 'Supermajority', desc: 'At least 67%' },
                  { value: 'unanimous', label: 'Unanimous', desc: '100% agreement' },
                ].map((option) => (
                  <label key={option.value} className={`flex flex-col p-3 border rounded-lg cursor-pointer text-center ${
                    data.votingThreshold === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="votingThreshold"
                      checked={data.votingThreshold === option.value}
                      onChange={() => updateData({ votingThreshold: option.value as any })}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <span className="text-xs text-gray-600">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Major Decisions *</Label>
              <p className="text-sm text-gray-600 mb-3">
                What vote is required for major decisions (new members, asset sales, amendments)?
              </p>
              
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { value: 'majority', label: 'Majority', desc: 'More than 50%' },
                  { value: 'supermajority', label: 'Supermajority', desc: 'At least 67%' },
                  { value: 'unanimous', label: 'Unanimous', desc: '100% agreement' },
                ].map((option) => (
                  <label key={option.value} className={`flex flex-col p-3 border rounded-lg cursor-pointer text-center ${
                    data.majorDecisionThreshold === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="majorDecisionThreshold"
                      checked={data.majorDecisionThreshold === option.value}
                      onChange={() => updateData({ majorDecisionThreshold: option.value as any })}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <span className="text-xs text-gray-600">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Major Decisions Include:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Admitting new members</li>
                <li>Selling substantially all company assets</li>
                <li>Merging with or acquiring another company</li>
                <li>Dissolving the company</li>
                <li>Amending this operating agreement</li>
                <li>Any single expenditure over $10,000</li>
              </ul>
            </div>
          </div>
        );

      case 5: // Transfers & Exit
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Transfer Restrictions *</Label>
              <p className="text-sm text-gray-600 mb-3">What rules apply when a member wants to sell their interest?</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                  data.transferRestrictions === 'rofr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="transferRestrictions"
                    checked={data.transferRestrictions === 'rofr'}
                    onChange={() => updateData({ transferRestrictions: 'rofr' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Right of First Refusal</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Before selling to an outsider, a member must first offer their interest to existing 
                      members on the same terms. Most common and recommended approach.
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                  data.transferRestrictions === 'consent' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="transferRestrictions"
                    checked={data.transferRestrictions === 'consent'}
                    onChange={() => updateData({ transferRestrictions: 'consent' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Requires Unanimous Consent</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Any transfer requires written approval from all other members. 
                      Provides maximum control but may limit exit options.
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                  data.transferRestrictions === 'none' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="transferRestrictions"
                    checked={data.transferRestrictions === 'none'}
                    onChange={() => updateData({ transferRestrictions: 'none' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Free Transferability</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Members can freely transfer their interest to anyone. 
                      Not recommended for most LLCs as it provides no control over new members.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Buyout Valuation Method *</Label>
              <p className="text-sm text-gray-600 mb-3">How will a departing member's interest be valued?</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                  data.buyoutMethod === 'fair-market' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="buyoutMethod"
                    checked={data.buyoutMethod === 'fair-market'}
                    onChange={() => updateData({ buyoutMethod: 'fair-market' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Fair Market Value</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      An independent appraiser determines the value. Most accurate but can be expensive.
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                  data.buyoutMethod === 'book-value' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="buyoutMethod"
                    checked={data.buyoutMethod === 'book-value'}
                    onChange={() => updateData({ buyoutMethod: 'book-value' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Book Value</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Based on the accounting value of the member's capital account. 
                      Simple but may not reflect true value.
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${
                  data.buyoutMethod === 'formula' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="buyoutMethod"
                    checked={data.buyoutMethod === 'formula'}
                    onChange={() => updateData({ buyoutMethod: 'formula' })}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Pre-agreed Formula</span>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Use a formula (e.g., multiple of revenue or earnings). 
                      Provides certainty but may become outdated.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 6: // Preview & Sign
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Review Your Operating Agreement</h4>
                <p className="text-sm text-gray-600">Review the document and add signatures</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print / Save PDF
                </Button>
              </div>
            </div>

            {/* Signatures Section */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Digital Signatures
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Each member must sign the agreement. Click to add your signature.
              </p>
              
              <div className="space-y-3">
                {data.members.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {data.signatures[index]?.signed ? (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Edit3 className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{member.name || `Member ${index + 1}`}</p>
                        <p className="text-xs text-gray-600">
                          {data.signatures[index]?.signed ? 'Signed' : 'Pending signature'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={data.signatures[index]?.signed ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => setSigningMember(index)}
                    >
                      {data.signatures[index]?.signed ? 'Re-sign' : 'Sign Now'}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Signature completion status */}
              <div className={`mt-4 p-3 rounded-lg ${
                data.signatures.every(s => s.signed) 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  {data.signatures.every(s => s.signed) ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">All signatures collected!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="font-medium text-amber-800">
                        {data.signatures.filter(s => s.signed).length} of {data.signatures.length} signatures collected
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Document Preview</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-[500px] overflow-y-auto bg-gray-200 p-4">
                  <DocumentPreview data={data} />
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const allSignaturesCollected = data.signatures.length > 0 && data.signatures.every(s => s.signed);

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header with steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Operating Agreement Generator</h2>
              <p className="text-sm text-gray-600">Create a customized operating agreement for your LLC</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = isStepComplete(index);
              const isCurrent = index === currentStep;
              
              return (
                <div 
                  key={step.key}
                  className={`flex items-center ${index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`flex flex-col items-center min-w-[80px] ${
                      isCurrent ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                      isCurrent ? 'bg-blue-100 ring-2 ring-blue-500' : 
                      isComplete ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {isComplete ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">{step.title}</span>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </div>
          
          {currentStep === WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={() => onComplete({ 
                type: 'generated', 
                signedDate: data.effectiveDate,
                signatories: data.members.map(m => m.name),
              })}
              disabled={!allSignaturesCollected}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete & Save
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(Math.min(WIZARD_STEPS.length - 1, currentStep + 1))}
              disabled={!isStepComplete(currentStep)}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Signature Pad Modal */}
      {signingMember !== null && (
        <SignaturePad
          memberName={data.members[signingMember]?.name || `Member ${signingMember + 1}`}
          onSave={(signatureData) => handleSignature(signingMember, signatureData)}
          onCancel={() => setSigningMember(null)}
        />
      )}

      {/* Print-only content */}
      <div className="hidden print:block">
        <DocumentPreview data={data} />
      </div>
    </>
  );
}

export default OperatingAgreementGenerator;
