import Navigation from "@/components/Navigation";

const Lineup = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Lineup</h1>
        <div className="bg-card-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Lineup functionality coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Lineup;