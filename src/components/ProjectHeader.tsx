import { ChevronDown, Settings, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ProjectHeader = () => {
  return (
    <Card className="p-6 bg-card-muted border-0 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Project Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-semibold text-foreground">Delta</h2>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-sm text-muted-foreground">1</div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="bg-card hover:bg-muted">
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
          <Button variant="outline" size="sm" className="bg-card hover:bg-muted">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
        </div>
      </div>
      
      {/* Project Members */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">Project Members (1)</span>
        </div>
      </div>
    </Card>
  );
};

export default ProjectHeader;