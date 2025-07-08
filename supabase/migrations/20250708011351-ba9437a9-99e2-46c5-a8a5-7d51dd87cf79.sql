-- Fix infinite recursion in conversation_members policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view members of conversations they belong to" ON public.conversation_members;
DROP POLICY IF EXISTS "Conversation admins can add members" ON public.conversation_members;
DROP POLICY IF EXISTS "Conversation admins can remove members" ON public.conversation_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_conversation_member(conversation_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members 
    WHERE conversation_members.conversation_id = $1 
    AND conversation_members.user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_conversation_admin(conversation_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members 
    WHERE conversation_members.conversation_id = $1 
    AND conversation_members.user_id = $2 
    AND conversation_members.role IN ('owner', 'admin')
  );
$$;

-- Create new policies using the security definer functions
CREATE POLICY "Users can view members of conversations they belong to" 
ON public.conversation_members 
FOR SELECT 
USING (public.user_is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Conversation admins can add members" 
ON public.conversation_members 
FOR INSERT 
WITH CHECK (public.user_is_conversation_admin(conversation_id, auth.uid()));

CREATE POLICY "Conversation admins can remove members" 
ON public.conversation_members 
FOR DELETE 
USING (public.user_is_conversation_admin(conversation_id, auth.uid()));