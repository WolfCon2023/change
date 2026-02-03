/**
 * App Layout
 * Main layout for the business application with sidebar, progress, and disclaimer
 * Updated: 2026-02-03 - New logo deployment
 */

import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Rocket,
  FileText,
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../stores/auth.store';
import { useHomeData } from '../lib/app-api';

// Navigation items
const navItems = [
  { path: '/app/home', label: 'Home', icon: Home },
  { path: '/app/setup', label: 'Business Setup', icon: Rocket },
  { path: '/app/formation', label: 'Formation', icon: FileText },
  { path: '/app/operations', label: 'Operations', icon: BarChart3 },
  { path: '/app/dashboards', label: 'Dashboards', icon: BarChart3 },
  { path: '/app/tasks', label: 'Tasks', icon: ClipboardList },
  { path: '/app/documents', label: 'Documents', icon: FileText },
];

// Disclaimer component
function Disclaimer() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Important:</strong> This platform provides guidance and templates and is not legal or tax advice. 
          Consult qualified professionals for advice specific to your situation.
        </p>
      </div>
    </div>
  );
}

// Progress indicator component
function ProgressIndicator({ progress }: { progress: { overall: number; setup: number; formation: number; operations: number } }) {
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
        <span className="text-sm font-bold text-blue-600">{progress.overall}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress.overall}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          {progress.setup === 100 ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <Clock className="h-3 w-3 text-amber-500" />
          )}
          <span className="text-gray-600">Setup: {progress.setup}%</span>
        </div>
        <div className="flex items-center gap-1">
          {progress.formation === 100 ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <Clock className="h-3 w-3 text-amber-500" />
          )}
          <span className="text-gray-600">Formation: {progress.formation}%</span>
        </div>
        <div className="flex items-center gap-1">
          {progress.operations === 100 ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <Clock className="h-3 w-3 text-amber-500" />
          )}
          <span className="text-gray-600">Ops: {progress.operations}%</span>
        </div>
      </div>
    </div>
  );
}

// Next action card component
function NextActionCard({ nextAction, onNavigate }: { 
  nextAction: {
    title: string;
    description: string;
    buttonLabel: string;
    route?: string;
    priority: string;
  };
  onNavigate: (route: string) => void;
}) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-amber-200 bg-amber-50',
    low: 'border-blue-200 bg-blue-50',
  };
  
  const priorityColor = priorityColors[nextAction.priority as keyof typeof priorityColors] || priorityColors.medium;
  
  return (
    <div className={`border rounded-lg p-4 mb-4 ${priorityColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{nextAction.title}</h3>
          <p className="text-xs text-gray-600 mt-1">{nextAction.description}</p>
        </div>
        {nextAction.route && (
          <Button 
            size="sm" 
            onClick={() => onNavigate(nextAction.route!)}
            className="ml-3 flex-shrink-0"
          >
            {nextAction.buttonLabel}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: homeData, isLoading } = useHomeData();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleNavigate = (route: string) => {
    navigate(route);
    setSidebarOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-30 px-4 h-16 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <img src="/logo-v2.png" alt="C.H.A.N.G.E." className="h-12 w-auto max-w-[200px]" />
        <div className="w-9" /> {/* Spacer */}
      </header>
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 bottom-0 w-80 bg-white border-r z-40 flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo - Fixed at top */}
        <div className="h-24 flex items-center justify-center px-2 border-b bg-white flex-shrink-0">
          <Link to="/app/home" className="flex items-center">
            <img 
              src="/logo-v2.png" 
              alt="C.H.A.N.G.E. Business Application" 
              className="h-20 w-auto"
            />
          </Link>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Progress indicator */}
          <div className="p-4">
            {!isLoading && homeData?.progress && (
              <ProgressIndicator progress={homeData.progress} />
            )}
            
            {/* Next action */}
            {!isLoading && homeData?.nextAction && (
              <NextActionCard 
                nextAction={homeData.nextAction} 
                onNavigate={handleNavigate}
              />
            )}
          </div>
          
          {/* Navigation */}
          <nav className="px-3 pb-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/app/home' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                        transition-colors
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Blockers (if any) */}
          {!isLoading && homeData?.blockers && homeData.blockers.length > 0 && (
            <div className="px-4 pb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Blockers ({homeData.blockers.length})
                </h4>
                <ul className="space-y-1">
                  {homeData.blockers.slice(0, 3).map((blocker, i) => (
                    <li key={i} className="text-xs text-red-700">
                      {blocker.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* User section - Fixed at bottom */}
        <div className="border-t bg-gray-50 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-medium text-sm">
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <main className="lg:ml-80 pt-16 lg:pt-0 min-h-screen">
        {/* Disclaimer banner */}
        <Disclaimer />
        
        {/* Page content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
