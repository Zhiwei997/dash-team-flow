import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Home } from "lucide-react";

interface UserData {
  fullName: string;
  email: string;
  password: string;
  contactNumber: string;
  role: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

const Register = () => {
  const [userData, setUserData] = useState<UserData>({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    role: "",
    city: "",
    province: "",
    country: "",
    postalCode: ""
  });
  
  const navigate = useNavigate();

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage (in real app this would connect to backend)
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    users.push(userData);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(userData));
    
    // Redirect to profile page
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Create Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={userData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={userData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={userData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    placeholder="Enter your contact number"
                    value={userData.contactNumber}
                    onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    placeholder="Enter your role"
                    value={userData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Enter your city"
                    value={userData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province / State *</Label>
                  <Input
                    id="province"
                    placeholder="Enter your province/state"
                    value={userData.province}
                    onChange={(e) => handleInputChange("province", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="Enter your country"
                    value={userData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal / Zip Code *</Label>
                  <Input
                    id="postalCode"
                    placeholder="Enter your postal/zip code"
                    value={userData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    required
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/login">Back to Login</Link>
              </Button>
            </div>
          </form>

          <div className="text-center mt-6">
            <Button variant="ghost" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;