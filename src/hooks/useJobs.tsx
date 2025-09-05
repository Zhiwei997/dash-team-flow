import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Job {
  id: string;
  project_id: string;
  title: string;
  description: string;
  required_people: number;
  publisher_name: string;
  publisher_email: string;
  publisher_phone?: string;
  deadline?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  status: string;
  applied_at: string;
}

export const useProjectJobs = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-jobs", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!projectId,
  });
};

export const useJob = (jobId: string | null) => {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

      if (error) throw error;
      return data as Job | null;
    },
    enabled: !!jobId,
  });
};

export const useJobApplications = (jobId: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      if (!jobId || !user) return [];

      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return data as JobApplication[];
    },
    enabled: !!jobId && !!user,
  });
};

export const useUserJobApplication = (jobId: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-job-application", jobId, user?.id],
    queryFn: async () => {
      if (!jobId || !user) return null;

      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .eq("applicant_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as JobApplication | null;
    },
    enabled: !!jobId && !!user,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData: Omit<Job, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("jobs")
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-jobs", data.project_id] });
      toast({
        title: "Job Created",
        description: "Your job has been posted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: Partial<Job> }) => {
      const { data, error } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", jobId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job", data.id] });
      queryClient.invalidateQueries({ queryKey: ["project-jobs", data.project_id] });
      toast({
        title: "Job Updated",
        description: "Your job has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job"] });
      toast({
        title: "Job Deleted",
        description: "The job has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useApplyToJob = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error("User not authenticated");

      const applicationData = {
        job_id: jobId,
        applicant_id: user.id,
        applicant_name: user.user_metadata?.full_name || user.email || "Unknown",
        applicant_email: user.email || "",
      };

      const { data, error } = await supabase
        .from("job_applications")
        .insert(applicationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-job-application", data.job_id] });
      queryClient.invalidateQueries({ queryKey: ["job-applications", data.job_id] });
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useCancelJobApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-job-application"] });
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast({
        title: "Application Cancelled",
        description: "Your application has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel application. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateJobApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      const { data, error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", applicationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", data.job_id] });
      toast({
        title: "Application Updated",
        description: `Application has been ${data.status}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application. Please try again.",
        variant: "destructive",
      });
    },
  });
};