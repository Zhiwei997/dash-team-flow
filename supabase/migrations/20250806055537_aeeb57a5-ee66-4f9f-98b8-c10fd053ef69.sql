-- Create activity_logs table to track project activities
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for activity logs
CREATE POLICY "Users can view activity logs for projects they belong to" 
ON public.activity_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = activity_logs.project_id 
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create activity logs for projects they belong to" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = activity_logs.project_id 
    AND pm.user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Create function to log task activities
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      NEW.project_id,
      NEW.created_by,
      'task_created',
      jsonb_build_object(
        'task_id', NEW.id,
        'task_name', NEW.task_name,
        'module_name', NEW.module_name
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log task updates
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      NEW.project_id,
      auth.uid(),
      'task_updated',
      jsonb_build_object(
        'task_id', NEW.id,
        'task_name', NEW.task_name,
        'changes', jsonb_build_object(
          'progress_changed', CASE WHEN OLD.progress != NEW.progress THEN true ELSE false END,
          'old_progress', OLD.progress,
          'new_progress', NEW.progress,
          'dates_changed', CASE WHEN OLD.start_date != NEW.start_date OR OLD.end_date != NEW.end_date THEN true ELSE false END
        )
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      OLD.project_id,
      auth.uid(),
      'task_deleted',
      jsonb_build_object(
        'task_name', OLD.task_name,
        'module_name', OLD.module_name
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for task activities
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_activity();