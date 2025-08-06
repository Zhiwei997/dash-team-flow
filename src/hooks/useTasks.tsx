import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Task {
  id: string;
  project_id: string;
  task_name: string;
  assigned_to: string | null;
  start_date: string;
  end_date: string;
  progress: number;
  module_name: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const useProjectTasks = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // First get tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

      if (tasksError) throw tasksError;
      if (!tasksData) return [];

      // Get unique assigned user IDs
      const userIds = [...new Set(tasksData.map(task => task.assigned_to).filter(Boolean))];
      
      if (userIds.length === 0) {
        return tasksData.map(task => ({ ...task, assignee: null }));
      }

      // Then get user details for assignees
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Combine the data
      return tasksData.map((task) => ({
        ...task,
        assignee: task.assigned_to 
          ? usersData?.find(user => user.id === task.assigned_to) || null
          : null,
      })) as Task[];
    },
    enabled: !!projectId,
  });
};

export const useCreateTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      project_id: string;
      task_name: string;
      assigned_to: string | null;
      start_date: string;
      end_date: string;
      module_name?: string;
      color?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("tasks")
        .insert([{
          ...taskData,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.project_id] });
      toast.success("Task created successfully!");
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      id: string;
      project_id: string;
      updates: Partial<Task>;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(taskData.updates)
        .eq("id", taskData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", data.project_id] });
      toast.success("Task updated successfully!");
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    },
  });
};