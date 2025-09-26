import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import UserDropdown from "@/components/UserDropdown";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Lineup", path: "/lineup" },
    { name: "Activity", path: "/activity", icon: "⚡" },
    { name: "Chat", path: "/chat", icon: "💬" },
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

    // Close mobile menu after navigation
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Brand */}
          <div className="flex items-center">
            <button
              className="text-lg sm:text-xl font-semibold text-nav-brand"
              onClick={() => handleNavClick("/")}
            >
              AiNDORA Flow
            </button>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <>
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

              {/* Search and User */}
              <div className="flex items-center space-x-4">
                {user && (
                  <button
                    onClick={() => setIsSearchModalOpen(true)}
                    className="p-2 rounded-md text-nav-link hover:text-foreground transition-colors"
                    aria-label="Search users"
                  >
                    <Search size={20} />
                  </button>
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
            </>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="flex items-center space-x-2">
              {user && (
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="p-2 rounded-md text-nav-link hover:text-foreground transition-colors"
                  aria-label="Search users"
                >
                  <Search size={20} />
                </button>
              )}
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-nav-link hover:text-foreground transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border shadow-lg transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-lg font-semibold">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-nav-link hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="flex-1 p-4">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.path)}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-left font-medium transition-colors text-nav-link hover:text-foreground hover:bg-accent"
                    >
                      {item.icon && <span className="text-lg">{item.icon}</span>}
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile User Section */}
              <div className="p-4 border-t border-border">
                {user ? (
                  <UserDropdown />
                ) : (
                  <Button
                    onClick={() => {
                      navigate("/login");
                      setIsMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};

export default Navigation;