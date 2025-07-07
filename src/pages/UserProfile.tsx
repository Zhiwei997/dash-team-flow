import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { User, Mail, Phone, MapPin, Building, Flag, Hash, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserData {
  full_name: string;
  email: string;
  contact_number: string;
  role: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setError("User ID not provided");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            setError("User not found");
          } else {
            setError("Failed to load user data");
          }
          return;
        }

        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError("An error occurred while loading user data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{error || "User not found"}</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button onClick={() => navigate(-1)} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              {isOwnProfile ? "My Profile" : `${userData.full_name}'s Profile`}
            </h1>
          </div>
          {isOwnProfile && (
            <Button onClick={() => navigate("/profile")} variant="outline">
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials(userData.full_name)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{userData.full_name}</CardTitle>
              <p className="text-muted-foreground">{userData.role}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{userData.contact_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Details</span>
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
                        <p className="text-sm">{userData.role}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Email:</span>
                        <p className="text-sm">{userData.email}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Contact:</span>
                        <p className="text-sm">{userData.contact_number}</p>
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
                        <p className="text-sm">{userData.city}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Province/State:</span>
                        <p className="text-sm">{userData.province}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-muted-foreground">Country:</span>
                          <p className="text-sm flex items-center space-x-1">
                            <Flag className="h-3 w-3" />
                            <span>{userData.country}</span>
                          </p>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-muted-foreground">Postal Code:</span>
                          <p className="text-sm flex items-center space-x-1">
                            <Hash className="h-3 w-3" />
                            <span>{userData.postal_code}</span>
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

export default UserProfile;