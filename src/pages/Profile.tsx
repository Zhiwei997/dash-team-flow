import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import { User, Mail, Phone, MapPin, Building, Flag, Hash } from "lucide-react";

interface UserData {
  fullName: string;
  email: string;
  contactNumber: string;
  role: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

const Profile = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <Button onClick={handleLogout} variant="destructive">
            Log out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{user.fullName}</CardTitle>
              <p className="text-muted-foreground">{user.role}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.contactNumber}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Professional</span>
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Role:</span>
                        <p className="text-sm">{user.role}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Email:</span>
                        <p className="text-sm">{user.email}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Contact:</span>
                        <p className="text-sm">{user.contactNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">City:</span>
                        <p className="text-sm">{user.city}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Province/State:</span>
                        <p className="text-sm">{user.province}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-muted-foreground">Country:</span>
                          <p className="text-sm flex items-center space-x-1">
                            <Flag className="h-3 w-3" />
                            <span>{user.country}</span>
                          </p>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-muted-foreground">Postal Code:</span>
                          <p className="text-sm flex items-center space-x-1">
                            <Hash className="h-3 w-3" />
                            <span>{user.postalCode}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;