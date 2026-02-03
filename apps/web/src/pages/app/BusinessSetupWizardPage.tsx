/**
 * Business Setup Wizard Page
 * Guided wizard for business setup: archetype, entity, state, and info
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Briefcase,
  Home,
  ShoppingCart,
  Store,
  Utensils,
  Scissors,
  Dumbbell,
  Building,
  Hammer,
  Truck,
  Baby,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  useArchetypes,
  useArchetypePreview,
  useSetupStatus,
  useStartSetup,
  useSelectArchetype,
  useSelectEntityType,
  useSelectState,
  useCompleteSetup,
  Archetype,
} from '../../lib/app-api';
import { useAuthStore } from '../../stores/auth.store';

// Icon mapping for archetypes
const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  Home,
  ShoppingCart,
  Store,
  Utensils,
  Scissors,
  Dumbbell,
  Building,
  Hammer,
  Truck,
  Baby,
  Heart,
};

// Entity type options
const entityTypes = [
  { value: 'llc', label: 'LLC (Limited Liability Company)', description: 'Flexible structure with liability protection' },
  { value: 'corporation', label: 'Corporation', description: 'Traditional corporate structure with shareholders' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship', description: 'Simplest structure, no separation from owner' },
  { value: 'partnership', label: 'Partnership', description: 'Two or more owners sharing profits and liability' },
  { value: 'nonprofit', label: 'Nonprofit', description: 'Tax-exempt organization for charitable purposes' },
];

// US States
const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// Step indicator
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div 
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${index < currentStep 
                ? 'bg-green-600 text-white' 
                : index === currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }
            `}
          >
            {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`w-12 h-1 mx-2 ${index < currentStep ? 'bg-green-600' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Archetype card component
function ArchetypeCard({ 
  archetype, 
  isSelected, 
  onSelect,
  onPreview,
}: { 
  archetype: Archetype;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const Icon = iconMap[archetype.icon || 'Briefcase'] || Briefcase;
  
  return (
    <div 
      className={`
        border rounded-lg p-4 cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-blue-600' : 'bg-gray-100'
        }`}>
          <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm">{archetype.name}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{archetype.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {archetype.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {isSelected && (
          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
        )}
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full mt-3 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
      >
        Preview Details
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}

// Archetype preview modal
function ArchetypePreviewModal({ 
  archetypeKey, 
  onClose,
  onConfirm,
}: { 
  archetypeKey: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { data: preview, isLoading } = useArchetypePreview(archetypeKey);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-2xl mx-4">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!preview) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{preview.name}</h2>
            <p className="text-sm text-gray-600">{preview.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recommended Processes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Top Business Processes
              </h3>
              <ul className="space-y-2">
                {preview.topProcesses.map((process, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded flex items-center justify-center text-xs flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">{process.name}</span>
                      <p className="text-xs text-gray-600">{process.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Key KPIs */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Key Performance Indicators
              </h3>
              <ul className="space-y-2">
                {preview.topKPIs.slice(0, 5).map((kpi, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-gray-900">{kpi.name}</span>
                    <span className="text-gray-500 ml-2">({kpi.unit})</span>
                    <p className="text-xs text-gray-600">{kpi.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Key Risks */}
          {preview.keyRisks.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Key Compliance Considerations
              </h3>
              <ul className="space-y-2">
                {preview.keyRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      risk.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {risk.severity}
                    </span>
                    <div className="text-sm">
                      <span className="text-gray-900">{risk.item}</span>
                      {risk.mitigation && (
                        <p className="text-xs text-gray-600 mt-1">
                          <strong>Action:</strong> {risk.mitigation}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recommended Entity Types */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Recommended Entity Types</h3>
            <div className="flex gap-2">
              {preview.recommendedEntityTypes.map((type) => (
                <span key={type} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {type.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Select This Archetype
            <Check className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main wizard component
export default function BusinessSetupWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [previewArchetype, setPreviewArchetype] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [dbaName, setDbaName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // API hooks
  const { data: setupStatus, isLoading: statusLoading } = useSetupStatus();
  const { data: archetypes, isLoading: archetypesLoading } = useArchetypes(searchTerm);
  const startSetupMutation = useStartSetup();
  const selectArchetypeMutation = useSelectArchetype();
  const selectEntityTypeMutation = useSelectEntityType();
  const selectStateMutation = useSelectState();
  const completeSetupMutation = useCompleteSetup();
  
  const steps = ['Business Type', 'Entity Structure', 'State', 'Information'];
  
  // Initialize from status
  useEffect(() => {
    if (setupStatus) {
      if (setupStatus.archetypeKey) setSelectedArchetype(setupStatus.archetypeKey);
      if (setupStatus.entityType) setSelectedEntityType(setupStatus.entityType);
      if (setupStatus.state) setSelectedState(setupStatus.state);
      
      // Determine step based on progress
      if (setupStatus.isComplete) {
        navigate('/app/formation');
      } else if (setupStatus.currentStep === 'archetype') {
        setCurrentStep(0);
      } else if (setupStatus.currentStep === 'entity_type') {
        setCurrentStep(1);
      } else if (setupStatus.currentStep === 'state') {
        setCurrentStep(2);
      } else if (setupStatus.currentStep === 'business_info') {
        setCurrentStep(3);
      }
    }
    
    // Initialize email from user
    if (user?.email) {
      setEmail(user.email);
    }
  }, [setupStatus, user, navigate]);
  
  // Handle step from URL
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'archetype') setCurrentStep(0);
    else if (stepParam === 'entity') setCurrentStep(1);
    else if (stepParam === 'state') setCurrentStep(2);
    else if (stepParam === 'info') setCurrentStep(3);
  }, [searchParams]);
  
  // Filter archetypes by search
  const filteredArchetypes = archetypes?.filter(a => 
    !searchTerm || 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Handle next step
  const handleNext = async () => {
    if (currentStep === 0 && selectedArchetype) {
      // Start setup if not started
      if (!setupStatus?.hasStarted) {
        await startSetupMutation.mutateAsync({ 
          businessName: businessName || 'My Business',
          email: email || user?.email || '',
        });
      }
      await selectArchetypeMutation.mutateAsync(selectedArchetype);
      setCurrentStep(1);
    } else if (currentStep === 1 && selectedEntityType) {
      await selectEntityTypeMutation.mutateAsync(selectedEntityType);
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedState) {
      await selectStateMutation.mutateAsync(selectedState);
      setCurrentStep(3);
    } else if (currentStep === 3 && businessName && email) {
      await completeSetupMutation.mutateAsync({
        businessName,
        dbaName: dbaName || undefined,
        email,
        phone: phone || undefined,
      });
      navigate('/app/formation');
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const canProceed = () => {
    if (currentStep === 0) return !!selectedArchetype;
    if (currentStep === 1) return !!selectedEntityType;
    if (currentStep === 2) return !!selectedState;
    if (currentStep === 3) return !!(businessName && email);
    return false;
  };
  
  const isLoading = startSetupMutation.isPending || 
    selectArchetypeMutation.isPending || 
    selectEntityTypeMutation.isPending ||
    selectStateMutation.isPending ||
    completeSetupMutation.isPending;
  
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Setup Wizard</h1>
        <p className="text-gray-600 mt-1">
          Let's set up your business step by step
        </p>
      </div>
      
      {/* Progress indicator */}
      <StepIndicator currentStep={currentStep} steps={steps} />
      
      {/* Step content */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Step 1: Archetype selection */}
        {currentStep === 0 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              What type of business are you starting?
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Select the archetype that best describes your business. This helps us provide 
              personalized guidance, processes, and KPIs.
            </p>
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search business types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Archetype grid */}
            {archetypesLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto">
                {filteredArchetypes?.map((archetype) => (
                  <ArchetypeCard
                    key={archetype.key}
                    archetype={archetype}
                    isSelected={selectedArchetype === archetype.key}
                    onSelect={() => setSelectedArchetype(archetype.key)}
                    onPreview={() => setPreviewArchetype(archetype.key)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Entity type selection */}
        {currentStep === 1 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Select your entity structure
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose the legal structure for your business. This affects taxes, liability, and paperwork.
            </p>
            
            <div className="space-y-3">
              {entityTypes.map((entity) => (
                <div
                  key={entity.value}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedEntityType === entity.value 
                      ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                    }
                  `}
                  onClick={() => setSelectedEntityType(entity.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{entity.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{entity.description}</p>
                    </div>
                    {selectedEntityType === entity.value && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 3: State selection */}
        {currentStep === 2 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Select your formation state
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose the state where your business will be legally formed. This is typically 
              where you will operate or where you want to incorporate.
            </p>
            
            <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4 max-h-[400px] overflow-y-auto">
              {usStates.map((state) => (
                <div
                  key={state.value}
                  className={`
                    border rounded-lg px-4 py-3 cursor-pointer transition-all text-center
                    ${selectedState === state.value 
                      ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                    }
                  `}
                  onClick={() => setSelectedState(state.value)}
                >
                  <span className="text-xs font-bold text-gray-500">{state.value}</span>
                  <p className="text-sm font-medium text-gray-900">{state.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 4: Business information */}
        {currentStep === 3 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Business Information
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Provide basic information about your business. This will be used for formation documents.
            </p>
            
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Business, LLC"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="dbaName">DBA Name (optional)</Label>
                <Input
                  id="dbaName"
                  type="text"
                  value={dbaName}
                  onChange={(e) => setDbaName(e.target.value)}
                  placeholder="Doing Business As..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Trade name if different from legal name
                </p>
              </div>
              
              <div>
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@yourbusiness.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Business Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* Summary */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Setup Summary</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Business Type:</dt>
                  <dd className="font-medium text-gray-900">
                    {archetypes?.find(a => a.key === selectedArchetype)?.name || '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Entity Structure:</dt>
                  <dd className="font-medium text-gray-900">
                    {entityTypes.find(e => e.value === selectedEntityType)?.label || '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Formation State:</dt>
                  <dd className="font-medium text-gray-900">
                    {usStates.find(s => s.value === selectedState)?.label || '-'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : currentStep === steps.length - 1 ? (
              <>
                Complete Setup
                <Check className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Info card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Need help?</strong> Each archetype includes recommended processes, KPIs, and 
          compliance considerations tailored to your business type. You can preview details 
          before selecting.
        </div>
      </div>
      
      {/* Preview modal */}
      {previewArchetype && (
        <ArchetypePreviewModal
          archetypeKey={previewArchetype}
          onClose={() => setPreviewArchetype(null)}
          onConfirm={() => {
            setSelectedArchetype(previewArchetype);
            setPreviewArchetype(null);
          }}
        />
      )}
    </div>
  );
}
