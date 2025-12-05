/**
 * useTasks.ts - Task Management Hook
 * 
 * Provides all task-related data and operations:
 * - Fetches tasks, projects, and users from database
 * - Creates, updates, and toggles task completion
 * - Handles role-based permissions for task management
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskWithRelations, Task, Project, Profile } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useTasks() {
  // State for all data
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user, isAdmin, isDepartmentHead } = useAuth();

  /**
   * Fetch all tasks, projects, and users from database
   * Then combine them to create tasks with their related data
   */
  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch all data in parallel for speed
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('name'),
        supabase.from('profiles').select('*')
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (usersRes.error) throw usersRes.error;

      // Combine tasks with their related project and user data
      const tasksWithRelations: TaskWithRelations[] = (tasksRes.data || []).map((task: any) => ({
        ...task,
        project: projectsRes.data?.find((p: Project) => p.id === task.project_id) || null,
        assigned_user: usersRes.data?.find((u: Profile) => u.id === task.assigned_to) || null,
      }));

      setTasks(tasksWithRelations);
      setProjects(projectsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error loading data', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when user changes (login/logout)
  useEffect(() => {
    fetchData();
  }, [user]);

  /**
   * Create a new task in the database
   */
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
      await fetchData(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Error creating task', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  /**
   * Update an existing task
   * Automatically sets completed_at timestamp when status changes to 'completed'
   */
  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    try {
      const updateData: any = { ...taskData };
      
      // Set completion timestamp based on status
      if (taskData.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (taskData.status) {
        updateData.completed_at = null;
      }

      const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);

      if (error) throw error;
      toast({ title: 'Task updated successfully' });
      await fetchData(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Error updating task', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  /**
   * Toggle a task between completed and pending status
   */
  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    await updateTask(taskId, { status: completed ? 'completed' : 'pending' });
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
    // Only admins and department heads can create/manage tasks
    canManageTasks: isAdmin || isDepartmentHead,
  };
}
