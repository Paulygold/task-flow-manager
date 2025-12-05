/**
 * useProjects.ts - Project Management Hook
 * 
 * Provides project-related data and operations:
 * - Fetches all projects with their task counts
 * - Creates and updates projects
 * - Role-based permission checking
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isDepartmentHead } = useAuth();

  /**
   * Fetch all projects and count tasks per project
   */
  const fetchProjects = async () => {
    if (!user) return;

    try {
      // Fetch projects and tasks in parallel
      const [projectsRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('*').order('name'),
        supabase.from('tasks').select('project_id')
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      // Count how many tasks each project has
      const counts: Record<string, number> = {};
      (tasksRes.data || []).forEach((task: any) => {
        if (task.project_id) {
          counts[task.project_id] = (counts[task.project_id] || 0) + 1;
        }
      });

      setProjects(projectsRes.data || []);
      setProjectTaskCounts(counts);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({ title: 'Error loading projects', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchProjects();
  }, [user]);

  /** Create a new project */
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
      toast({ title: 'Error creating project', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  /** Update an existing project */
  const updateProject = async (projectId: string, projectData: Partial<Project>) => {
    try {
      const { error } = await supabase.from('projects').update(projectData).eq('id', projectId);

      if (error) throw error;
      toast({ title: 'Project updated successfully' });
      await fetchProjects();
    } catch (error: any) {
      toast({ title: 'Error updating project', description: error.message, variant: 'destructive' });
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
