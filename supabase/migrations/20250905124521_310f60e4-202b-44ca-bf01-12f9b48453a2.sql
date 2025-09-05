-- Create jobs table
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  required_people integer NOT NULL DEFAULT 1,
  publisher_name text NOT NULL,
  publisher_email text NOT NULL,
  publisher_phone text,
  deadline date,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Anyone can view jobs" 
ON public.jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Project members can create jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by) AND (EXISTS ( 
  SELECT 1 FROM project_members pm 
  WHERE pm.project_id = jobs.project_id AND pm.user_id = auth.uid()
)));

CREATE POLICY "Job creators can update their jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Job creators can delete their jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() = created_by);

-- Job applications policies
CREATE POLICY "Job creators can view applications for their jobs" 
ON public.job_applications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM jobs j 
  WHERE j.id = job_applications.job_id AND j.created_by = auth.uid()
));

CREATE POLICY "Applicants can view their own applications" 
ON public.job_applications 
FOR SELECT 
USING (auth.uid() = applicant_id);

CREATE POLICY "Authenticated users can apply for jobs" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Job creators can update applications" 
ON public.job_applications 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM jobs j 
  WHERE j.id = job_applications.job_id AND j.created_by = auth.uid()
));

CREATE POLICY "Applicants can delete their own applications" 
ON public.job_applications 
FOR DELETE 
USING (auth.uid() = applicant_id);

-- Create updated_at trigger for jobs
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();