import Navigation from "@/components/Navigation";
import ProjectHeader from "@/components/ProjectHeader";
import FeatureCard from "@/components/FeatureCard";
import RecentActivity from "@/components/RecentActivity";
import { MessageCircle, CheckCircle, FileText, MessageSquare, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useUserProjects } from "@/hooks/useProjects";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: projects = [] } = useUserProjects();
  const [selectedProject, setSelectedProject] = useState<(typeof projects)[0] | null>(null);

  // Set the first project as selected when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const features = [
    {
      title: "Message Board",
      description: "Post announcements, pitch ideas, and keep discussions on-topic.",
      buttonText: "Write a message",
      iconBg: "bg-feature-message",
      icon: <MessageCircle className="h-8 w-8" />
    },
    {
      title: "To-dos",
      description: "Organize work across teams. Assign tasks, set due dates, and discuss.",
      buttonText: "Make a to-do list",
      iconBg: "bg-feature-todos",
      icon: <CheckCircle className="h-8 w-8" />
    },
    {
      title: "Docs & Files",
      description: "Share and organize docs, spreadsheets, images, and other files.",
      buttonText: "Add docs & files",
      iconBg: "bg-feature-docs",
      icon: <FileText className="h-8 w-8" />
    },
    {
      title: "Chat",
      description: "Chat casually with your team, ask questions, and share news without ceremony.",
      buttonText: "Start chatting",
      iconBg: "bg-feature-chat",
      icon: <MessageSquare className="h-8 w-8" />
    },
    {
      title: "Jobs",
      description: "Track and manage important jobs and assignments for your team.",
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
    console.log(`Clicked on ${featureTitle}`);
    // This is where you would navigate to the specific feature page
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Dashboard
        </h1>
        
        {/* Project Header */}
        <div className="mb-8">
          <ProjectHeader />
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
    </div>
  );
};

export default Dashboard;