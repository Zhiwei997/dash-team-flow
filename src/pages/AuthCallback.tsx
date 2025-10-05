import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const getUserDetails = async () => {
      const { data, error } = await supabase.from("users").select("*").eq("id", user?.id).single();
      if (error) {
        toast.error(error.message);
        return;
      }

      console.log(data);

      if (data.onboarded) {
        navigate("/");
      } else {
        navigate("/setup");
      }
    };
    getUserDetails();
  }, [navigate, user, loading]);

  if (loading) return <div>Loading...</div>;

  return <div>AuthCallback</div>;
};

export default AuthCallback;