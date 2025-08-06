import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ProjectSwitcher from "@/components/ProjectSwitcher";
import { useUserProjects } from "@/hooks/useProjects";
import { useActivityLogs, formatActivityMessage } from "@/hooks/useActivityLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const Activity = () => {
  const { data: projects, isLoading: projectsLoading } = useUserProjects();
  const [selectedProject, setSelectedProject] = useState<(typeof projects)[0] | null>(null);
  const [searchParams] = useSearchParams();

  // Auto-select project from URL parameter or default to first project
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    
    const projectFromUrl = searchParams.get('project');
    if (projectFromUrl) {
      const urlProject = projects.find(p => p.id === projectFromUrl);
      if (urlProject) {
        setSelectedProject(urlProject);
        return;
      }
    }
    
    // Default to first project if no URL parameter or if URL project not found
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [projects, searchParams, selectedProject]);

  const handleProjectSelect = (project: typeof projects[0]) => {
    setSelectedProject(project);
  };

  const { data: activityLogs, isLoading: logsLoading } = useActivityLogs(selectedProject?.id);

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Activity</h1>
          <Skeleton className="h-12 w-full mb-6" />
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Activity</h1>
          <div className="bg-card rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              No projects found. Create a project to see activity logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Activity</h1>

        {/* Project Selector */}
        <div className="mb-8">
          {selectedProject && (
            <ProjectSwitcher
              projects={projects}
              selectedProject={selectedProject}
              onProjectSelect={handleProjectSelect}
            />
          )}
        </div>

        {/* Project Description */}
        {selectedProject?.description && (
          <div className="mb-6">
            <p className="text-muted-foreground">{selectedProject.description}</p>
          </div>
        )}

        {/* Activity Logs */}
        {selectedProject ? (
          <div className="space-y-4">
            {logsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activityLogs && activityLogs.length > 0 ? (
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <Card key={log.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-foreground font-medium">
                          {formatActivityMessage(log)}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "MMM dd, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No activity logs yet. Start creating and updating tasks to see activity.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          projects.length > 1 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Please select a project to view its activity logs.
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

export default Activity;