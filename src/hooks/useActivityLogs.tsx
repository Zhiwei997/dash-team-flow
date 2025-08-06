import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export const useActivityLogs = (projectId?: string) => {
  return useQuery({
    queryKey: ["activity-logs", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user details separately
      const userIds = [...new Set(data.map(log => log.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      // Combine the data
      const logsWithUsers = data.map(log => ({
        ...log,
        user: users?.find(user => user.id === log.user_id) || null
      }));

      return logsWithUsers as ActivityLog[];
    },
    enabled: !!projectId,
  });
};

export const formatActivityMessage = (log: ActivityLog): string => {
  const userName = log.user?.full_name || "Unknown User";
  
  switch (log.action) {
    case "project_created":
      const projectName = log.details?.project_name;
      return `${userName} created project "${projectName}"`;
    
    case "member_added":
      const invitedUserName = log.details?.invited_user_name;
      const role = log.details?.role;
      return `${userName} invited ${invitedUserName} as ${role}`;
    
    case "member_removed":
      const removedUserName = log.details?.removed_user_name;
      const removedRole = log.details?.role;
      return `${userName} removed ${removedUserName} (${removedRole})`;
    
    case "task_created":
      const taskName = log.details?.task_name;
      const moduleName = log.details?.module_name;
      return `${userName} created task "${taskName}"${moduleName ? ` in module ${moduleName}` : ""}`;
    
    case "task_updated":
      const updatedTaskName = log.details?.task_name;
      const changes = log.details?.changes;
      let updateMsg = `${userName} updated task "${updatedTaskName}"`;
      
      if (changes?.progress_changed) {
        updateMsg += ` (progress: ${changes.old_progress}% → ${changes.new_progress}%)`;
      }
      if (changes?.dates_changed) {
        updateMsg += ` (dates modified)`;
      }
      return updateMsg;
    
    case "task_deleted":
      const deletedTaskName = log.details?.task_name;
      return `${userName} deleted task "${deletedTaskName}"`;
    
    default:
      return `${userName} performed action: ${log.action}`;
  }
};