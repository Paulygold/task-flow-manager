import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, Task } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isDepartmentHead } = useAuth();

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (projectsError) throw projectsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('project_id');

      if (tasksError) throw tasksError;

      // Count tasks per project
      const counts: Record<string, number> = {};
      (tasksData || []).forEach((task: any) => {
        if (task.project_id) {
          counts[task.project_id] = (counts[task.project_id] || 0) + 1;
        }
      });

      setProjects(projectsData || []);
      setProjectTaskCounts(counts);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error loading projects',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const createProject = async (projectData: Partial<Project>) => {
    try {
      const { error } = await supabase.from('projects').insert({
        name: projectData.name!,
        description: projectData.description,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({ title: 'Project created successfully' });
      await fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error creating project',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateProject = async (projectId: string, projectData: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', projectId);

      if (error) throw error;

      toast({ title: 'Project updated successfully' });
      await fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error updating project',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    projects,
    projectTaskCounts,
    loading,
    createProject,
    updateProject,
    refetch: fetchProjects,
    canManageProjects: isAdmin || isDepartmentHead,
  };
}
