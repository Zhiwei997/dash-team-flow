-- Fix search path security for all functions
CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'projects' THEN
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      NEW.id,
      NEW.created_by,
      'project_created',
      jsonb_build_object(
        'project_name', NEW.project_name,
        'description', NEW.description
      )
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_project_member_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  invited_user_name text;
  removed_user_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the invited user's name
    SELECT full_name INTO invited_user_name
    FROM public.users
    WHERE id = NEW.user_id;
    
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      NEW.project_id,
      auth.uid(), -- The user who performed the invitation
      'member_added',
      jsonb_build_object(
        'invited_user_id', NEW.user_id,
        'invited_user_name', COALESCE(invited_user_name, 'Unknown User'),
        'role', NEW.role
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get the removed user's name
    SELECT full_name INTO removed_user_name
    FROM public.users
    WHERE id = OLD.user_id;
    
    INSERT INTO public.activity_logs (project_id, user_id, action, details)
    VALUES (
      OLD.project_id,
      auth.uid(), -- The user who performed the removal
      'member_removed',
      jsonb_build_object(
        'removed_user_id', OLD.user_id,
        'removed_user_name', COALESCE(removed_user_name, 'Unknown User'),
        'role', OLD.role
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update existing functions to have proper search path
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;