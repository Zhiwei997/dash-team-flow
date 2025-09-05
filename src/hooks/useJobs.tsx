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

export interface JobAttachment {
  id: string;
  job_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      // First, get the application details
      const { data: application, error: appError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (appError) throw appError;

      // Get the job details
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, project_id, created_by")
        .eq("id", application.job_id)
        .single();

      if (jobError) throw jobError;

      // Update application status
      const { data: updatedApplication, error: updateError } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", applicationId)
        .select()
        .single();

      if (updateError) throw updateError;

      // If accepting the application, add user to project members and log activities
      if (status === 'accepted' && user) {
        // Add applicant to project members (upsert to handle duplicates)
        const { error: memberError } = await supabase
          .from("project_members")
          .upsert({
            project_id: job.project_id,
            user_id: application.applicant_id,
            role: 'member'
          }, {
            onConflict: 'project_id,user_id'
          });

        if (memberError) {
          console.warn('Failed to add member to project:', memberError);
        }

        // Log job application accepted activity
        const { error: logError1 } = await supabase
          .from("activity_logs")
          .insert({
            project_id: job.project_id,
            user_id: user.id,
            action: 'job_application_accepted',
            details: {
              job_id: job.id,
              applicant_id: application.applicant_id,
              applicant_name: application.applicant_name,
              application_id: applicationId
            }
          });

        if (logError1) {
          console.warn('Failed to log job application accepted activity:', logError1);
        }

        // Log project member added via job activity
        const { error: logError2 } = await supabase
          .from("activity_logs")
          .insert({
            project_id: job.project_id,
            user_id: user.id,
            action: 'project_member_added_via_job',
            details: {
              job_id: job.id,
              added_user_id: application.applicant_id,
              added_user_name: application.applicant_name,
              role: 'member'
            }
          });

        if (logError2) {
          console.warn('Failed to log project member added activity:', logError2);
        }
      }

      return updatedApplication;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", data.job_id] });
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
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

export const useJobAttachments = (jobId: string | null) => {
  return useQuery({
    queryKey: ["job-attachments", jobId],
    queryFn: async () => {
      if (!jobId) return [];

      const { data, error } = await supabase
        .from("job_attachments")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as JobAttachment[];
    },
    enabled: !!jobId,
  });
};

export const useUploadJobAttachment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId, file, fileName }: { jobId: string; file: File; fileName: string }) => {
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${jobId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("job-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { data, error } = await supabase
        .from("job_attachments")
        .insert({
          job_id: jobId,
          file_name: fileName,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["job-attachments", data.job_id] });
    },
  });
};

export const useDeleteJobAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      // First get the attachment to know the file path
      const { data: attachment, error: fetchError } = await supabase
        .from("job_attachments")
        .select("*")
        .eq("id", attachmentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("job-attachments")
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from("job_attachments")
        .delete()
        .eq("id", attachmentId);

      if (error) throw error;
      return attachment;
    },
    onSuccess: (attachment) => {
      queryClient.invalidateQueries({ queryKey: ["job-attachments", attachment.job_id] });
      toast({
        title: "Attachment Deleted",
        description: "The file has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete attachment. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDownloadJobAttachment = () => {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from("job-attachments")
        .download(filePath);

      if (error) throw error;
      return data;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    },
  });
};