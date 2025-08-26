-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- Create project_files table
CREATE TABLE public.project_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    name text NOT NULL,
    path text NOT NULL,
    mime_type text,
    size bigint,
    description text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_files table
CREATE POLICY "Project members can view files" 
ON public.project_files 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.project_members pm 
    WHERE pm.project_id = project_files.project_id 
    AND pm.user_id = auth.uid()
));

CREATE POLICY "Project members can upload files" 
ON public.project_files 
FOR INSERT 
WITH CHECK (
    auth.uid() = created_by 
    AND EXISTS (
        SELECT 1 FROM public.project_members pm 
        WHERE pm.project_id = project_files.project_id 
        AND pm.user_id = auth.uid()
    )
);

CREATE POLICY "File owners and project owners can update files" 
ON public.project_files 
FOR UPDATE 
USING (
    auth.uid() = created_by 
    OR is_project_owner(project_id, auth.uid())
);

CREATE POLICY "File owners and project owners can delete files" 
ON public.project_files 
FOR DELETE 
USING (
    auth.uid() = created_by 
    OR is_project_owner(project_id, auth.uid())
);

-- Storage policies for project-files bucket
CREATE POLICY "Project members can view project files" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'project-files' 
    AND EXISTS (
        SELECT 1 FROM public.project_files pf
        JOIN public.project_members pm ON pm.project_id = pf.project_id
        WHERE pf.path = name AND pm.user_id = auth.uid()
    )
);

CREATE POLICY "Project members can upload project files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'project-files'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "File owners and project owners can update project files" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'project-files'
    AND (
        auth.uid()::text = (storage.foldername(name))[2] 
        OR EXISTS (
            SELECT 1 FROM public.project_files pf
            WHERE pf.path = name 
            AND is_project_owner(pf.project_id, auth.uid())
        )
    )
);

CREATE POLICY "File owners and project owners can delete project files" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'project-files'
    AND (
        auth.uid()::text = (storage.foldername(name))[2] 
        OR EXISTS (
            SELECT 1 FROM public.project_files pf
            WHERE pf.path = name 
            AND is_project_owner(pf.project_id, auth.uid())
        )
    )
);