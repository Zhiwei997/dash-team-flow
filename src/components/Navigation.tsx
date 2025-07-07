import { Search } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import UserDropdown from "@/components/UserDropdown";
import { useAuth } from "@/hooks/useAuth";

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Lineup", path: "/lineup" },
    { name: "Activity", path: "/activity", icon: "⚡" },
    { name: "Messages", path: "/messages", icon: "💬" },
  ];

  const handleNavClick = (path: string) => {
    if (!user && path !== "/") {
      navigate("/login");
      return;
    }
    navigate(path);
  };

  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-semibold text-nav-brand">RestoreAI</h1>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.path)}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors text-nav-link hover:text-foreground"
              >
                {item.icon && <span className="text-base">{item.icon}</span>}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and User */}
        <div className="flex items-center space-x-4">
          {user && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Find"
                className="pl-10 w-64 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          )}
          <ThemeToggle />
          {user ? (
            <UserDropdown />
          ) : (
            <Button onClick={() => navigate("/login")} variant="outline">
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;