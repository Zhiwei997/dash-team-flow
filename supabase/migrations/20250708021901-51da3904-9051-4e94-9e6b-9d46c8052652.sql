-- Fix the main issue: Update conversation creation policy to ensure proper authentication
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- Create a more robust policy that checks for authenticated user
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = created_by
);