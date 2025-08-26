import { Settings, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useUserProjects, useProjectMembers, Project } from "@/hooks/useProjects";
import { useState } from "react";
import ProjectMembersList from "./ProjectMembersList";
import InviteMemberModal from "./InviteMemberModal";

interface ProjectHeaderProps {
  selectedProject: (Project & { userRole: string }) | null;
}

const ProjectHeader = ({ selectedProject }: ProjectHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: members = [] } = useProjectMembers(selectedProject?.id || null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Check if current user is project owner
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isOwner = currentUserMember?.role === 'owner';

  if (!user) {
    return (
      <Card className="p-6 bg-card-muted border-0 shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Project</h2>
          <p className="text-muted-foreground">➤ Please log in or register to manage a project.</p>
        </div>
      </Card>
    );
  }

  if (projectsLoading) {
    return (
      <Card className="p-6 bg-card-muted border-0 shadow-sm">
        <div className="text-center">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="p-6 bg-card-muted border-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Project</h2>
            <p className="text-muted-foreground">➤ Please create a new project</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-card hover:bg-muted"
            onClick={() => navigate("/create-project")}
          >
            Create Project
          </Button>
        </div>
      </Card>
    );
  }

  if (!selectedProject) {
    return null;
  }

  return (
    <Card className="p-6 bg-card-muted border-0 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Project Info */}
        <div className="flex flex-col space-y-2">
          {selectedProject.description && (
            <p className="text-sm text-muted-foreground max-w-md">
              {selectedProject.description}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-card hover:bg-muted"
            onClick={() => navigate(`/project/${selectedProject.id}`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
          {isOwner && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-card hover:bg-muted"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Members
            </Button>
          )}
        </div>
      </div>
      
      {/* Project Members */}
      <ProjectMembersList members={members} />

      {/* Invite Member Modal */}
      {selectedProject && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          projectId={selectedProject.id}
          existingMemberIds={members.map(m => m.user_id)}
        />
      )}
    </Card>
  );
};

export default ProjectHeader;