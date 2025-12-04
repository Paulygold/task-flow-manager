import { Project } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  onClick: () => void;
}

export default function ProjectCard({ project, taskCount, onClick }: ProjectCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 group"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
          </div>
          <Badge variant="secondary">{taskCount} tasks</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
