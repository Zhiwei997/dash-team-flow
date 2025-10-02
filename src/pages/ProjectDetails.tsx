import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, UserMinus, Trash2, LogOut, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";
import InviteMemberModal from "@/components/InviteMemberModal";
import EditProjectModal from "@/components/EditProjectModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) throw new Error("Project ID is required");

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch project members with user details
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["project-members", id],
    queryFn: async () => {
      if (!id) return [];

      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select("id, user_id, role, joined_at")
        .eq("project_id", id);

      if (membersError) throw membersError;
      if (!membersData) return [];

      const userIds = membersData.map(member => member.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      if (usersError) throw usersError;

      return membersData.map((member) => ({
        ...member,
        user: usersData?.find(user => user.id === member.user_id),
      }));
    },
    enabled: !!id,
  });

  // Check if current user is project owner
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isOwner = currentUserMember?.role === 'owner';

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Project ID is required");

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Project deleted successfully",
        description: "The project has been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["user-projects"] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Member removed successfully",
        description: "The member has been removed from the project.",
      });
      queryClient.invalidateQueries({ queryKey: ["project-members", id] });
    },
    onError: (error) => {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave project mutation
  const leaveProjectMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserMember?.id) throw new Error("User membership not found");

      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", currentUserMember.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Left project successfully",
        description: "You have been removed from the project.",
      });
      queryClient.invalidateQueries({ queryKey: ["user-projects"] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error leaving project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (updates: Partial<typeof project>) => {
      if (!id) throw new Error("Project ID is required");

      const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Project updated successfully",
        description: "The project details have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["user-projects"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteProject = () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProjectMutation.mutate();
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      removeMemberMutation.mutate(memberId);
    }
  };

  const handleMemberClick = (userId: string) => {
    if (!userId) return;

    if (userId === user?.id) {
      navigate(`/profile`);
      return;
    }

    navigate(`/users/${userId}`);
  };

  if (projectLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-muted-foreground">Project not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Project Header */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-foreground mb-2">
                  {project.project_name}
                </CardTitle>
                {project.description && (
                  <p className="text-muted-foreground text-lg">
                    {project.description}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="text-sm">
                {project.status || 'Active'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col space-y-4">
              {/* Project Dates */}
              <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0">
                {project.start_date && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Start Date</p>
                    <p className="text-muted-foreground">
                      {format(new Date(project.start_date + 'T00:00:00'), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <p className="text-sm font-medium text-foreground">End Date</p>
                    <p className="text-muted-foreground">
                      {format(new Date(project.end_date + 'T00:00:00'), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {(isOwner || currentUserMember) && (
                <div className="flex space-x-3 pt-4 border-t border-border">
                  {isOwner && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setIsInviteModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={handleDeleteProject}
                        disabled={deleteProjectMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleteProjectMutation.isPending ? "Deleting..." : "Delete Project"}
                      </Button>
                    </>
                  )}

                  {!isOwner && currentUserMember && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave Project
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Leave Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to leave this project? You will lose access to all project data and will need to be re-invited to rejoin.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => leaveProjectMutation.mutate()}
                            disabled={leaveProjectMutation.isPending}
                          >
                            {leaveProjectMutation.isPending ? "Leaving..." : "Leave Project"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Members */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="text-xl">
              Project Members ({members.length})
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex items-center space-x-4 cursor-pointer flex-1"
                    onClick={() => handleMemberClick(member.user_id)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-sm bg-primary/10 text-primary">
                        {member.user?.full_name?.slice(0, 2).toUpperCase() || "UN"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">
                          {member.user?.full_name || "Unknown User"}
                        </h3>
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {format(new Date(member.joined_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  {/* Remove member button - only for owners and not for themselves */}
                  {isOwner && member.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.user?.full_name || "Unknown User")}
                      disabled={removeMemberMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invite Member Modal */}
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          projectId={id!}
          existingMemberIds={members.map(m => m.user_id)}
        />

        {/* Edit Project Modal */}
        {project && (
          <EditProjectModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            project={project}
            onUpdate={updateProjectMutation.mutate}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;