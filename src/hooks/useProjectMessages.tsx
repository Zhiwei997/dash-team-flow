import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface ProjectMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  image_urls?: string[];
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const useProjectMessages = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-messages", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: messagesData, error: messagesError } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      if (!messagesData) return [];

      // Get user details for each message
      const userIds = [...new Set(messagesData.map(message => message.user_id))];
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Combine the data
      const projectMessages = messagesData.map((message) => ({
        ...message,
        user: usersData?.find(user => user.id === message.user_id),
      })) as ProjectMessage[];

      // Get image URLs for each message
      for (const message of projectMessages) {
        if (message.image_urls) {
          message.image_urls = message.image_urls.map(url => supabase.storage.from("project-messages").getPublicUrl(url).data.publicUrl);
        }
      }

      return projectMessages;
    },
    enabled: !!projectId,
  });
};

export const useSendProjectMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, content, imageUrls }: { projectId: string; content: string; imageUrls?: string[] }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Ensure we have either content or images
      if (!content.trim() && (!imageUrls || imageUrls.length === 0)) {
        throw new Error("Message must have either content or images");
      }

      const { data, error } = await supabase
        .from("project_messages")
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: content.trim() || "", // Allow empty content for image-only messages
          image_urls: imageUrls || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ["project-messages", data.project_id] });
      // Also invalidate activity logs since the trigger will add a new log
      queryClient.invalidateQueries({ queryKey: ["activity-logs", data.project_id] });

      toast({
        title: "Message sent",
        description: "Your message has been posted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    },
  });
};

export const useDeleteProjectMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, projectId }: { messageId: string; projectId: string }) => {
      const { error } = await supabase
        .from("project_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      return { messageId, projectId };
    },
    onSuccess: (data) => {
      // Invalidate queries with the projectId
      queryClient.invalidateQueries({ queryKey: ["project-messages", data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs", data.projectId] });

      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting message:", error);
    },
  });
};