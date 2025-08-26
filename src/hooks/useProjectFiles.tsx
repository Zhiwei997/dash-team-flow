import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  path: string;
  mime_type: string | null;
  size: number | null;
  description: string | null;
  created_by: string;
  created_at: string;
  uploader?: {
    id: string;
    full_name: string;
  };
}

export const useProjectFiles = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-files", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: filesData, error: filesError } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (filesError) throw filesError;
      if (!filesData) return [];

      // Get uploader details
      const uploaderIds = filesData.map(file => file.created_by);
      const { data: usersData } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", uploaderIds);

      return filesData.map((file) => ({
        ...file,
        uploader: usersData?.find(user => user.id === file.created_by),
      })) as ProjectFile[];
    },
    enabled: !!projectId,
  });
};

export const useUploadProjectFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      file, 
      projectId, 
      description 
    }: { 
      file: File; 
      projectId: string; 
      description?: string 
    }) => {
      if (!user) throw new Error("User not authenticated");

      const fileId = crypto.randomUUID();
      const fileName = file.name;
      const filePath = `${projectId}/${user.id}/${fileId}-${fileName}`;

      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (storageError) throw storageError;

      // Create database record
      const { data, error } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          name: fileName,
          path: filePath,
          mime_type: file.type || null,
          size: file.size,
          description: description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProjectFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ fileId, filePath }: { fileId: string; filePath: string }) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from("project-files")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from("project_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;
    },
    onSuccess: (_, { fileId }) => {
      // Find the file in cache to get project_id for invalidation
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ["project-files"] });
      
      queries.forEach(query => {
        const data = query.state.data as ProjectFile[] | undefined;
        if (data) {
          const file = data.find(f => f.id === fileId);
          if (file) {
            queryClient.invalidateQueries({ queryKey: ["project-files", file.project_id] });
          }
        }
      });

      toast({
        title: "File deleted",
        description: "The file has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDownloadProjectFile = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from("project-files")
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProjectFile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      fileId, 
      updates 
    }: { 
      fileId: string; 
      updates: Partial<Pick<ProjectFile, 'name' | 'description'>> 
    }) => {
      const { data, error } = await supabase
        .from("project_files")
        .update(updates)
        .eq("id", fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-files", data.project_id] });
      toast({
        title: "File updated",
        description: "File details have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};