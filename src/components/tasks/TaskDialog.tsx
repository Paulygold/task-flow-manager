/**
 * TaskDialog.tsx - Create/Edit Task Modal
 * 
 * A dialog for creating new tasks or viewing/editing existing ones.
 * Includes fields for: title, description, priority, status, project, assignee, due date
 */

import { useState, useEffect } from 'react';
import { TaskWithRelations, TaskPriority, TaskStatus, Project, Profile } from '@/types/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FolderKanban, User, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithRelations | null; // Existing task to edit, or null for new task
  projects: Project[];
  users: Profile[];
  onSave: (task: Partial<TaskWithRelations>) => Promise<void>;
  canEdit: boolean; // Whether user has permission to edit
}

// Priority options with colors matching the design system
const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-priority-low' },
  { value: 'medium', label: 'Medium', color: 'text-priority-medium' },
  { value: 'high', label: 'High', color: 'text-priority-high' },
  { value: 'urgent', label: 'Urgent', color: 'text-priority-urgent' },
];

// Status options
const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function TaskDialog({ open, onOpenChange, task, projects, users, onSave, canEdit }: TaskDialogProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [projectId, setProjectId] = useState('none');
  const [assignedTo, setAssignedTo] = useState('none');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens or task changes
  useEffect(() => {
    if (task) {
      // Editing existing task - populate form with task data
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setProjectId(task.project_id || 'none');
      setAssignedTo(task.assigned_to || 'none');
      setDueDate(task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '');
    } else {
      // Creating new task - reset to defaults
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
      setProjectId('none');
      setAssignedTo('none');
      setDueDate('');
    }
  }, [task, open]);

  /** Handle form submission */
  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave({
        id: task?.id,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        project_id: projectId === 'none' ? null : projectId,
        assigned_to: assignedTo === 'none' ? null : assignedTo,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Task Details' : 'Create New Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              disabled={!canEdit}
            />
          </div>

          {/* Description textarea */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (optional)"
              rows={3}
              disabled={!canEdit}
            />
          </div>

          {/* Priority and Status in a row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)} disabled={!canEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={cn('flex items-center gap-2', opt.color)}>
                        <Flag className="h-3.5 w-3.5" />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project select */}
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <span className="flex items-center gap-2">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {project.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee select */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo} disabled={!canEdit}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <span className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      {user.full_name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due date input */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
