import Navigation from "@/components/Navigation";
import ProjectHeader from "@/components/ProjectHeader";
import ProjectSwitcher from "@/components/ProjectSwitcher";
import FeatureCard from "@/components/FeatureCard";
import RecentActivity from "@/components/RecentActivity";
import MessageBoardModal from "@/components/MessageBoardModal";
import { DocsFilesModal } from "@/components/DocsFilesModal";
import { MessageCircle, CheckCircle, FileText, MessageSquare, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserProjects } from "@/hooks/useProjects";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: projects = [] } = useUserProjects();
  const [selectedProject, setSelectedProject] = useState<(typeof projects)[0] | null>(null);
  const [isMessageBoardOpen, setIsMessageBoardOpen] = useState(false);
  const [isDocsFilesOpen, setIsDocsFilesOpen] = useState(false);

  // Set project from URL parameter or default to first project
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
      // Update URL to reflect the selected project
      setSearchParams({ project: projects[0].id });
    }
  }, [projects, searchParams, selectedProject, setSearchParams]);

  // Update URL when project selection changes
  const handleProjectChange = (project: typeof projects[0]) => {
    setSelectedProject(project);
    setSearchParams({ project: project.id });
  };

  const features = [
    {
      title: "Message Board",
      description: `Post announcements and keep discussions organized for ${selectedProject?.project_name || 'this project'}.`,
      buttonText: "Write a message",
      iconBg: "bg-feature-message",
      icon: <MessageCircle className="h-8 w-8" />
    },
    {
      title: "Lineup",
      description: `Organize work and assign tasks for ${selectedProject?.project_name || 'this project'}.`,
      buttonText: "Go to add tasks",
      iconBg: "bg-feature-todos",
      icon: <CheckCircle className="h-8 w-8" />
    },
    {
      title: "Docs & Files",
      description: `Share documents and files for ${selectedProject?.project_name || 'this project'}.`,
      buttonText: "Add docs & files",
      iconBg: "bg-feature-docs",
      icon: <FileText className="h-8 w-8" />
    },
    {
      title: "Chat",
      description: `Chat with team members working on ${selectedProject?.project_name || 'this project'}.`,
      buttonText: "Start chatting",
      iconBg: "bg-feature-chat",
      icon: <MessageSquare className="h-8 w-8" />
    },
    {
      title: "Jobs",
      description: `Track jobs and assignments for ${selectedProject?.project_name || 'this project'}.`,
      buttonText: "Create a job",
      iconBg: "bg-feature-jobs",
      icon: <Briefcase className="h-8 w-8" />
    }
  ];

  const handleFeatureClick = (featureTitle: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!selectedProject) {
      console.warn("No project selected");
      return;
    }

    const projectParam = `?project=${selectedProject.id}`;
    
    switch (featureTitle) {
      case "Message Board":
        // Open the Message Board modal
        setIsMessageBoardOpen(true);
        break;
      case "Lineup":
        // Navigate to lineup/tasks page with project context
        navigate(`/lineup${projectParam}`);
        break;
      case "Docs & Files":
        // Open the Docs & Files modal
        setIsDocsFilesOpen(true);
        break;
      case "Chat":
        // Navigate to chat page with project context
        navigate(`/chat${projectParam}`);
        break;
      case "Jobs":
        // Navigate to a jobs page with project context (placeholder for now)
        console.log(`Opening Jobs for project: ${selectedProject.project_name}`);
        break;
      default:
        console.log(`Clicked on ${featureTitle} for project: ${selectedProject.project_name}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        
        {/* Project Selector Toolbar */}
        <div className="mt-2 mb-4">
          {projects.length > 0 && selectedProject && (
            <ProjectSwitcher
              projects={projects}
              selectedProject={selectedProject}
              onProjectSelect={handleProjectChange}
            />
          )}
        </div>
        
        {/* Project Header */}
        <div className="mb-8">
          <ProjectHeader key={selectedProject?.id} projectId={selectedProject?.id || null} />
        </div>
        
        {/* Features Grid - First Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features.slice(0, 3).map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              buttonText={feature.buttonText}
              iconBg={feature.iconBg}
              icon={feature.icon}
              onClick={() => handleFeatureClick(feature.title)}
            />
          ))}
        </div>

        {/* Features Grid - Second Row (Centered) */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.slice(3, 5).map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                buttonText={feature.buttonText}
                iconBg={feature.iconBg}
                icon={feature.icon}
                onClick={() => handleFeatureClick(feature.title)}
              />
            ))}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div>
          <RecentActivity projectId={selectedProject?.id} />
        </div>
      </div>

      {/* Message Board Modal */}
      <MessageBoardModal
        open={isMessageBoardOpen}
        onOpenChange={setIsMessageBoardOpen}
        projectId={selectedProject?.id || null}
        projectName={selectedProject?.project_name}
      />

      {/* Docs & Files Modal */}
      {selectedProject?.id && (
        <DocsFilesModal
          projectId={selectedProject.id}
          isOpen={isDocsFilesOpen}
          onClose={() => setIsDocsFilesOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;