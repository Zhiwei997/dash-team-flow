import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, Users, ExternalLink, MessageSquare, Edit, Trash2, Link, Plus } from "lucide-react";
import { useProjectJobs, useDeleteJob, Job } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { CreateJobModal } from "./CreateJobModal";
import { EditJobModal } from "./EditJobModal";
import { ShareJobModal } from "./ShareJobModal";
import { toast } from "@/hooks/use-toast";

interface JobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const JobsModal = ({ isOpen, onClose, projectId, projectName }: JobsModalProps) => {
  const { user } = useAuth();
  const { data: jobs, isLoading } = useProjectJobs(projectId);
  const deleteJobMutation = useDeleteJob();
  
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [sharingJob, setSharingJob] = useState<Job | null>(null);

  const handleCopyLink = (jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Job link has been copied to clipboard.",
    });
  };

  const handleViewJob = (jobId: string) => {
    window.open(`/jobs/${jobId}`, '_blank');
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      deleteJobMutation.mutate(jobId);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Jobs - {projectName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading jobs...</div>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job, index) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <button
                              onClick={() => handleViewJob(job.id)}
                              className="text-primary hover:underline font-medium text-left"
                            >
                              {job.title}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {job.required_people} {job.required_people === 1 ? 'person' : 'people'} needed
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                            </div>
                          </div>

                          <div className="text-sm">
                            <span className="text-muted-foreground">Publisher: </span>
                            <button className="text-primary hover:underline">
                              {job.publisher_name}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(job.id)}
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSharingJob(job)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {user?.id === job.created_by && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingJob(job)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No jobs posted yet for this project.
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowCreateJob(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create a Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateJobModal
        isOpen={showCreateJob}
        onClose={() => setShowCreateJob(false)}
        projectId={projectId}
      />

      {editingJob && (
        <EditJobModal
          isOpen={!!editingJob}
          onClose={() => setEditingJob(null)}
          job={editingJob}
        />
      )}

      {sharingJob && (
        <ShareJobModal
          isOpen={!!sharingJob}
          onClose={() => setSharingJob(null)}
          job={sharingJob}
        />
      )}
    </>
  );
};