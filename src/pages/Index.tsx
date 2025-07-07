import Dashboard from "./Dashboard";
import LandingPage from "@/components/LandingPage";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
};

export default Index;