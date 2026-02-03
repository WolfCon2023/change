/**
 * Dashboards Page
 * KPI dashboards by archetype
 * 
 * NOTE: Placeholder - full implementation in Module 6 (DMAIC).
 */

import { BarChart3, TrendingUp, Target } from 'lucide-react';
import { useProfile } from '../../lib/app-api';

export default function DashboardsPage() {
  const { data: profile } = useProfile();
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboards</h1>
          <p className="text-gray-600 mt-1">
            {profile?.archetype?.name || 'Business'} KPIs and metrics
          </p>
        </div>
      </div>
      
      {/* Placeholder KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">--</div>
          <p className="text-xs text-gray-500 mt-1">Formation completion</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Tasks</span>
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">--</div>
          <p className="text-xs text-gray-500 mt-1">Pending tasks</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Documents</span>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">--</div>
          <p className="text-xs text-gray-500 mt-1">Total documents</p>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg p-12 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Dashboards Coming Soon</h2>
        <p className="text-gray-600 mb-4 max-w-md mx-auto">
          Once your business is formed and operational, you will see KPI dashboards 
          tailored to your business archetype with recommended metrics.
        </p>
      </div>
    </div>
  );
}
