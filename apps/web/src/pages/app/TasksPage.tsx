/**
 * Tasks Page
 * Task board and list view
 * 
 * NOTE: Placeholder - full implementation in Module 4.
 */

import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function TasksPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your business tasks</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
      
      <div className="bg-white border rounded-lg p-12 text-center">
        <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Yet</h2>
        <p className="text-gray-600 mb-4">
          Tasks will be automatically created as you progress through formation and operations.
        </p>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>
    </div>
  );
}
