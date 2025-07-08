-- Update existing functions to match your requirements
CREATE OR REPLACE FUNCTION public.user_is_conversation_admin(conv_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id
      AND user_id = uid
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_conversation_member(conv_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id
      AND user_id = uid
  );
$$;

-- Update the conversations policies to use proper auth checking
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Update other policies to use the security definer functions
DROP POLICY IF EXISTS "Users can view conversations they belong to" ON public.conversations;
CREATE POLICY "Users can view conversations they belong to" 
ON public.conversations 
FOR SELECT 
USING (public.user_is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "Conversation owners can update conversations" ON public.conversations;
CREATE POLICY "Conversation admins can update conversations" 
ON public.conversations 
FOR UPDATE 
USING (public.user_is_conversation_admin(id, auth.uid()));

DROP POLICY IF EXISTS "Conversation owners can delete conversations" ON public.conversations;
CREATE POLICY "Conversation owners can delete conversations" 
ON public.conversations 
FOR DELETE 
USING (public.user_is_conversation_admin(id, auth.uid()));