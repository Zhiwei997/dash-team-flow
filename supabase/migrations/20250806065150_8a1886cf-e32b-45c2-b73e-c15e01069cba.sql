-- Create project_messages table
CREATE TABLE public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view messages for projects they belong to"
ON public.project_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_messages.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to projects they belong to"
ON public.project_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_messages.project_id
    AND pm.user_id = auth.uid()
  )
);

-- Create function to log message activity
CREATE OR REPLACE FUNCTION public.log_message_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.activity_logs (project_id, user_id, action, details)
  VALUES (
    NEW.project_id,
    NEW.user_id,
    'message_sent',
    jsonb_build_object(
      'content', CASE 
        WHEN length(NEW.content) > 100 
        THEN left(NEW.content, 100) || '...' 
        ELSE NEW.content 
      END
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for message activity logging
CREATE TRIGGER log_message_activity_trigger
AFTER INSERT ON public.project_messages
FOR EACH ROW
EXECUTE FUNCTION public.log_message_activity();