-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically update project progress based on tasks
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    new_progress INTEGER;
BEGIN
    -- Count total tasks and completed tasks for the project
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
    INTO total_tasks, completed_tasks
    FROM public.tasks
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
    
    -- Calculate progress percentage
    IF total_tasks > 0 THEN
        new_progress := ROUND((completed_tasks::NUMERIC / total_tasks) * 100);
    ELSE
        new_progress := 0;
    END IF;
    
    -- Update project progress
    UPDATE public.projects
    SET progress = new_progress
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project progress when tasks change
CREATE TRIGGER update_project_progress_on_task_change
    AFTER INSERT OR UPDATE OF status OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_progress();

-- Function to automatically update goal progress based on projects
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
    avg_progress NUMERIC;
BEGIN
    -- Calculate average progress of all projects in the goal
    SELECT AVG(progress)
    INTO avg_progress
    FROM public.projects
    WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id);
    
    -- Update goal progress
    UPDATE public.goals
    SET progress = COALESCE(ROUND(avg_progress), 0)
    WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update goal progress when projects change
CREATE TRIGGER update_goal_progress_on_project_change
    AFTER INSERT OR UPDATE OF progress OR DELETE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    team_id_val UUID;
    entity_type_val TEXT;
    entity_id_val UUID;
    action_val TEXT;
    metadata_val JSONB;
BEGIN
    -- Determine entity type and get team_id
    IF TG_TABLE_NAME = 'goals' THEN
        entity_type_val := 'goal';
        entity_id_val := COALESCE(NEW.id, OLD.id);
        team_id_val := COALESCE(NEW.team_id, OLD.team_id);
    ELSIF TG_TABLE_NAME = 'projects' THEN
        entity_type_val := 'project';
        entity_id_val := COALESCE(NEW.id, OLD.id);
        SELECT g.team_id INTO team_id_val
        FROM public.goals g
        WHERE g.id = COALESCE(NEW.goal_id, OLD.goal_id);
    ELSIF TG_TABLE_NAME = 'tasks' THEN
        entity_type_val := 'task';
        entity_id_val := COALESCE(NEW.id, OLD.id);
        SELECT g.team_id INTO team_id_val
        FROM public.projects p
        JOIN public.goals g ON g.id = p.goal_id
        WHERE p.id = COALESCE(NEW.project_id, OLD.project_id);
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        action_val := 'created';
        metadata_val := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'UPDATE' THEN
        action_val := 'updated';
        metadata_val := jsonb_build_object(
            'old', row_to_json(OLD)::JSONB,
            'new', row_to_json(NEW)::JSONB
        );
    ELSIF TG_OP = 'DELETE' THEN
        action_val := 'deleted';
        metadata_val := row_to_json(OLD)::JSONB;
    END IF;
    
    -- Insert activity log
    INSERT INTO public.activity_logs (team_id, user_id, entity_type, entity_id, action, metadata)
    VALUES (team_id_val, auth.uid(), entity_type_val, entity_id_val, action_val, metadata_val);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for activity logging
CREATE TRIGGER log_goal_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_project_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_task_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();