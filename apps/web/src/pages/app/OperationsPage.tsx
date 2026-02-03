/**
 * Operations Page
 * Post-formation business operations setup
 */

import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  FileText,
  AlertTriangle,
  Info,
  Building2,
  Landmark,
  X,
  Upload,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Shield,
  DollarSign,
  CheckCircle,
  Users,
  Scale,
  Trash2,
  Plus,
  Calendar,
  Clock,
  Bell,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { OperatingAgreementGenerator } from '../../components/OperatingAgreementGenerator';
import { 
  useProfile, 
  useUpdateBankingStatus,
  useUpdateOperatingAgreementStatus,
  useUpdateComplianceCalendarStatus,
  type BankAccount,
  type OperatingAgreement,
  type ComplianceItem,
} from '../../lib/app-api';

// Popular business banks with info
const POPULAR_BANKS = [
  {
    name: 'Chase Business',
    type: 'Traditional',
    description: 'Large network, full-service banking',
    url: 'https://www.chase.com/business/banking',
    features: ['Nationwide branches', 'Mobile banking', 'Business credit cards'],
  },
  {
    name: 'Bank of America Business',
    type: 'Traditional',
    description: 'Comprehensive business solutions',
    url: 'https://www.bankofamerica.com/smallbusiness/',
    features: ['Cash management', 'Merchant services', 'Business loans'],
  },
  {
    name: 'Wells Fargo Business',
    type: 'Traditional',
    description: 'Dedicated business banking',
    url: 'https://www.wellsfargo.com/biz/',
    features: ['Branch access', 'Payroll services', 'Business checking'],
  },
  {
    name: 'Mercury',
    type: 'Online',
    description: 'Modern banking for startups',
    url: 'https://mercury.com/',
    features: ['No monthly fees', 'API access', 'Virtual cards'],
  },
  {
    name: 'Relay',
    type: 'Online',
    description: 'Fee-free business banking',
    url: 'https://relayfi.com/',
    features: ['No fees', 'Multiple accounts', 'Profit First friendly'],
  },
  {
    name: 'Bluevine',
    type: 'Online',
    description: 'High-yield business checking',
    url: 'https://www.bluevine.com/',
    features: ['High APY', 'No monthly fees', 'Line of credit'],
  },
];

// What you need to open a business bank account
const REQUIREMENTS = [
  { item: 'EIN (Employer Identification Number)', icon: FileText },
  { item: 'Formation documents (Articles of Organization/Incorporation)', icon: Building2 },
  { item: 'Business address verification', icon: Landmark },
  { item: 'Personal identification (Driver\'s license or passport)', icon: Shield },
  { item: 'Initial deposit (amount varies by bank)', icon: DollarSign },
];

