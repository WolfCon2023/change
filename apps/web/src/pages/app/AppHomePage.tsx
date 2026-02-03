/**
 * App Home Page
 * Today view with next action, progress, blockers, and tasks
 */

import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  FileText,
  Rocket,
  Info,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useHomeData } from '../../lib/app-api';

// Priority badge component
function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700',
  };
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[priority as keyof typeof colors] || colors.medium}`}>
      {priority}
    </span>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status as keyof typeof colors] || colors.pending}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// Progress ring component
function ProgressRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-600 transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{progress}%</span>
      </div>
    </div>
  );
}

export default function AppHomePage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useHomeData();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading home data. Please try again.</p>
      </div>
    );
  }
  
  if (!data) {
    return null;
  }
  
  // Welcome state (no setup)
  if (!data.hasSetup) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to C.H.A.N.G.E.
          </h1>
          <p className="text-gray-600">
            Your guided platform for forming and operating your business
          </p>
        </div>
        
        {/* Next action card */}
        <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {data.nextAction.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {data.nextAction.description}
          </p>
          <Button 
            onClick={() => navigate(data.nextAction.route || '/app/setup')}
            className="w-full sm:w-auto"
          >
            {data.nextAction.buttonLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        {/* Info cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-white border rounded-lg p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 text-sm">Business Formation</h3>
            <p className="text-xs text-gray-600 mt-1">
              Guided steps for LLC, Corporation, and more
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <ClipboardList className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 text-sm">Task Management</h3>
            <p className="text-xs text-gray-600 mt-1">
              Track formation steps and business tasks
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 text-sm">Evidence Tracking</h3>
            <p className="text-xs text-gray-600 mt-1">
              Document uploads and audit trail
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Main home view
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {data.business?.name || 'Your Business'}
        </h1>
        {data.business?.archetype && (
          <p className="text-gray-600 mt-1">
            {data.business.archetype.name} • {data.business.type} • {data.business.state}
          </p>
        )}
      </div>
      
      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Progress and next action */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Best Action */}
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Next Best Action
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {data.nextAction.type === 'milestone' ? (
                    <Rocket className="h-6 w-6 text-blue-600" />
                  ) : data.nextAction.type === 'task' ? (
                    <ClipboardList className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Info className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{data.nextAction.title}</h3>
                    <PriorityBadge priority={data.nextAction.priority} />
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{data.nextAction.description}</p>
                  {data.nextAction.route && (
                    <Button onClick={() => navigate(data.nextAction.route!)}>
                      {data.nextAction.buttonLabel}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Blockers */}
          {data.blockers.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5" />
                Blocking Progress ({data.blockers.length})
              </h3>
              <ul className="space-y-2">
                {data.blockers.map((blocker) => (
                  <li 
                    key={blocker.id}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{blocker.title}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{blocker.description}</p>
                    </div>
                    {blocker.route && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(blocker.route!)}
                      >
                        Fix
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Tasks */}
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Pending Tasks</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/tasks')}>
                View All
              </Button>
            </div>
            {data.tasks.length > 0 ? (
              <ul className="divide-y">
                {data.tasks.map((task) => (
                  <li key={task.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No pending tasks</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Progress ring and alerts */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Your Progress</h2>
            <div className="flex justify-center mb-4">
              <ProgressRing progress={data.progress.overall} />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Setup</span>
                  <span className="font-medium">{data.progress.setup}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${data.progress.setup}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Formation</span>
                  <span className="font-medium">{data.progress.formation}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${data.progress.formation}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Operations</span>
                  <span className="font-medium">{data.progress.operations}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${data.progress.operations}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/app/setup')}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Business Setup
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/app/documents')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/app/tasks')}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                View Tasks
              </Button>
            </div>
          </div>
          
          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`border rounded-lg p-4 ${
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                    alert.type === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                  <p className="text-gray-600 text-xs mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
