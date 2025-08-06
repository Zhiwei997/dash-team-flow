-- Create tasks table for timeline management
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  task_name TEXT NOT NULL,
  assigned_to UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  module_name TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view tasks for projects they belong to" 
ON public.tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks for projects they belong to" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks for projects they belong to" 
ON public.tasks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks for projects they belong to" 
ON public.tasks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = tasks.project_id
    AND pm.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();