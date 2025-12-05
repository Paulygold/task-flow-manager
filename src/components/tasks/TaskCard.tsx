/**
 * TaskCard.tsx - Individual Task Display Card
 * 
 * Displays a single task with:
 * - Checkbox to toggle completion
 * - Title and description
 * - Priority badge with color coding
 * - Project, due date, and assignee info
 */

import { TaskWithRelations } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: TaskWithRelations;
  onComplete: (taskId: string, completed: boolean) => void;
  onClick: () => void;
}

// Colors for each priority level (using design system tokens)
const PRIORITY_COLORS = {
  low: 'bg-priority-low/10 text-priority-low border-priority-low/20',
  medium: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
  high: 'bg-priority-high/10 text-priority-high border-priority-high/20',
  urgent: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
};

export default function TaskCard({ task, onComplete, onClick }: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  /** Get initials from name (e.g., "John Doe" -> "JD") */
  const getInitials = (name: string) => 
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20',
        isCompleted && 'opacity-60'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox - click stops propagation to prevent opening dialog */}
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => onComplete(task.id, checked as boolean)}
              className="mt-1"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Title and Priority Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={cn(
                'font-medium text-foreground truncate',
                isCompleted && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </h3>
              <Badge variant="outline" className={cn('shrink-0', PRIORITY_COLORS[task.priority])}>
                {task.priority}
              </Badge>
            </div>

            {/* Description (if present) */}
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {task.description}
              </p>
            )}

            {/* Metadata: Project, Due Date, Assignee */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {task.project && (
                <div className="flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span>{task.project.name}</span>
                </div>
              )}
              
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(task.due_date), 'MMM d')}</span>
                </div>
              )}

              {task.assigned_user && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-secondary">
                      {getInitials(task.assigned_user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assigned_user.full_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
