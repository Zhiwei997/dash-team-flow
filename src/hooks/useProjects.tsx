import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Project {
  id: string;
  project_name: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const useUserProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("project_members")
        .select(`
          project_id,
          role,
          projects!inner (
            id,
            project_name,
            description,
            status,
            start_date,
            end_date,
            created_at,
            created_by,
            updated_at
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      return data.map((item) => ({
        ...item.projects,
        userRole: item.role,
      }));
    },
    enabled: !!user?.id,
  });
};

export const useProjectMembers = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // First get project members
      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select("id, project_id, user_id, role, joined_at")
        .eq("project_id", projectId);

      if (membersError) throw membersError;
      if (!membersData) return [];

      // Then get user details for each member
      const userIds = membersData.map(member => member.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Combine the data
      return membersData.map((member) => ({
        ...member,
        user: usersData?.find(user => user.id === member.user_id),
      })) as ProjectMember[];
    },
    enabled: !!projectId,
  });
};