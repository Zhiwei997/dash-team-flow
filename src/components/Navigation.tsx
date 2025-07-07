import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import UserDropdown from "@/components/UserDropdown";
import UserSearch from "@/components/UserSearch";
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
    
    // For logged-in users, Home should go to dashboard
    if (path === "/" && user) {
      navigate("/");
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
          {user && <UserSearch />}
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