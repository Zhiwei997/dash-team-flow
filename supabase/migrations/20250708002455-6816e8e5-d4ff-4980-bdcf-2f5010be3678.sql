-- Drop existing problematic policies on project_members
DROP POLICY IF EXISTS "Project owners can add members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can remove members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can update member roles" ON public.project_members;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_project_owner(project_id uuid, user_id uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = $1
    AND project_members.user_id = $2
    AND project_members.role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_project_member(project_id uuid, user_id uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = $1
    AND project_members.user_id = $2
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate policies using security definer functions
CREATE POLICY "Project owners can add members"
ON public.project_members
FOR INSERT
WITH CHECK (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can remove members"
ON public.project_members
FOR DELETE
USING (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY "Project owners can update member roles"
ON public.project_members
FOR UPDATE
USING (public.is_project_owner(project_id, auth.uid()));

-- Update the view policy to use the security definer function
DROP POLICY IF EXISTS "Users can view project members for projects they belong to" ON public.project_members;

CREATE POLICY "Users can view project members for projects they belong to"
ON public.project_members
FOR SELECT
USING (public.is_project_member(project_id, auth.uid()));