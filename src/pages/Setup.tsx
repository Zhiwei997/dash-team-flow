import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Setup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    role: "",
    city: "",
    province: "",
    country: "",
    postalCode: "",
  });

  const [error, setError] = useState("");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (error) {
        setError(error.message);
        return;
      }

      setFormData(prev => ({
        ...prev,
        fullName: data?.full_name ?? prev.fullName,
        contactNumber: data?.contact_number ?? prev.contactNumber,
        role: data?.role ?? prev.role,
        city: data?.city ?? prev.city,
        province: data?.province ?? prev.province,
        country: data?.country ?? prev.country,
        postalCode: data?.postal_code ?? prev.postalCode,
      }));

      setLoading(false);
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fullNameFromAuth = user.user_metadata?.full_name as string | undefined;
    if (!fullNameFromAuth) return;

    setFormData(prev => (prev.fullName ? prev : { ...prev, fullName: fullNameFromAuth }));
  }, [user]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { error } = await supabase.from("users").update({
        full_name: formData.fullName,
        contact_number: formData.contactNumber,
        role: formData.role,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        postal_code: formData.postalCode,
        onboarded: true,
      }).eq("id", user.id);

      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  // setup from registration page
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Setup Your Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSetup} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="Enter your contact number"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                type="text"
                placeholder="Enter your role (e.g., Property Owner, Contractor)"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province *</Label>
                <Input
                  id="province"
                  type="text"
                  placeholder="Enter your province"
                  value={formData.province}
                  onChange={(e) => handleInputChange("province", e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="Enter your country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="Enter your postal code"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Setting up..." : "Setup"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;