import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import AppLayout from '@/components/layout/AppLayout';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectDialog from '@/components/projects/ProjectDialog';
import TaskCard from '@/components/tasks/TaskCard';
import TaskDialog from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, FolderKanban, ArrowLeft } from 'lucide-react';
import { Project, TaskWithRelations } from '@/types/database';

export default function Projects() {
  const { projects, projectTaskCounts, loading: projectsLoading, createProject, updateProject, canManageProjects } = useProjects();
  const { tasks, users, loading: tasksLoading, createTask, updateTask, toggleTaskComplete, canManageTasks } = useTasks();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const projectTasks = viewingProject
    ? tasks.filter((task) => task.project_id === viewingProject.id)
    : [];

  const handleSaveProject = async (projectData: Partial<Project>) => {
    if (projectData.id) {
      await updateProject(projectData.id, projectData);
    } else {
      await createProject(projectData);
    }
  };

  const handleSaveTask = async (taskData: Partial<TaskWithRelations>) => {
    if (taskData.id) {
      await updateTask(taskData.id, taskData);
    } else {
      await createTask({ ...taskData, project_id: viewingProject?.id });
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsCreatingProject(true);
    setIsProjectDialogOpen(true);
  };

  const handleViewProject = (project: Project) => {
    setViewingProject(project);
  };

  const handleBackToProjects = () => {
    setViewingProject(null);
  };

  const handleCreateTaskInProject = () => {
    setSelectedTask(null);
    setIsTaskDialogOpen(true);
  };

  const loading = projectsLoading || tasksLoading;

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Project detail view
  if (viewingProject) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBackToProjects}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{viewingProject.name}</h1>
                {viewingProject.description && (
                  <p className="text-muted-foreground">{viewingProject.description}</p>
                )}
              </div>
            </div>
            {canManageTasks && (
              <Button onClick={handleCreateTaskInProject} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {projectTasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-1">No tasks in this project</h3>
                  <p className="text-sm text-muted-foreground">
                    Add tasks to start tracking work in this project
                  </p>
                </CardContent>
              </Card>
            ) : (
              projectTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={toggleTaskComplete}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsTaskDialogOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>

        <TaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          task={selectedTask}
          projects={projects}
          users={users}
          onSave={handleSaveTask}
          canEdit={canManageTasks}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your projects and their tasks</p>
          </div>
          {canManageProjects && (
            <Button onClick={handleCreateProject} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-1">No projects found</h3>
              <p className="text-sm text-muted-foreground">
                {projects.length === 0
                  ? 'Get started by creating your first project'
                  : 'Try adjusting your search'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={projectTaskCounts[project.id] || 0}
                onClick={() => handleViewProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        project={isCreatingProject ? null : selectedProject}
        onSave={handleSaveProject}
      />
    </AppLayout>
  );
}
