/**
 * Operations Page
 * Post-formation business operations setup
 */

import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { OperatingAgreementGenerator } from '../../components/OperatingAgreementGenerator';
import { 
  useProfile, 
  useUpdateBankingStatus,
  useUpdateOperatingAgreementStatus,
  type BankAccount,
  type OperatingAgreement,
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
  const isSaving = updateBankingStatusMutation.isPending || updateOperatingAgreementStatusMutation.isPending;
  
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
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Calendar</h2>
            <p className="text-gray-600 mb-4">This feature is coming soon.</p>
            <Button onClick={() => setActiveModal(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
