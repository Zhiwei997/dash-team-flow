import { Card } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  project?: string;
}

const RecentActivity = () => {
  const activities: ActivityItem[] = [
    {
      id: "1",
      user: "D",
      action: "Delta added a member to",
      time: "about 1 month ago",
      project: "New team member added to project"
    },
    {
      id: "2", 
      user: "D",
      action: "Delta created project",
      time: "about 1 month ago",
      project: "Project: Delta"
    }
  ];

  return (
    <Card className="p-6 bg-card-muted border-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          📋
        </button>
      </div>
      
      <div className="text-sm text-muted-foreground mb-4">
        Latest actions across this project
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
              {activity.user}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground">
                {activity.action}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ⏰ {activity.time}
              </div>
              {activity.project && (
                <div className="text-xs text-muted-foreground mt-1">
                  {activity.project}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button className="text-sm text-nav-link-active hover:text-nav-link-active/80 mt-4">
        View all activity
      </button>
    </Card>
  );
};

export default RecentActivity;