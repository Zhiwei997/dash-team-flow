import { Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Input } from "@/components/ui/input";

const Navigation = () => {
  const navItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Lineup", path: "/lineup" },
    { name: "Activity", path: "/activity", icon: "⚡" },
    { name: "Messages", path: "/messages", icon: "💬" },
  ];

  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-semibold text-nav-brand">RestoreAI</h1>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-nav-link-active bg-nav-link-active/10"
                      : "text-nav-link hover:text-foreground"
                  }`
                }
              >
                {item.icon && <span className="text-base">{item.icon}</span>}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Search and User */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Find"
              className="pl-10 w-64 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
            D
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;