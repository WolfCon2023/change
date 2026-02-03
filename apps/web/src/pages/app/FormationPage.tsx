/**
 * Formation Page
 * Stepper-based formation workflow
 * 
 * NOTE: This is a placeholder. Full implementation will come with Module 2 (Workflow Engine).
 */

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
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useProfile, useSetupStatus } from '../../lib/app-api';

// Step component
function FormationStep({ 
  step, 
  index, 
  currentStep, 
  onClick 
}: { 
  step: { title: string; description: string; icon: React.ElementType; status: string };
  index: number;
  currentStep: number;
  onClick: () => void;
}) {
  const Icon = step.icon;
  const isComplete = step.status === 'complete';
  const isCurrent = index === currentStep;
  const isLocked = step.status === 'locked';
  
  return (
    <div 
      className={`
        flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all
        ${isComplete ? 'bg-green-50 border-green-200' :
          isCurrent ? 'bg-blue-50 border-blue-200' :
          isLocked ? 'bg-gray-50 border-gray-200 opacity-60' :
          'bg-white border-gray-200 hover:border-blue-300'
        }
      `}
      onClick={onClick}
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
        {isCurrent && (
          <div className="mt-3 flex gap-2">
            <Button size="sm">
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
        {isCurrent && (
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
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: setupStatus, isLoading: setupLoading } = useSetupStatus();
  
  // Formation steps
  const steps = [
    {
      title: 'Business Address',
      description: 'Add your principal place of business address',
      icon: MapPin,
      status: profile?.readinessFlags?.addressVerified ? 'complete' : 'pending',
    },
    {
      title: 'Registered Agent',
      description: 'Designate a registered agent to receive legal documents',
      icon: ShieldCheck,
      status: profile?.readinessFlags?.registeredAgentSet ? 'complete' : 'pending',
    },
    {
      title: 'Owners and Officers',
      description: 'Add the people who will own and manage your business',
      icon: Users,
      status: profile?.readinessFlags?.ownersAdded ? 'complete' : 'pending',
    },
    {
      title: 'Secretary of State Filing',
      description: 'Generate formation documents and file with your state',
      icon: Building,
      status: profile?.formationStatus === 'filed' || profile?.formationStatus === 'approved' ? 'complete' : 'pending',
    },
    {
      title: 'EIN Application',
      description: 'Apply for your Employer Identification Number with the IRS',
      icon: FileText,
      status: profile?.einStatus === 'received' ? 'complete' : profile?.formationStatus === 'approved' ? 'pending' : 'locked',
    },
  ];
  
  const currentStep = steps.findIndex(s => s.status === 'pending');
  const progress = Math.round((steps.filter(s => s.status === 'complete').length / steps.length) * 100);
  
  const isLoading = profileLoading || setupLoading;
  
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
            key={index}
            step={step}
            index={index}
            currentStep={currentStep}
            onClick={() => {}}
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
    </div>
  );
}
