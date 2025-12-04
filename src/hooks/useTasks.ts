import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskWithRelations, Task, Project, Profile } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useTasks() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isDepartmentHead } = useAuth();

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (projectsError) throw projectsError;

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Map tasks with relations
      const tasksWithRelations: TaskWithRelations[] = (tasksData || []).map((task: any) => ({
        ...task,
        project: projectsData?.find((p: Project) => p.id === task.project_id) || null,
        assigned_user: profilesData?.find((p: Profile) => p.id === task.assigned_to) || null,
        created_by_user: profilesData?.find((p: Profile) => p.id === task.created_by) || null,
      }));

      setTasks(tasksWithRelations);
      setProjects(projectsData || []);
      setUsers(profilesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const createTask = async (taskData: Partial<Task>) => {
    try {
      const { error } = await supabase.from('tasks').insert({
        title: taskData.title!,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        project_id: taskData.project_id,
        assigned_to: taskData.assigned_to,
        due_date: taskData.due_date,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({ title: 'Task created successfully' });
      await fetchData();
    } catch (error: any) {
      toast({
        title: 'Error creating task',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    try {
      const updateData: any = { ...taskData };
      
      if (taskData.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (taskData.status) {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({ title: 'Task updated successfully' });
      await fetchData();
    } catch (error: any) {
      toast({
        title: 'Error updating task',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    await updateTask(taskId, {
      status: completed ? 'completed' : 'pending',
    });
  };

  return {
    tasks,
    projects,
    users,
    loading,
    createTask,
    updateTask,
    toggleTaskComplete,
    refetch: fetchData,
    canManageTasks: isAdmin || isDepartmentHead,
  };
}
