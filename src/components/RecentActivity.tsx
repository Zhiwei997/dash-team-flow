import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLogs, formatActivityMessage } from "@/hooks/useActivityLogs";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface RecentActivityProps {
  projectId?: string;
}

const RecentActivity = ({ projectId }: RecentActivityProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: activityLogs = [] } = useActivityLogs(projectId);
  
  // Get the latest 5 activity logs
  const recentActivities = activityLogs.slice(0, 5);

  const handleViewAllActivity = () => {
    if (projectId) {
      navigate(`/activity?project=${projectId}`);
    } else {
      navigate('/activity');
    }
  };

  return (
    <Card className="p-6 bg-card-muted border-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          📋
        </button>
      </div>
      
      <div className="text-sm text-muted-foreground mb-4">
        {projectId ? "Latest actions across this project" : "Select a project to view activity"}
      </div>
      
      <div className="space-y-3">
        {!projectId ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please select a project to view recent activity.</p>
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">➤ No recent activity yet.</p>
          </div>
        ) : (
          recentActivities.map((log) => {
            const formattedMessage = formatActivityMessage(log);
            const relativeTime = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });
            
            return (
              <div key={log.id} className="text-sm text-foreground">
                • {formattedMessage} – {relativeTime}
              </div>
            );
          })
        )}
      </div>
      
      {projectId && (
        <button 
          className="text-sm text-nav-link-active hover:text-nav-link-active/80 mt-4"
          onClick={handleViewAllActivity}
        >
          View all activity
        </button>
      )}
    </Card>
  );
};

export default RecentActivity;