import { useParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Mail, Phone, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useJob, useJobApplications, useUserJobApplication, useApplyToJob, useCancelJobApplication, useUpdateJobApplication } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useProjectMembers } from "@/hooks/useProjects";
import { formatDistanceToNow, format } from "date-fns";
import Navigation from "@/components/Navigation";

export const JobDetail = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { data: job, isLoading } = useJob(jobId || null);
  const { data: applications } = useJobApplications(jobId || null);
  const { data: userApplication } = useUserJobApplication(jobId || null);
  const { data: projectMembers } = useProjectMembers(job?.project_id || null);
  
  const applyToJobMutation = useApplyToJob();
  const cancelApplicationMutation = useCancelJobApplication();
  const updateApplicationMutation = useUpdateJobApplication();

  if (!jobId) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading job details...</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Job not found</div>
        </div>
      </div>
    );
  }

  const isProjectMember = projectMembers?.some(member => member.user_id === user?.id);
  const isJobCreator = job.created_by === user?.id;

  const handleApply = () => {
    if (!user) {
      // Redirect to login with return URL
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    applyToJobMutation.mutate(job.id);
  };

  const handleCancelApplication = () => {
    if (userApplication) {
      cancelApplicationMutation.mutate(userApplication.id);
    }
  };

  const handleUpdateApplication = (applicationId: string, status: string) => {
    updateApplicationMutation.mutate({ applicationId, status });
  };

  const renderApplicationButton = () => {
    if (!user) {
      return (
        <Button onClick={handleApply} size="lg" className="w-full">
          Apply for this Job
        </Button>
      );
    }

    if (isProjectMember) {
      return (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-muted-foreground">
            You are already a member of this project.
          </p>
        </div>
      );
    }

    if (userApplication) {
      return (
        <div className="space-y-2">
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">Application Submitted</p>
            <p className="text-green-600 text-sm">
              Applied {formatDistanceToNow(new Date(userApplication.applied_at), { addSuffix: true })}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleCancelApplication}
            className="w-full"
            disabled={cancelApplicationMutation.isPending}
          >
            Cancel Application
          </Button>
        </div>
      );
    }

    return (
      <Button 
        onClick={handleApply} 
        size="lg" 
        className="w-full"
        disabled={applyToJobMutation.isPending}
      >
        {applyToJobMutation.isPending ? "Applying..." : "Apply for this Job"}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {job.required_people} {job.required_people === 1 ? 'person' : 'people'} needed
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="px-3 py-1">
                      Open
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Job Description</h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{job.description}</p>
                    </div>
                  </div>

                  {job.deadline && (
                    <div>
                      <h3 className="font-semibold mb-2">Application Deadline</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(job.deadline), "PPP")}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Application Management - Only visible to job creator */}
              {isJobCreator && applications && applications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Applications ({applications.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {applications.map((application) => (
                        <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <button className="text-primary hover:underline font-medium text-left">
                              {application.applicant_name}
                            </button>
                            <p className="text-sm text-muted-foreground">
                              {application.applicant_email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateApplication(application.id, 'accepted')}
                              disabled={application.status === 'accepted'}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateApplication(application.id, 'rejected')}
                              disabled={application.status === 'rejected'}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Action */}
              <Card>
                <CardContent className="pt-6">
                  {renderApplicationButton()}
                </CardContent>
              </Card>

              {/* Publisher Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Publisher Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <button className="text-primary hover:underline font-medium">
                      {job.publisher_name}
                    </button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${job.publisher_email}`} className="text-primary hover:underline">
                        {job.publisher_email}
                      </a>
                    </div>
                    
                    {job.publisher_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${job.publisher_phone}`} className="text-primary hover:underline">
                          {job.publisher_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posted</span>
                    <span>{format(new Date(job.created_at), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Positions</span>
                    <span>{job.required_people}</span>
                  </div>
                  {job.deadline && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline</span>
                      <span>{format(new Date(job.deadline), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};