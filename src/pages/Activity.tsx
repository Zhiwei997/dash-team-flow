import { useState, useEffect } from "react";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";
import { useUserProjects } from "@/hooks/useProjects";
import { useActivityLogs, formatActivityMessage } from "@/hooks/useActivityLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Activity = () => {
  const { data: projects, isLoading: projectsLoading } = useUserProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Auto-select project if user has only one
  useEffect(() => {
    if (projects && projects.length === 1) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const { data: activityLogs, isLoading: logsLoading } = useActivityLogs(selectedProjectId);

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
        {projects.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Project
            </label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Activity Logs */}
        {selectedProjectId ? (
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