/**
 * Formation Page
 * Stepper-based formation workflow with functional forms
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  FileText,
  AlertTriangle,
  Info,
  Building,
  Users,
  MapPin,
  ShieldCheck,
  X,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  useProfile, 
  useSetupStatus, 
  useUpdateProfile,
  useAddOwners,
  useUpdateFormationStatus,
  useUpdateEINStatus,
} from '../../lib/app-api';

// US States for dropdown
const usStates = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

// Address form component
interface AddressFormData {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
}

// Modal component
function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Business Address Form
function BusinessAddressForm({ 
  initialData, 
  onSave, 
  onCancel,
  isSaving,
}: { 
  initialData?: AddressFormData;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<AddressFormData>({
    street1: initialData?.street1 || '',
    street2: initialData?.street2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
  });
  
  const isValid = formData.street1 && formData.city && formData.state && formData.zipCode;
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="street1">Street Address *</Label>
        <Input
          id="street1"
          value={formData.street1}
          onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
          placeholder="123 Main Street"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="street2">Suite/Unit (optional)</Label>
        <Input
          id="street2"
          value={formData.street2}
          onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
          placeholder="Suite 100"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="City"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <select
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Select state</option>
            {usStates.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-1/2">
        <Label htmlFor="zipCode">ZIP Code *</Label>
        <Input
          id="zipCode"
          value={formData.zipCode}
          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          placeholder="12345"
          className="mt-1"
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)} disabled={!isValid || isSaving}>
          {isSaving ? 'Saving...' : 'Save Address'}
        </Button>
      </div>
    </div>
  );
}

// Registered Agent Form
function RegisteredAgentForm({ 
  initialData, 
  onSave, 
  onCancel,
  isSaving,
}: { 
  initialData?: { type: string; name: string; address: AddressFormData };
  onSave: (data: { type: string; name: string; address: AddressFormData }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [agentType, setAgentType] = useState(initialData?.type || 'self');
  const [agentName, setAgentName] = useState(initialData?.name || '');
  const [address, setAddress] = useState<AddressFormData>({
    street1: initialData?.address?.street1 || '',
    street2: initialData?.address?.street2 || '',
    city: initialData?.address?.city || '',
    state: initialData?.address?.state || '',
    zipCode: initialData?.address?.zipCode || '',
  });
  
  const isValid = agentName && address.street1 && address.city && address.state && address.zipCode;
  
  return (
    <div className="space-y-4">
      <div>
        <Label>Agent Type *</Label>
        <div className="mt-2 space-y-2">
          {[
            { value: 'self', label: 'I will be my own registered agent' },
            { value: 'individual', label: 'Another individual' },
            { value: 'commercial', label: 'Commercial registered agent service' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="agentType"
                value={option.value}
                checked={agentType === option.value}
                onChange={(e) => setAgentType(e.target.value)}
                className="h-4 w-4"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="agentName">Agent Name *</Label>
        <Input
          id="agentName"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder={agentType === 'commercial' ? 'Company Name' : 'Full Legal Name'}
          className="mt-1"
        />
      </div>
      
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-3">Agent Address</h4>
        <p className="text-sm text-gray-600 mb-4">
          Must be a physical address in your state of formation (no P.O. boxes).
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="raStreet1">Street Address *</Label>
            <Input
              id="raStreet1"
              value={address.street1}
              onChange={(e) => setAddress({ ...address, street1: e.target.value })}
              placeholder="123 Main Street"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="raStreet2">Suite/Unit (optional)</Label>
            <Input
              id="raStreet2"
              value={address.street2}
              onChange={(e) => setAddress({ ...address, street2: e.target.value })}
              placeholder="Suite 100"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="raCity">City *</Label>
              <Input
                id="raCity"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                placeholder="City"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="raState">State *</Label>
              <select
                id="raState"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select state</option>
                {usStates.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-1/2">
            <Label htmlFor="raZipCode">ZIP Code *</Label>
            <Input
              id="raZipCode"
              value={address.zipCode}
              onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
              placeholder="12345"
              className="mt-1"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button 
          onClick={() => onSave({ type: agentType, name: agentName, address })} 
          disabled={!isValid || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Registered Agent'}
        </Button>
      </div>
    </div>
  );
}

// Owner/Officer interface
interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  ownershipPercentage: string;
  email: string;
}

// Owners Form
function OwnersForm({ 
  initialOwners, 
  onSave, 
  onCancel,
  isSaving,
}: { 
  initialOwners?: Owner[];
  onSave: (owners: Owner[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [owners, setOwners] = useState<Owner[]>(
    initialOwners?.length ? initialOwners : [
      { id: '1', firstName: '', lastName: '', title: 'Member', ownershipPercentage: '100', email: '' }
    ]
  );
  
  const addOwner = () => {
    setOwners([
      ...owners,
      { id: Date.now().toString(), firstName: '', lastName: '', title: 'Member', ownershipPercentage: '', email: '' }
    ]);
  };
  
  const removeOwner = (id: string) => {
    if (owners.length > 1) {
      setOwners(owners.filter(o => o.id !== id));
    }
  };
  
  const updateOwner = (id: string, field: keyof Owner, value: string) => {
    setOwners(owners.map(o => o.id === id ? { ...o, [field]: value } : o));
  };
  
  const totalOwnership = owners.reduce((sum, o) => sum + (parseFloat(o.ownershipPercentage) || 0), 0);
  const isValid = owners.every(o => o.firstName && o.lastName && o.title) && totalOwnership === 100;
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Add all owners (members) and officers of your business. Total ownership must equal 100%.
      </p>
      
      {owners.map((owner, index) => (
        <div key={owner.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Owner {index + 1}</h4>
            {owners.length > 1 && (
              <button 
                onClick={() => removeOwner(owner.id)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input
                value={owner.firstName}
                onChange={(e) => updateOwner(owner.id, 'firstName', e.target.value)}
                placeholder="First name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={owner.lastName}
                onChange={(e) => updateOwner(owner.id, 'lastName', e.target.value)}
                placeholder="Last name"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Title/Role *</Label>
              <select
                value={owner.title}
                onChange={(e) => updateOwner(owner.id, 'title', e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="Member">Member</option>
                <option value="Managing Member">Managing Member</option>
                <option value="President">President</option>
                <option value="CEO">CEO</option>
                <option value="Director">Director</option>
                <option value="Officer">Officer</option>
              </select>
            </div>
            <div>
              <Label>Ownership % *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={owner.ownershipPercentage}
                onChange={(e) => updateOwner(owner.id, 'ownershipPercentage', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label>Email (optional)</Label>
            <Input
              type="email"
              value={owner.email}
              onChange={(e) => updateOwner(owner.id, 'email', e.target.value)}
              placeholder="email@example.com"
              className="mt-1"
            />
          </div>
        </div>
      ))}
      
      <Button variant="outline" onClick={addOwner} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Owner
      </Button>
      
      <div className={`p-3 rounded-lg ${totalOwnership === 100 ? 'bg-green-50' : 'bg-amber-50'}`}>
        <p className={`text-sm font-medium ${totalOwnership === 100 ? 'text-green-700' : 'text-amber-700'}`}>
          Total Ownership: {totalOwnership}%
          {totalOwnership !== 100 && ' (must equal 100%)'}
        </p>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={() => onSave(owners)} disabled={!isValid || isSaving}>
          {isSaving ? 'Saving...' : 'Save Owners'}
        </Button>
      </div>
    </div>
  );
}

// SOS Filing Step
function SOSFilingStep({ 
  profile, 
  onComplete,
  isSaving,
}: { 
  profile: any;
  onComplete: () => void;
  isSaving: boolean;
}) {
  const [hasConfirmation, setHasConfirmation] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900">Filing with {profile?.formationState} Secretary of State</h4>
        <p className="text-sm text-blue-800 mt-1">
          You will need to file your formation documents with your state. This platform helps you prepare 
          but does not submit filings on your behalf.
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Checklist</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>Business address verified</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>Registered agent designated</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>Owners and officers added</span>
          </li>
        </ul>
      </div>
      
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Next Steps</h4>
        <ol className="space-y-2 text-sm list-decimal list-inside">
          <li>Download or generate your Articles of Organization</li>
          <li>File with {profile?.formationState} Secretary of State</li>
          <li>Pay the filing fee (varies by state)</li>
          <li>Upload your filing confirmation below</li>
        </ol>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Upload filing confirmation</p>
        <p className="text-xs text-gray-500 mt-1">PDF, PNG, or JPG up to 10MB</p>
        <Button variant="outline" className="mt-3" size="sm">
          Choose File
        </Button>
      </div>
      
      <label className="flex items-start gap-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={hasConfirmation}
          onChange={(e) => setHasConfirmation(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm text-gray-700">
          I confirm that I have filed my formation documents with the Secretary of State
        </span>
      </label>
      
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <Button onClick={onComplete} disabled={!hasConfirmation || isSaving}>
          {isSaving ? 'Saving...' : 'Mark as Complete'}
        </Button>
      </div>
    </div>
  );
}

// EIN Application Step
function EINApplicationStep({ 
  onComplete,
  isSaving,
}: { 
  onComplete: (einNumber: string) => void;
  isSaving: boolean;
}) {
  const [hasEIN, setHasEIN] = useState(false);
  const [localEinNumber, setLocalEinNumber] = useState('');
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900">Employer Identification Number (EIN)</h4>
        <p className="text-sm text-blue-800 mt-1">
          An EIN is required for tax purposes, opening bank accounts, and hiring employees.
          Apply for free at IRS.gov.
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">How to Apply</h4>
        <ol className="space-y-2 text-sm list-decimal list-inside">
          <li>Go to <a href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">IRS EIN Assistant</a></li>
          <li>Complete the online application (takes about 10 minutes)</li>
          <li>Receive your EIN immediately upon completion</li>
          <li>Enter your EIN below and upload the confirmation letter</li>
        </ol>
      </div>
      
      <div>
        <Label htmlFor="einNumber">EIN Number</Label>
        <Input
          id="einNumber"
          value={localEinNumber}
          onChange={(e) => setLocalEinNumber(e.target.value)}
          placeholder="XX-XXXXXXX"
          className="mt-1 max-w-xs"
        />
        <p className="text-xs text-gray-500 mt-1">Format: XX-XXXXXXX</p>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Upload EIN confirmation letter</p>
        <p className="text-xs text-gray-500 mt-1">PDF or image up to 10MB</p>
        <Button variant="outline" className="mt-3" size="sm">
          Choose File
        </Button>
      </div>
      
      <label className="flex items-start gap-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={hasEIN}
          onChange={(e) => setHasEIN(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm text-gray-700">
          I have received my EIN from the IRS
        </span>
      </label>
      
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <Button onClick={() => onComplete(localEinNumber)} disabled={!hasEIN || !localEinNumber || isSaving}>
          {isSaving ? 'Saving...' : 'Complete Formation'}
        </Button>
      </div>
    </div>
  );
}

// Step component
function FormationStep({ 
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

export default function FormationPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { data: setupStatus, isLoading: setupLoading } = useSetupStatus();
  const updateProfileMutation = useUpdateProfile();
  const addOwnersMutation = useAddOwners();
  const updateFormationStatusMutation = useUpdateFormationStatus();
  const updateEINStatusMutation = useUpdateEINStatus();
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Formation steps
  const steps = [
    {
      key: 'address',
      title: 'Business Address',
      description: 'Add your principal place of business address',
      icon: MapPin,
      status: profile?.readinessFlags?.addressVerified ? 'complete' : 'pending',
    },
    {
      key: 'agent',
      title: 'Registered Agent',
      description: 'Designate a registered agent to receive legal documents',
      icon: ShieldCheck,
      status: profile?.readinessFlags?.registeredAgentSet ? 'complete' : 'pending',
    },
    {
      key: 'owners',
      title: 'Owners and Officers',
      description: 'Add the people who will own and manage your business',
      icon: Users,
      status: profile?.readinessFlags?.ownersAdded ? 'complete' : 'pending',
    },
    {
      key: 'sos',
      title: 'Secretary of State Filing',
      description: 'Generate formation documents and file with your state',
      icon: Building,
      status: profile?.formationStatus === 'filed' || profile?.formationStatus === 'approved' ? 'complete' : 'pending',
    },
    {
      key: 'ein',
      title: 'EIN Application',
      description: 'Apply for your Employer Identification Number with the IRS',
      icon: FileText,
      status: profile?.einStatus === 'received' ? 'complete' : profile?.formationStatus === 'approved' ? 'pending' : 'locked',
    },
  ];
  
  const currentStep = steps.findIndex(s => s.status === 'pending');
  const progress = Math.round((steps.filter(s => s.status === 'complete').length / steps.length) * 100);
  
  const isLoading = profileLoading || setupLoading;
  const isSaving = updateProfileMutation.isPending || addOwnersMutation.isPending || 
    updateFormationStatusMutation.isPending || updateEINStatusMutation.isPending;
  
  // Save handlers
  const handleSaveAddress = async (data: AddressFormData) => {
    await updateProfileMutation.mutateAsync({
      businessAddress: {
        street1: data.street1,
        street2: data.street2 || undefined,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: 'USA',
      },
    });
    await refetchProfile();
    setActiveModal(null);
  };
  
  const handleSaveAgent = async (data: { type: string; name: string; address: AddressFormData }) => {
    await updateProfileMutation.mutateAsync({
      registeredAgent: {
        type: data.type as 'self' | 'commercial' | 'individual',
        name: data.name,
        address: {
          street1: data.address.street1,
          street2: data.address.street2 || undefined,
          city: data.address.city,
          state: data.address.state,
          zipCode: data.address.zipCode,
          country: 'USA',
        },
      },
    });
    await refetchProfile();
    setActiveModal(null);
  };
  
  const handleSaveOwners = async (owners: Owner[]) => {
    await addOwnersMutation.mutateAsync(
      owners.map(o => ({
        firstName: o.firstName,
        lastName: o.lastName,
        title: o.title,
        ownershipPercentage: parseFloat(o.ownershipPercentage) || 0,
        email: o.email || undefined,
      }))
    );
    await refetchProfile();
    setActiveModal(null);
  };
  
  const handleSOSComplete = async () => {
    await updateFormationStatusMutation.mutateAsync('filed');
    await refetchProfile();
    setActiveModal(null);
  };
  
  const handleEINComplete = async (ein: string) => {
    await updateEINStatusMutation.mutateAsync({ 
      status: 'received', 
      einNumber: ein || undefined 
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
  
  // If setup not complete, redirect
  if (!setupStatus?.hasStarted || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h2 className="font-semibold text-gray-900">Setup Required</h2>
              <p className="text-gray-600 mt-1">
                Please complete the business setup wizard before proceeding to formation.
              </p>
              <Button 
                className="mt-4"
                onClick={() => navigate('/app/setup')}
              >
                Go to Setup
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Formation</h1>
          <p className="text-gray-600 mt-1">
            {profile.businessName} - {profile.businessType?.toUpperCase()} in {profile.formationState}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{progress}%</div>
          <div className="text-sm text-gray-600">Complete</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <FormationStep
            key={step.key}
            step={step}
            index={index}
            currentStep={currentStep}
            onClick={() => setActiveModal(step.key)}
            isClickable={step.status !== 'locked'}
          />
        ))}
      </div>
      
      {/* Disclaimer */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Important:</strong> This platform helps you prepare formation documents and 
          guides you through the process. You are responsible for filing with your state's 
          Secretary of State and the IRS. We do not submit filings on your behalf.
        </div>
      </div>
      
      {/* Info */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Evidence Required:</strong> Each step may require you to upload evidence 
          (confirmation letters, receipts, etc.) to track your progress and maintain records.
        </div>
      </div>
      
      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'address'} 
        onClose={() => setActiveModal(null)}
        title="Business Address"
      >
        <BusinessAddressForm
          initialData={profile?.businessAddress}
          onSave={handleSaveAddress}
          onCancel={() => setActiveModal(null)}
          isSaving={isSaving}
        />
      </Modal>
      
      <Modal 
        isOpen={activeModal === 'agent'} 
        onClose={() => setActiveModal(null)}
        title="Registered Agent"
      >
        <RegisteredAgentForm
          initialData={profile?.registeredAgent}
          onSave={handleSaveAgent}
          onCancel={() => setActiveModal(null)}
          isSaving={isSaving}
        />
      </Modal>
      
      <Modal 
        isOpen={activeModal === 'owners'} 
        onClose={() => setActiveModal(null)}
        title="Owners and Officers"
      >
        <OwnersForm
          onSave={handleSaveOwners}
          onCancel={() => setActiveModal(null)}
          isSaving={isSaving}
        />
      </Modal>
      
      <Modal 
        isOpen={activeModal === 'sos'} 
        onClose={() => setActiveModal(null)}
        title="Secretary of State Filing"
      >
        <SOSFilingStep
          profile={profile}
          onComplete={handleSOSComplete}
          isSaving={isSaving}
        />
      </Modal>
      
      <Modal 
        isOpen={activeModal === 'ein'} 
        onClose={() => setActiveModal(null)}
        title="EIN Application"
      >
        <EINApplicationStep
          onComplete={handleEINComplete}
          isSaving={isSaving}
        />
      </Modal>
    </div>
  );
}
