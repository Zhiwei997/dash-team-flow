-- Update RLS policy to allow users to view other users' basic profile information
DROP POLICY "Users can view their own profile" ON public.users;

CREATE POLICY "Users can view all profiles" 
ON public.users 
FOR SELECT 
USING (true);