// Business Banking Step Component
function BusinessBankingStep({ 
  profile, 
  onComplete,
  isSaving,
}: { 
  profile: any;
  onComplete: (bankAccount: Partial<BankAccount>) => void;
  isSaving: boolean;
}) {
  const [bankName, setBankName] = useState(profile?.bankAccount?.bankName || '');
  const [accountType, setAccountType] = useState<'checking' | 'savings' | 'both'>(
    profile?.bankAccount?.accountType || 'checking'
  );
  const [lastFourDigits, setLastFourDigits] = useState(profile?.bankAccount?.lastFourDigits || '');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyUrl = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a PDF, PNG, or JPG file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLastFourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setLastFourDigits(value);
  };

  const isValid = bankName.trim().length > 0 && accountType;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
        <h4 className="font-semibold text-green-900 text-lg flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Business Bank Account
        </h4>
        <p className="text-green-800 mt-1 text-sm">
          Opening a separate business bank account is essential for maintaining proper financial records,
          protecting your personal assets, and establishing business credit.
        </p>
      </div>

      {/* Requirements checklist */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">What You'll Need</h4>
        <ul className="space-y-2">
          {REQUIREMENTS.map((req, index) => {
            const Icon = req.icon;
            const isReady = index < 3; // First 3 should be done from formation
            return (
              <li key={req.item} className="flex items-center gap-3 text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isReady ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {isReady ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </div>
                <span className={isReady ? 'text-green-700' : 'text-gray-700'}>{req.item}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bank options */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Popular Business Banks</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {POPULAR_BANKS.map((bank) => (
            <div 
              key={bank.name}
              className="border rounded-lg p-3 hover:border-green-300 hover:bg-green-50/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium text-gray-900 text-sm">{bank.name}</h5>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    bank.type === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {bank.type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <a
                    href={bank.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-green-100 rounded"
                    title="Visit website"
                  >
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </a>
                  <button
                    onClick={() => handleCopyUrl(bank.url, bank.name)}
                    className="p-1.5 hover:bg-green-100 rounded"
                    title="Copy link"
                  >
                    {copied === bank.name ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{bank.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {bank.features.map((feature) => (
                  <span key={feature} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account details form */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Your Business Bank Account</h4>
        
        <div>
          <Label htmlFor="bankName">Bank Name *</Label>
          <Input
            id="bankName"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g., Chase Business, Mercury"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Account Type *</Label>
          <div className="flex gap-3 mt-2">
            {(['checking', 'savings', 'both'] as const).map((type) => (
              <label
                key={type}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                  accountType === type 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={type}
                  checked={accountType === type}
                  onChange={() => setAccountType(type)}
                  className="sr-only"
                />
                <span className="capitalize text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="lastFour">Last 4 Digits of Account Number (optional)</Label>
          <div className="relative mt-1 max-w-[150px]">
            <Input
              id="lastFour"
              type={showAccountNumber ? 'text' : 'password'}
              value={lastFourDigits}
              onChange={handleLastFourChange}
              placeholder="••••"
              maxLength={4}
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowAccountNumber(!showAccountNumber)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            >
              {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">For your records only - stored securely</p>
        </div>
      </div>

      {/* Upload bank statement */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
        />
        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">File selected</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 inline-flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-slate-200 rounded"
                title="Remove file"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Different File
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Upload account confirmation (optional)</p>
            <p className="text-xs text-gray-500 mt-1">Bank statement or account opening letter - PDF, PNG, or JPG up to 10MB</p>
            <Button 
              variant="outline" 
              className="mt-3" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
          <Info className="h-4 w-4" />
          Tips for Opening a Business Bank Account
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Compare fee structures - some online banks offer no monthly fees</li>
          <li>Consider your cash flow needs - some accounts have transaction limits</li>
          <li>Look for integration with accounting software (QuickBooks, Xero)</li>
          <li>Check if they offer business credit cards or lines of credit</li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button 
          onClick={() => onComplete({ bankName, accountType, lastFourDigits })} 
          disabled={!isValid || isSaving}
        >
          {isSaving ? 'Saving...' : 'Mark as Complete'}
        </Button>
      </div>
    </div>
  );
}

// Operating Agreement resources
const AGREEMENT_RESOURCES = [
  {
    name: 'LegalZoom',
    description: 'Professional templates with attorney review',
    url: 'https://www.legalzoom.com/business/business-formation/',
    type: 'Paid Service',
  },
  {
    name: 'Rocket Lawyer',
    description: 'Customizable templates with legal assistance',
    url: 'https://www.rocketlawyer.com/',
    type: 'Paid Service',
  },
  {
    name: 'Northwest Registered Agent',
    description: 'Free operating agreement templates',
    url: 'https://www.northwestregisteredagent.com/',
    type: 'Free Template',
  },
  {
    name: 'Incfile',
    description: 'Free LLC operating agreement generator',
    url: 'https://www.incfile.com/free-llc-operating-agreement/',
    type: 'Free Template',
  },
];

// Operating Agreement Step Component - Choose between Generate or Upload
function OperatingAgreementStep({ 
  profile, 
  onComplete,
  onOpenGenerator,
  isSaving,
}: { 
  profile: any;
  onComplete: (data: Partial<OperatingAgreement>) => void;
  onOpenGenerator: () => void;
  isSaving: boolean;
}) {
  const [mode, setMode] = useState<'choose' | 'upload'>('choose');
  const [signatories, setSignatories] = useState<string[]>(
    profile?.operatingAgreement?.signatories || []
  );
  const [newSignatory, setNewSignatory] = useState('');
  const [signedDate, setSignedDate] = useState(
    profile?.operatingAgreement?.signedDate || ''
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine document type based on business type
  const isLLC = profile?.businessType?.toLowerCase().includes('llc');
  const documentName = isLLC ? 'Operating Agreement' : 'Bylaws';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a PDF, PNG, or JPG file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddSignatory = () => {
    if (newSignatory.trim() && !signatories.includes(newSignatory.trim())) {
      setSignatories([...signatories, newSignatory.trim()]);
      setNewSignatory('');
    }
  };

  const handleRemoveSignatory = (name: string) => {
    setSignatories(signatories.filter(s => s !== name));
  };

  const isUploadValid = signatories.length > 0 && signedDate && selectedFile;

  // Choice screen
  if (mode === 'choose') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
          <h4 className="font-semibold text-indigo-900 text-lg flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {documentName}
          </h4>
          <p className="text-indigo-800 mt-1 text-sm">
            {isLLC 
              ? 'An Operating Agreement establishes the rules for how your LLC will be run, including ownership percentages, voting rights, and profit distribution.'
              : 'Bylaws are the internal rules governing your corporation, including board procedures, officer roles, and shareholder rights.'
            }
          </p>
        </div>

        {/* Why it matters */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Why This Matters</h4>
            <ul className="text-sm text-amber-800 mt-1 space-y-1">
              <li>• <strong>Liability Protection:</strong> Without it, your LLC/Corp may not provide full liability protection</li>
              <li>• <strong>Bank Requirement:</strong> Many banks require this to open a business account</li>
              <li>• <strong>Dispute Resolution:</strong> Prevents conflicts by establishing clear rules upfront</li>
              <li>• <strong>Legal Compliance:</strong> Some states require operating agreements/bylaws</li>
            </ul>
          </div>
        </div>

        {/* Two main options */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Option 1: Generate */}
          <div 
            onClick={onOpenGenerator}
            className="border-2 border-indigo-200 rounded-xl p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Recommended
              </span>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="h-7 w-7 text-indigo-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Generate with Our Wizard
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Create a customized {documentName.toLowerCase()} using our step-by-step builder. 
              Pre-fills your business info, includes digital signatures, and exports to PDF.
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Smart pre-fill from your profile
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Customizable clauses & terms
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Digital signature capture
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Print or save as PDF
              </li>
            </ul>
            <Button className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              Start Generator
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Option 2: Upload */}
          <div 
            onClick={() => setMode('upload')}
            className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 transition-all group"
          >
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-7 w-7 text-gray-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Existing Document
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Already have a {documentName.toLowerCase()}? Upload your signed document 
              to keep everything in one place.
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-gray-400" />
                PDF, PNG, or JPG format
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-gray-400" />
                Up to 10MB file size
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-gray-400" />
                Secure document storage
              </li>
            </ul>
            <Button variant="outline" className="w-full mt-4">
              Upload Document
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* External resources */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Or use an external service</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {AGREEMENT_RESOURCES.map((resource) => (
              <a 
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{resource.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    resource.type === 'Free Template' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {resource.type}
                  </span>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Upload mode
  return (
    <div className="space-y-6">
      {/* Back button */}
      <button 
        onClick={() => setMode('choose')}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to options
      </button>

      {/* Header */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Existing {documentName}
        </h4>
        <p className="text-gray-600 mt-1 text-sm">
          Upload your signed {documentName.toLowerCase()} and add the signatory details.
        </p>
      </div>

      {/* Upload section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
        />
        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">Document uploaded</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 inline-flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-slate-200 rounded"
                title="Remove file"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Different File
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Upload your {documentName.toLowerCase()}</p>
            <p className="text-sm text-gray-500 mt-1">PDF, PNG, or JPG up to 10MB</p>
            <Button 
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </>
        )}
      </div>

      {/* Signatories */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Signatories
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          Add the names of everyone who signed the {documentName.toLowerCase()}.
        </p>
        
        {signatories.length > 0 && (
          <div className="space-y-2 mb-3">
            {signatories.map((name) => (
              <div key={name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-700 font-medium text-sm">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{name}</span>
                </div>
                <button
                  onClick={() => handleRemoveSignatory(name)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            value={newSignatory}
            onChange={(e) => setNewSignatory(e.target.value)}
            placeholder="Enter signatory name"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSignatory()}
          />
          <Button 
            variant="outline" 
            onClick={handleAddSignatory}
            disabled={!newSignatory.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Signed date */}
      <div>
        <Label htmlFor="signedDate">Date Signed *</Label>
        <Input
          id="signedDate"
          type="date"
          value={signedDate}
          onChange={(e) => setSignedDate(e.target.value)}
          className="mt-1 max-w-xs"
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setMode('choose')}>
          Cancel
        </Button>
        <Button 
          onClick={() => onComplete({ type: 'custom', signatories, signedDate })} 
          disabled={!isUploadValid || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save & Complete'}
        </Button>
      </div>
    </div>
  );
}

// Generate default compliance items based on business type and state
function generateDefaultComplianceItems(
  businessType: string, 
  state: string, 
  formationDate?: string
): Omit<ComplianceItem, 'id'>[] {
  const isLLC = businessType?.toLowerCase().includes('llc');
  const isCorp = businessType?.toLowerCase().includes('corp') || businessType?.toLowerCase().includes('inc');
  const today = new Date();
  const yearEnd = new Date(today.getFullYear(), 11, 31);
  const nextYearEnd = new Date(today.getFullYear() + 1, 11, 31);
  
  // Calculate annual report due date (varies by state)
  const getAnnualReportDueDate = () => {
    // Most states have it due on anniversary or within first quarter
    const baseDate = formationDate ? new Date(formationDate) : today;
    const dueDate = new Date(today.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate());
    if (dueDate <= today) {
      dueDate.setFullYear(dueDate.getFullYear() + 1);
    }
    return dueDate.toISOString().split('T')[0];
  };

  const items: Omit<ComplianceItem, 'id'>[] = [
    // State Annual Report
    {
      title: `${state} Annual Report`,
      description: `File your annual report with the ${state} Secretary of State to maintain good standing.`,
      dueDate: getAnnualReportDueDate(),
      frequency: 'annual',
      category: 'state_filing',
      status: 'pending',
      reminderDays: 30,
    },
    // Federal Tax Return
    {
      title: 'Federal Tax Return',
      description: isCorp 
        ? 'File Form 1120 (C-Corp) or 1120-S (S-Corp) with the IRS.'
        : isLLC 
          ? 'File Form 1065 (Partnership) or Schedule C (Single-member) with the IRS.'
          : 'File your business federal tax return with the IRS.',
      dueDate: `${today.getFullYear() + 1}-03-15`,
      frequency: 'annual',
      category: 'federal_tax',
      status: 'pending',
      reminderDays: 60,
    },
    // State Tax Return
    {
      title: `${state} State Tax Return`,
      description: `File your state business tax return with ${state} Department of Revenue.`,
      dueDate: `${today.getFullYear() + 1}-04-15`,
      frequency: 'annual',
      category: 'state_tax',
      status: 'pending',
      reminderDays: 60,
    },
  ];

  // Quarterly estimated taxes
  const quarterDates = [
    { quarter: 'Q1', date: `${today.getFullYear()}-04-15` },
    { quarter: 'Q2', date: `${today.getFullYear()}-06-15` },
    { quarter: 'Q3', date: `${today.getFullYear()}-09-15` },
    { quarter: 'Q4', date: `${today.getFullYear() + 1}-01-15` },
  ];

  quarterDates.forEach(({ quarter, date }) => {
    if (new Date(date) > today) {
      items.push({
        title: `${quarter} Estimated Tax Payment`,
        description: 'Pay quarterly estimated federal and state taxes if applicable.',
        dueDate: date,
        frequency: 'quarterly',
        category: 'federal_tax',
        status: 'pending',
        reminderDays: 14,
      });
    }
  });

  // Business license renewal (typically annual)
  items.push({
    title: 'Business License Renewal',
    description: 'Renew your local business license to continue operations.',
    dueDate: yearEnd.toISOString().split('T')[0],
    frequency: 'annual',
    category: 'license',
    status: 'pending',
    reminderDays: 30,
  });

  // Insurance review
  items.push({
    title: 'Business Insurance Review',
    description: 'Review and renew business insurance policies (liability, property, etc.).',
    dueDate: nextYearEnd.toISOString().split('T')[0],
    frequency: 'annual',
    category: 'insurance',
    status: 'pending',
    reminderDays: 45,
  });

  // Sort by due date
  return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

// Compliance category colors and icons
const CATEGORY_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  state_filing: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Building2, label: 'State Filing' },
  federal_tax: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: DollarSign, label: 'Federal Tax' },
  state_tax: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: DollarSign, label: 'State Tax' },
  license: { color: 'text-amber-700', bgColor: 'bg-amber-100', icon: FileText, label: 'License' },
  insurance: { color: 'text-green-700', bgColor: 'bg-green-100', icon: Shield, label: 'Insurance' },
  other: { color: 'text-gray-700', bgColor: 'bg-gray-100', icon: CalendarDays, label: 'Other' },
};

// Frequency labels
const FREQUENCY_LABELS: Record<string, string> = {
  once: 'One-time',
  annual: 'Annual',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
};

// Compliance Calendar Step Component
function ComplianceCalendarStep({
  profile,
  onComplete,
  isSaving,
}: {
  profile: any;
  onComplete: (items: ComplianceItem[]) => void;
  isSaving: boolean;
}) {
  const [view, setView] = useState<'timeline' | 'list' | 'calendar'>('timeline');
  const [items, setItems] = useState<ComplianceItem[]>(() => {
    // Use existing items or generate defaults
    if (profile?.complianceItems?.length > 0) {
      return profile.complianceItems;
    }
    return generateDefaultComplianceItems(
      profile?.businessType || 'LLC',
      profile?.formationState || 'NC',
      profile?.createdAt
    ).map((item, index) => ({ ...item, id: `item-${index}` }));
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ComplianceItem>>({
    title: '',
    description: '',
    dueDate: '',
    frequency: 'annual',
    category: 'other',
    status: 'pending',
    reminderDays: 30,
  });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    return {
      total: items.length,
      completed: items.filter(i => i.status === 'completed').length,
      upcoming: items.filter(i => {
        const due = new Date(i.dueDate);
        return i.status === 'pending' && due >= today && due <= thirtyDays;
      }).length,
      overdue: items.filter(i => {
        const due = new Date(i.dueDate);
        return i.status === 'pending' && due < today;
      }).length,
    };
  }, [items]);

  // Group items by month for timeline
  const itemsByMonth = useMemo(() => {
    const grouped: Record<string, ComplianceItem[]> = {};
    const sorted = [...items].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    sorted.forEach(item => {
      const date = new Date(item.dueDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    
    return grouped;
  }, [items]);

  // Handle marking item complete
  const handleToggleComplete = (itemId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const isCompleting = item.status !== 'completed';
        return {
          ...item,
          status: isCompleting ? 'completed' : 'pending',
          completedAt: isCompleting ? new Date().toISOString() : undefined,
        };
      }
      return item;
    }));
  };

  // Handle adding new item
  const handleAddItem = () => {
    if (!newItem.title || !newItem.dueDate) return;
    
    const item: ComplianceItem = {
      id: `custom-${Date.now()}`,
      title: newItem.title!,
      description: newItem.description,
      dueDate: newItem.dueDate!,
      frequency: newItem.frequency || 'annual',
      category: newItem.category || 'other',
      status: 'pending',
      reminderDays: newItem.reminderDays || 30,
    };
    
    setItems(prev => [...prev, item].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    ));
    setNewItem({
      title: '',
      description: '',
      dueDate: '',
      frequency: 'annual',
      category: 'other',
      status: 'pending',
      reminderDays: 30,
    });
    setShowAddModal(false);
  };

  // Handle removing item
  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get days until due
  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Get status badge for an item
  const getStatusBadge = (item: ComplianceItem) => {
    if (item.status === 'completed') {
      return (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </span>
      );
    }
    
    const daysUntil = getDaysUntil(item.dueDate);
    if (daysUntil < 0) {
      return (
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {Math.abs(daysUntil)} days overdue
        </span>
      );
    }
    if (daysUntil <= 7) {
      return (
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Due in {daysUntil} days
        </span>
      );
    }
    if (daysUntil <= 30) {
      return (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          Due in {daysUntil} days
        </span>
      );
    }
    return (
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
        {formatDate(item.dueDate)}
      </span>
    );
  };

  // Render calendar grid
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border" />);
    }
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayItems = items.filter(item => item.dueDate === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      
      days.push(
        <div 
          key={day} 
          className={`h-24 border p-1 overflow-hidden ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-0.5">
            {dayItems.slice(0, 2).map(item => {
              const config = CATEGORY_CONFIG[item.category];
              return (
                <div 
                  key={item.id}
                  className={`text-xs px-1 py-0.5 rounded truncate ${config.bgColor} ${config.color} ${
                    item.status === 'completed' ? 'line-through opacity-50' : ''
                  }`}
                  title={item.title}
                >
                  {item.title}
                </div>
              );
            })}
            {dayItems.length > 2 && (
              <div className="text-xs text-gray-500 px-1">+{dayItems.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-100">
        <h4 className="font-semibold text-emerald-900 text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Compliance Calendar
        </h4>
        <p className="text-emerald-800 mt-1 text-sm">
          Never miss an important deadline. Track annual reports, tax filings, license renewals, and more.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Items</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{stats.upcoming}</div>
          <div className="text-xs text-amber-600">Due in 30 Days</div>
        </div>
        <div className={`rounded-lg p-3 text-center ${stats.overdue > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border'}`}>
          <div className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-700' : 'text-gray-400'}`}>{stats.overdue}</div>
          <div className={`text-xs ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-500'}`}>Overdue</div>
        </div>
      </div>

      {/* View toggle and add button */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('timeline')}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ${
              view === 'timeline' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            Timeline
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ${
              view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ${
              view === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="space-y-6">
          {Object.entries(itemsByMonth).map(([monthKey, monthItems]) => {
            const [year, month] = monthKey.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
              month: 'long', year: 'numeric' 
            });
            
            return (
              <div key={monthKey}>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  {monthName}
                </h4>
                <div className="space-y-2 ml-6 border-l-2 border-gray-200 pl-4">
                  {monthItems.map(item => {
                    const config = CATEGORY_CONFIG[item.category];
                    const Icon = config.icon;
                    const isCompleted = item.status === 'completed';
                    
                    return (
                      <div 
                        key={item.id}
                        className={`relative flex items-start gap-3 p-3 rounded-lg border transition-all ${
                          isCompleted 
                            ? 'bg-gray-50 border-gray-200 opacity-75' 
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute -left-[1.65rem] w-3 h-3 rounded-full border-2 border-white ${
                          isCompleted ? 'bg-green-500' : config.bgColor.replace('bg-', 'bg-')
                        }`} style={{ top: '1.1rem' }} />
                        
                        {/* Category icon */}
                        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className={`font-medium text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
                                {item.title}
                              </h5>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                                  {config.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {FREQUENCY_LABELS[item.frequency]}
                                </span>
                                {item.reminderDays && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Bell className="h-3 w-3" />
                                    {item.reminderDays}d reminder
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(item)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleComplete(item.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isCompleted 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'hover:bg-gray-100 text-gray-400 hover:text-green-600'
                            }`}
                            title={isCompleted ? 'Mark as pending' : 'Mark as complete'}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => {
                const config = CATEGORY_CONFIG[item.category];
                const isCompleted = item.status === 'completed';
                
                return (
                  <tr key={item.id} className={isCompleted ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <div className={`font-medium text-gray-900 ${isCompleted ? 'line-through opacity-60' : ''}`}>
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleComplete(item.id)}
                          className={`p-1.5 rounded transition-colors ${
                            isCompleted ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="border rounded-lg overflow-hidden">
          {/* Calendar header */}
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h4 className="font-medium text-gray-900">
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h4>
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {renderCalendar()}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
          <Info className="h-4 w-4" />
          Compliance Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Set calendar reminders on your phone or email for important deadlines</li>
          <li>Keep copies of all filed documents in a secure location</li>
          <li>Review your compliance calendar quarterly to catch any changes</li>
          <li>Late filings can result in penalties, fees, or loss of good standing</li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button 
          onClick={() => onComplete(items)} 
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save & Complete Setup'}
        </Button>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Compliance Item</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="itemTitle">Title *</Label>
                <Input
                  id="itemTitle"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Quarterly Sales Tax Filing"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="itemDescription">Description</Label>
                <Input
                  id="itemDescription"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional details about this item"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="itemDueDate">Due Date *</Label>
                <Input
                  id="itemDueDate"
                  type="date"
                  value={newItem.dueDate}
                  onChange={(e) => setNewItem(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frequency</Label>
                  <select
                    value={newItem.frequency}
                    onChange={(e) => setNewItem(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="once">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                
                <div>
                  <Label>Category</Label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as any }))}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="state_filing">State Filing</option>
                    <option value="federal_tax">Federal Tax</option>
                    <option value="state_tax">State Tax</option>
                    <option value="license">License</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="reminderDays">Reminder (days before)</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="1"
                  max="90"
                  value={newItem.reminderDays}
                  onChange={(e) => setNewItem(prev => ({ ...prev, reminderDays: parseInt(e.target.value) || 30 }))}
                  className="mt-1 w-24"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddItem}
                disabled={!newItem.title || !newItem.dueDate}
              >
                Add Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step indicator component
function StepIndicator({ 
  step, 
  index, 
  currentStep, 
  onClick,
  isClickable,
}: { 
  step: { title: string; description: string; icon: React.ElementType; status: string };
  index: number;
  currentStep: number;
  onClick: () => void;
  isClickable: boolean;
}) {
  const Icon = step.icon;
  const isComplete = step.status === 'complete';
  const isCurrent = index === currentStep;
  const isLocked = step.status === 'locked';
  
  return (
    <div 
      className={`
        flex items-start gap-4 p-4 rounded-lg border transition-all
        ${isComplete ? 'bg-green-50 border-green-200' :
          isCurrent ? 'bg-blue-50 border-blue-200' :
          isLocked ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' :
          'bg-white border-gray-200 hover:border-blue-300 cursor-pointer'
        }
      `}
      onClick={isClickable && !isLocked ? onClick : undefined}
    >
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
        ${isComplete ? 'bg-green-600' :
          isCurrent ? 'bg-blue-600' :
          'bg-gray-200'
        }
      `}>
        {isComplete ? (
          <Check className="h-5 w-5 text-white" />
        ) : (
          <Icon className={`h-5 w-5 ${isCurrent ? 'text-white' : 'text-gray-500'}`} />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-medium ${isComplete ? 'text-green-800' : 'text-gray-900'}`}>
          {step.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
        {isCurrent && !isLocked && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={onClick}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
      <div className="text-right">
        {isComplete && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Complete
          </span>
        )}
        {isCurrent && !isLocked && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            In Progress
          </span>
        )}
        {isLocked && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            Locked
          </span>
        )}
      </div>
    </div>
  );
}

export default function OperationsPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const updateBankingStatusMutation = useUpdateBankingStatus();
  const updateOperatingAgreementStatusMutation = useUpdateOperatingAgreementStatus();
  const updateComplianceCalendarStatusMutation = useUpdateComplianceCalendarStatus();
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  
  // Check if formation is complete
  const formationComplete = profile?.einStatus === 'received' || 
    (profile?.formationStatus === 'filed' || profile?.formationStatus === 'approved');
  
  // Determine document name based on business type
  const isLLC = profile?.businessType?.toLowerCase().includes('llc');
  const documentName = isLLC ? 'Operating Agreement' : 'Bylaws';
  
  // Operations steps
  const steps = [
    {
      key: 'banking',
      title: 'Business Bank Account',
      description: 'Open a dedicated business bank account',
      icon: Landmark,
      status: profile?.readinessFlags?.bankAccountOpened ? 'complete' : 
        formationComplete ? 'pending' : 'locked',
    },
    {
      key: 'operating-agreement',
      title: documentName,
      description: `Create or upload your ${documentName.toLowerCase()}`,
      icon: Scale,
      status: profile?.readinessFlags?.operatingAgreementSigned ? 'complete' : 
        formationComplete ? 'pending' : 'locked',
    },
    {
      key: 'compliance',
      title: 'Compliance Calendar',
      description: 'Set up reminders for annual filings and deadlines',
      icon: Building2,
      status: profile?.readinessFlags?.complianceCalendarSetup ? 'complete' : 
        formationComplete ? 'pending' : 'locked',
    },
  ];
  
  const currentStep = steps.findIndex(s => s.status === 'pending');
  const progress = Math.round((steps.filter(s => s.status === 'complete').length / steps.length) * 100);
  
  const isLoading = profileLoading;
  const isSaving = updateBankingStatusMutation.isPending || 
    updateOperatingAgreementStatusMutation.isPending || 
    updateComplianceCalendarStatusMutation.isPending;
  
  // Save handler for banking
  const handleCompleteBanking = async (bankAccount: Partial<BankAccount>) => {
    await updateBankingStatusMutation.mutateAsync({
      status: 'account_opened',
      bankAccount,
    });
    await refetchProfile();
    setActiveModal(null);
  };
  
  // Save handler for operating agreement
  const handleCompleteOperatingAgreement = async (data: Partial<OperatingAgreement>) => {
    await updateOperatingAgreementStatusMutation.mutateAsync({
      status: 'signed',
      operatingAgreement: data,
    });
    await refetchProfile();
    setActiveModal(null);
  };
  
  // Save handler for compliance calendar
  const handleCompleteComplianceCalendar = async (items: ComplianceItem[]) => {
    await updateComplianceCalendarStatusMutation.mutateAsync({
      status: 'active',
      complianceItems: items,
    });
    await refetchProfile();
    setActiveModal(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  // Check if user should be here
  if (!formationComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-900 mb-2">Complete Formation First</h2>
          <p className="text-amber-800 mb-4">
            You need to complete your business formation before setting up operations.
          </p>
          <Button onClick={() => navigate('/app/formation')}>
            Go to Formation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/app')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Business Operations</h1>
        <p className="text-gray-600 mt-1">
          Set up your business for day-to-day operations
        </p>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Operations Progress</span>
          <span className="font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Steps */}
      <div className="space-y-3 mb-6">
        {steps.map((step, index) => (
          <StepIndicator
            key={step.key}
            step={step}
            index={index}
            currentStep={currentStep}
            onClick={() => setActiveModal(step.key)}
            isClickable={step.status !== 'locked'}
          />
        ))}
      </div>
      
      {/* Info boxes */}
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Formation Complete!</h4>
            <p className="text-sm text-green-800 mt-1">
              Your business is officially formed. Now let's set up the essentials for running your business.
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Why These Steps Matter</h4>
            <p className="text-sm text-blue-800 mt-1">
              Separating business and personal finances protects your liability protection. 
              An operating agreement defines how your business operates. 
              A compliance calendar ensures you never miss important deadlines.
            </p>
          </div>
        </div>
      </div>
      
      {/* Modal for Banking Step */}
      {activeModal === 'banking' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Business Bank Account</h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <BusinessBankingStep
                profile={profile}
                onComplete={handleCompleteBanking}
                isSaving={isSaving}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Operating Agreement Step */}
      {activeModal === 'operating-agreement' && !showGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{documentName}</h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <OperatingAgreementStep
                profile={profile}
                onComplete={handleCompleteOperatingAgreement}
                onOpenGenerator={() => setShowGenerator(true)}
                isSaving={isSaving}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Operating Agreement Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:bg-white print:p-0">
          <div className="bg-white rounded-lg w-full max-w-5xl h-[95vh] overflow-hidden flex flex-col print:max-w-none print:h-auto print:overflow-visible">
            <OperatingAgreementGenerator
              profile={profile}
              onComplete={(data) => {
                handleCompleteOperatingAgreement(data);
                setShowGenerator(false);
              }}
              onClose={() => setShowGenerator(false)}
            />
          </div>
        </div>
      )}
      
      {activeModal === 'compliance' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Compliance Calendar</h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ComplianceCalendarStep
                profile={profile}
                onComplete={handleCompleteComplianceCalendar}
                isSaving={isSaving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
