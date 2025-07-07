import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProjectMember } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";

interface ProjectMembersListProps {
  members: ProjectMember[];
}

const ProjectMembersList = ({ members }: ProjectMembersListProps) => {
  const navigate = useNavigate();

  const handleMemberClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">
          Project Members ({members.length})
        </span>
      </div>
      
      <div className="flex items-center space-x-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => handleMemberClick(member.user_id)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {member.user?.full_name?.slice(0, 2).toUpperCase() || "UN"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {member.user?.full_name || "Unknown User"}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {member.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectMembersList;