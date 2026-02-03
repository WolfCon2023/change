/**
 * Dashboards Page
 * KPI dashboards by archetype
 */

import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  FileText, 
  CheckCircle, 
  Building2, 
  Landmark, 
  Scale,
  Calendar,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useProfile, useHomeData } from '../../lib/app-api';

export default function DashboardsPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: homeData, isLoading: homeLoading } = useHomeData();
  
  const isLoading = profileLoading || homeLoading;
  
  // Calculate completion stats
  const flags = profile?.readinessFlags || {};
  const formationComplete = profile?.einStatus === 'received' || 
    (profile?.formationStatus === 'filed' || profile?.formationStatus === 'approved');
  
  const operationsItems = [
    { label: 'Bank Account', done: flags.bankAccountOpened, icon: Landmark },
    { label: 'Operating Agreement', done: flags.operatingAgreementSigned, icon: Scale },
    { label: 'Compliance Calendar', done: flags.complianceCalendarSetup, icon: Calendar },
  ];
  
  const completedOps = operationsItems.filter(i => i.done).length;
  const totalOps = operationsItems.length;
  
  // Count compliance items
  const complianceItems = profile?.complianceItems || [];
  const pendingCompliance = complianceItems.filter((i: any) => i.status === 'pending').length;
  const overdueCompliance = complianceItems.filter((i: any) => {
    const due = new Date(i.dueDate);
    return i.status === 'pending' && due < new Date();
  }).length;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {profile?.businessName || 'Your Business'} - {profile?.archetype?.name || 'Overview'}
          </p>
        </div>
      </div>
      
      {/* Progress Cards */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Overall Progress</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{homeData?.progress?.overall || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-green-500 h-1.5 rounded-full" 
              style={{ width: `${homeData?.progress?.overall || 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Setup</span>
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{homeData?.progress?.setup || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-blue-500 h-1.5 rounded-full" 
              style={{ width: `${homeData?.progress?.setup || 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Formation</span>
            <FileText className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{homeData?.progress?.formation || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-purple-500 h-1.5 rounded-full" 
              style={{ width: `${homeData?.progress?.formation || 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Operations</span>
            <Target className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{homeData?.progress?.operations || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-amber-500 h-1.5 rounded-full" 
              style={{ width: `${homeData?.progress?.operations || 0}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Status Overview */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Business Status */}
        <div className="bg-white border rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            Business Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Business Name</span>
              <span className="font-medium text-gray-900">{profile?.businessName || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Entity Type</span>
              <span className="font-medium text-gray-900">{profile?.businessType || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">State</span>
              <span className="font-medium text-gray-900">{profile?.formationState || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Formation Status</span>
              <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                formationComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {formationComplete ? 'Complete' : profile?.formationStatus || 'Not Started'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">EIN Status</span>
              <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                profile?.einStatus === 'received' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {profile?.einStatus === 'received' ? 'Received' : profile?.einStatus || 'Not Started'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Operations Checklist */}
        <div className="bg-white border rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gray-500" />
            Operations Checklist
          </h3>
          <div className="space-y-3">
            {operationsItems.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.label}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    item.done ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.done ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    {item.done ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Icon className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <span className={`font-medium ${item.done ? 'text-green-700' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {item.done && (
                    <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      Complete
                    </span>
                  )}
                </div>
              );
            })}
            <div className="pt-3 border-t mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Completion</span>
                <span className="font-medium text-gray-900">{completedOps} of {totalOps}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Compliance Summary */}
      {flags.complianceCalendarSetup && complianceItems.length > 0 && (
        <div className="bg-white border rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            Compliance Overview
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <button 
              onClick={() => navigate('/app/tasks?category=compliance')}
              className="bg-blue-50 rounded-lg p-4 text-center hover:bg-blue-100 transition-colors cursor-pointer group"
            >
              <div className="text-3xl font-bold text-blue-700">{complianceItems.length}</div>
              <div className="text-sm text-blue-600 flex items-center justify-center gap-1">
                Total Items
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <button 
              onClick={() => navigate('/app/tasks?filter=pending&category=compliance')}
              className="bg-amber-50 rounded-lg p-4 text-center hover:bg-amber-100 transition-colors cursor-pointer group"
            >
              <div className="text-3xl font-bold text-amber-700">{pendingCompliance}</div>
              <div className="text-sm text-amber-600 flex items-center justify-center gap-1">
                Pending
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
            <button 
              onClick={() => navigate('/app/tasks?filter=overdue&category=compliance')}
              className={`rounded-lg p-4 text-center transition-colors cursor-pointer group ${
                overdueCompliance > 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'
              }`}
            >
              <div className={`text-3xl font-bold ${overdueCompliance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {overdueCompliance}
              </div>
              <div className={`text-sm flex items-center justify-center gap-1 ${
                overdueCompliance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                Overdue
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>
          {overdueCompliance > 0 && (
            <button 
              onClick={() => navigate('/app/tasks?filter=overdue&category=compliance')}
              className="mt-4 w-full p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 text-sm flex-1 text-left">
                You have {overdueCompliance} overdue compliance item{overdueCompliance > 1 ? 's' : ''}. 
                Click to review.
              </span>
              <ArrowRight className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
      )}
      
      {/* Next Steps */}
      {homeData?.nextAction && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-5">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Next Step
          </h3>
          <p className="text-blue-800 mb-1 font-medium">{homeData.nextAction.title}</p>
          <p className="text-blue-700 text-sm">{homeData.nextAction.description}</p>
        </div>
      )}
    </div>
  );
}
