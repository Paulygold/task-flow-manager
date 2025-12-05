/**
 * Dashboard.tsx - Main Task Dashboard Page
 * 
 * Displays:
 * - Welcome message with user's name
 * - Task statistics (total, completed, in progress, pending)
 * - Search and filter controls
 * - List of tasks with ability to create/edit
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import AppLayout from '@/components/layout/AppLayout';
import TaskCard from '@/components/tasks/TaskCard';
import TaskDialog from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import { TaskWithRelations } from '@/types/database';

export default function Dashboard() {
  const { profile } = useAuth();
  const { tasks, projects, users, loading, createTask, updateTask, toggleTaskComplete, canManageTasks } = useTasks();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog state
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
  };

  /** Save task (create or update based on whether id exists) */
  const handleSaveTask = async (taskData: Partial<TaskWithRelations>) => {
    if (taskData.id) {
      await updateTask(taskData.id, taskData);
    } else {
      await createTask(taskData);
    }
  };

  /** Open dialog to create new task */
  const openCreateDialog = () => {
    setSelectedTask(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  /** Open dialog to view/edit existing task */
  const openEditDialog = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  // Show loading skeleton while fetching data
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with welcome message and create button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]}</h1>
            <p className="text-muted-foreground">Here's an overview of your tasks</p>
          </div>
          {canManageTasks && (
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          )}
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={ListTodo} value={stats.total} label="Total Tasks" color="primary" />
          <StatCard icon={CheckCircle2} value={stats.completed} label="Completed" color="status-completed" />
          <StatCard icon={Clock} value={stats.inProgress} label="In Progress" color="status-in-progress" />
          <StatCard icon={AlertCircle} value={stats.pending} label="Pending" color="status-pending" />
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <EmptyState hasAnyTasks={tasks.length > 0} />
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={toggleTaskComplete}
                onClick={() => openEditDialog(task)}
              />
            ))
          )}
        </div>
      </div>

      {/* Task create/edit dialog */}
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={isCreating ? null : selectedTask}
        projects={projects}
        users={users}
        onSave={handleSaveTask}
        canEdit={canManageTasks || isCreating}
      />
    </AppLayout>
  );
}

/** Reusable stat card component */
function StatCard({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${color}/10 rounded-lg`}>
            <Icon className={`h-5 w-5 text-${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Empty state when no tasks match filters */
function EmptyState({ hasAnyTasks }: { hasAnyTasks: boolean }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-1">No tasks found</h3>
        <p className="text-sm text-muted-foreground">
          {hasAnyTasks ? 'Try adjusting your filters' : 'Get started by creating your first task'}
        </p>
      </CardContent>
    </Card>
  );
}
