import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Welcome to AiNDORA Flow
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Organize work across teams and manage your projects efficiently.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/register">
                <UserPlus className="h-4 w-4 mr-2" />
                Register
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Get started by creating an account or logging in to manage your projects.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPage;