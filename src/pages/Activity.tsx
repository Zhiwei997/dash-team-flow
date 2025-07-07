import Navigation from "@/components/Navigation";

const Activity = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Activity</h1>
        <div className="bg-card-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Activity feed coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Activity;