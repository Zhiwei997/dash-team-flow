-- Drop existing functions and recreate with your definitions
DROP FUNCTION IF EXISTS public.user_is_conversation_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.user_is_conversation_member(uuid, uuid);

-- Create your functions with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.user_is_conversation_admin(conv_id uuid, uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id
      AND user_id = uid
      AND role IN ('owner', 'admin')  -- Include both owner and admin roles
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_conversation_member(conv_id uuid, uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id
      AND user_id = uid
  );
END;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they belong to" ON public.conversations;
DROP POLICY IF EXISTS "Conversation owners can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Conversation owners can delete conversations" ON public.conversations;

-- Create new policies using security definer functions
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view conversations they belong to" 
ON public.conversations 
FOR SELECT 
USING (public.user_is_conversation_member(id, auth.uid()));

CREATE POLICY "Conversation admins can update conversations" 
ON public.conversations 
FOR UPDATE 
USING (public.user_is_conversation_admin(id, auth.uid()));

CREATE POLICY "Conversation owners can delete conversations" 
ON public.conversations 
FOR DELETE 
USING (public.user_is_conversation_admin(id, auth.uid()));