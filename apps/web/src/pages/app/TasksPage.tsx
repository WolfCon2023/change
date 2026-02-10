/**
 * Tasks Page
 * Task management with auto-generated and custom tasks
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Check, 
  Clock, 
  AlertCircle,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  RefreshCw,
  Building2,
  FileText,
  Briefcase,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, type SimpleTask } from '../../lib/app-api';

// Category configuration
const CATEGORY_CONFIG = {
  setup: { label: 'Setup', icon: Building2, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  formation: { label: 'Formation', icon: FileText, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  operations: { label: 'Operations', icon: Briefcase, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  compliance: { label: 'Compliance', icon: Calendar, color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  general: { label: 'General', icon: ClipboardList, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
};

// Priority configuration
const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  medium: { label: 'Medium', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  low: { label: 'Low', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
};

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error, refetch } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    dueDate: '',
  });
  
  // Read URL params on mount and when they change
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    const categoryParam = searchParams.get('category');
    
    if (filterParam === 'pending' || filterParam === 'completed' || filterParam === 'overdue') {
      setFilter(filterParam);
    }
    if (categoryParam && categoryParam in CATEGORY_CONFIG) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);
  
  // Update URL when filters change
  const handleFilterChange = (newFilter: 'all' | 'pending' | 'completed' | 'overdue') => {
    setFilter(newFilter);
    const params = new URLSearchParams(searchParams);
    if (newFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', newFilter);
    }
    setSearchParams(params);
  };
  
  const handleCategoryChange = (category: string | null) => {
    setCategoryFilter(category);
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };
  
  // Check if task is overdue
  const isOverdue = (task: SimpleTask) => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };
  
  // Filter tasks
  const filteredTasks = data?.tasks.filter(task => {
    if (filter === 'pending' && task.status === 'completed') return false;
    if (filter === 'completed' && task.status !== 'completed') return false;
    if (filter === 'overdue' && !isOverdue(task)) return false;
    if (categoryFilter && task.category !== categoryFilter) return false;
    return true;
  }) || [];
  
  // Group tasks by category
  const tasksByCategory = filteredTasks.reduce((acc, task) => {
    const cat = task.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {} as Record<string, SimpleTask[]>);
  
  // Handle create task
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    await createTaskMutation.mutateAsync({
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      dueDate: newTask.dueDate || undefined,
    });
    
    setShowAddModal(false);
    setNewTask({ title: '', description: '', category: 'general', priority: 'medium', dueDate: '' });
  };
  
  // Handle status update
  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    await updateTaskMutation.mutateAsync({ id: taskId, status: newStatus });
  };
  
  // Handle delete task
  const handleDeleteTask = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTaskMutation.mutateAsync(id);
    }
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Tasks</h2>
          <p className="text-red-700 mb-4">Please try refreshing the page.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  const stats = data?.stats || { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your business tasks</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
        <div className="bg-white border rounded-lg p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-amber-700">{stats.pending + stats.inProgress}</div>
          <div className="text-xs text-amber-600">In Progress</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.completed}</div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
        <div className={`rounded-lg p-3 text-center ${stats.overdue > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border'}`}>
          <div className={`text-xl sm:text-2xl font-bold ${stats.overdue > 0 ? 'text-red-700' : 'text-gray-400'}`}>{stats.overdue}</div>
          <div className={`text-xs ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-500'}`}>Overdue</div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
              filter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
              filter === 'pending' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
              filter === 'completed' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => handleFilterChange('overdue')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
              filter === 'overdue' ? 'bg-white shadow text-red-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overdue
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter || ''}
            onChange={(e) => handleCategoryChange(e.target.value || null)}
            className="border rounded-md px-3 py-1.5 text-sm flex-1 sm:flex-none"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          
          {(categoryFilter || filter !== 'all') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { handleFilterChange('all'); handleCategoryChange(null); }}
              className="whitespace-nowrap"
            >
              Clear
              <X className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {filter !== 'all' || categoryFilter ? 'No Matching Tasks' : 'No Tasks Yet'}
          </h2>
          <p className="text-gray-600 mb-4">
            {filter !== 'all' || categoryFilter 
              ? 'Try adjusting your filters.'
              : 'Tasks will be automatically created as you progress through formation and operations.'}
          </p>
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(CATEGORY_CONFIG).map(([categoryKey, categoryConfig]) => {
            const categoryTasks = tasksByCategory[categoryKey];
            if (!categoryTasks?.length) return null;
            
            const CategoryIcon = categoryConfig.icon;
            
            return (
              <div key={categoryKey}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded ${categoryConfig.bgColor} flex items-center justify-center`}>
                    <CategoryIcon className={`h-3.5 w-3.5 ${categoryConfig.textColor}`} />
                  </div>
                  <h3 className="font-medium text-gray-900">{categoryConfig.label}</h3>
                  <span className="text-sm text-gray-500">({categoryTasks.length})</span>
                </div>
                
                <div className="space-y-2">
                  {categoryTasks.map(task => {
                    const priorityConfig = PRIORITY_CONFIG[task.priority];
                    const isExpanded = expandedTask === task.id;
                    const taskOverdue = isOverdue(task);
                    
                    return (
                      <div 
                        key={task.id}
                        className={`bg-white border rounded-lg transition-all ${
                          task.status === 'completed' ? 'opacity-60' : ''
                        } ${taskOverdue ? 'border-red-300' : ''}`}
                      >
                        <div className="p-3 flex items-center gap-3">
                          {/* Status toggle */}
                          <button
                            onClick={() => handleStatusUpdate(
                              task.id, 
                              task.status === 'completed' ? 'pending' : 'completed'
                            )}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              task.status === 'completed' 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {task.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                          </button>
                          
                          {/* Task content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </span>
                              {task.isAutoGenerated && (
                                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                  Auto
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 truncate">{task.description}</p>
                            )}
                          </div>
                          
                          {/* Priority */}
                          <span className={`text-xs px-2 py-0.5 rounded ${priorityConfig.bgColor} ${priorityConfig.textColor}`}>
                            {priorityConfig.label}
                          </span>
                          
                          {/* Due date */}
                          {task.dueDate && (
                            <span className={`text-xs flex items-center gap-1 ${
                              taskOverdue ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              <Clock className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {!task.isAutoGenerated && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t bg-gray-50">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Status:</span>{' '}
                                <span className="text-gray-900 capitalize">{task.status.replace('_', ' ')}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Created:</span>{' '}
                                <span className="text-gray-900">{formatDate(task.createdAt)}</span>
                              </div>
                              {task.completedAt && (
                                <div>
                                  <span className="text-gray-500">Completed:</span>{' '}
                                  <span className="text-gray-900">{formatDate(task.completedAt)}</span>
                                </div>
                              )}
                            </div>
                            {task.description && (
                              <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task Title *</Label>
                <Input
                  id="taskTitle"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="taskDesc">Description</Label>
                <textarea
                  id="taskDesc"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Additional details..."
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label>Priority</Label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="taskDue">Due Date</Label>
                <Input
                  id="taskDue"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask}
                disabled={!newTask.title.trim() || createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
