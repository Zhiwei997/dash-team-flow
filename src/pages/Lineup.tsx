import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ProjectSwitcher from "@/components/ProjectSwitcher";
import AddTaskModal from "@/components/timeline/AddTaskModal";
import GanttChart from "@/components/timeline/GanttChart";
import { useAuth } from "@/hooks/useAuth";
import { useUserProjects, useProjectMembers } from "@/hooks/useProjects";
import { useProjectTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Lineup = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { 
    data: projects = [], 
    isLoading: projectsLoading 
  } = useUserProjects();

  const { 
    data: projectMembers = [], 
    isLoading: membersLoading 
  } = useProjectMembers(selectedProjectId);

  const { 
    data: tasks = [], 
    isLoading: tasksLoading 
  } = useProjectTasks(selectedProjectId);

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleProjectSelect = (project: typeof projects[0]) => {
    setSelectedProjectId(project.id);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Login Required</h2>
            <p className="text-muted-foreground text-center">
              You need to be logged in to view project timelines.
            </p>
            <Button onClick={() => navigate("/login")} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">No Projects Found</h2>
            <p className="text-muted-foreground text-center">
              You're not a member of any projects yet. Create a project or ask to be added to one.
            </p>
            <Button onClick={() => navigate("/create-project")}>
              Create Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-full mx-auto px-6 py-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-8">Lineup</h1>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {selectedProject && (
              <ProjectSwitcher
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={handleProjectSelect}
              />
            )}
          </div>
          {selectedProject && (
            <AddTaskModal 
              projectId={selectedProject.id} 
              projectMembers={projectMembers}
            />
          )}
        </div>

        {/* Project Description */}
        {selectedProject?.description && (
          <div className="mb-6">
            <p className="text-muted-foreground">{selectedProject.description}</p>
          </div>
        )}

        {/* Timeline */}
        {selectedProject && (
          <div className="space-y-6">
            {tasksLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading timeline...</div>
              </div>
            ) : (
              <GanttChart tasks={tasks} projectMembers={projectMembers} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lineup;