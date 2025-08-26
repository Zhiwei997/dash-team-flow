import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Project } from "@/hooks/useProjects";

interface ProjectSwitcherProps {
  projects: (Project & { userRole: string })[];
  selectedProject: Project & { userRole: string };
  onProjectSelect: (project: Project & { userRole: string }) => void;
}

const ProjectSwitcher = ({ projects, selectedProject, onProjectSelect }: ProjectSwitcherProps) => {
  if (projects.length <= 1) {
    return (
      <h2 className="text-xl font-semibold text-foreground">
        {selectedProject.project_name}
      </h2>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto text-left">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-foreground">
              {selectedProject.project_name}
            </h2>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => onProjectSelect(project)}
            className="cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{project.project_name}</span>
              {project.description && (
                <span className="text-sm text-muted-foreground truncate">
                  {project.description}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectSwitcher;