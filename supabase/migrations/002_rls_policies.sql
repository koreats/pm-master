-- Enable Row Level Security for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check team membership
CREATE OR REPLACE FUNCTION is_team_member(team_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = $1
        AND team_members.user_id = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check team role
CREATE OR REPLACE FUNCTION get_team_role(team_id UUID, user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.team_members
        WHERE team_members.team_id = $1
        AND team_members.user_id = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view team members"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm1
            JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
            WHERE tm1.user_id = auth.uid()
            AND tm2.user_id = users.id
        )
    );

-- Teams table policies
CREATE POLICY "Users can view teams they belong to"
    ON public.teams FOR SELECT
    USING (is_team_member(id, auth.uid()));

CREATE POLICY "Users can create teams"
    ON public.teams FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners and admins can update teams"
    ON public.teams FOR UPDATE
    USING (get_team_role(id, auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Team owners can delete teams"
    ON public.teams FOR DELETE
    USING (get_team_role(id, auth.uid()) = 'owner');

-- Team members table policies
CREATE POLICY "Team members can view team membership"
    ON public.team_members FOR SELECT
    USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Team owners and admins can add members"
    ON public.team_members FOR INSERT
    WITH CHECK (get_team_role(team_id, auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Team owners and admins can update member roles"
    ON public.team_members FOR UPDATE
    USING (get_team_role(team_id, auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Team owners can remove members"
    ON public.team_members FOR DELETE
    USING (get_team_role(team_id, auth.uid()) = 'owner' OR user_id = auth.uid());

-- Goals table policies
CREATE POLICY "Team members can view goals"
    ON public.goals FOR SELECT
    USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can create goals"
    ON public.goals FOR INSERT
    WITH CHECK (is_team_member(team_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Team members can update goals"
    ON public.goals FOR UPDATE
    USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Team admins and owners can delete goals"
    ON public.goals FOR DELETE
    USING (get_team_role(team_id, auth.uid()) IN ('owner', 'admin'));

-- Projects table policies
CREATE POLICY "Team members can view projects"
    ON public.projects FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.goals
            WHERE goals.id = projects.goal_id
            AND is_team_member(goals.team_id, auth.uid())
        )
    );

CREATE POLICY "Team members can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.goals
            WHERE goals.id = goal_id
            AND is_team_member(goals.team_id, auth.uid())
        ) AND auth.uid() = created_by
    );

CREATE POLICY "Team members can update projects"
    ON public.projects FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.goals
            WHERE goals.id = projects.goal_id
            AND is_team_member(goals.team_id, auth.uid())
        )
    );

CREATE POLICY "Team admins and owners can delete projects"
    ON public.projects FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.goals
            WHERE goals.id = projects.goal_id
            AND get_team_role(goals.team_id, auth.uid()) IN ('owner', 'admin')
        )
    );

-- Tasks table policies
CREATE POLICY "Team members can view tasks"
    ON public.tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE projects.id = tasks.project_id
            AND is_team_member(goals.team_id, auth.uid())
        )
    );

CREATE POLICY "Team members can create tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE projects.id = project_id
            AND is_team_member(goals.team_id, auth.uid())
        ) AND auth.uid() = created_by
    );

CREATE POLICY "Team members can update tasks"
    ON public.tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE projects.id = tasks.project_id
            AND is_team_member(goals.team_id, auth.uid())
        )
    );

CREATE POLICY "Team members can delete tasks"
    ON public.tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE projects.id = tasks.project_id
            AND is_team_member(goals.team_id, auth.uid())
        )
    );

-- Comments table policies
CREATE POLICY "Team members can view comments"
    ON public.comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            JOIN public.projects ON projects.id = tasks.project_id
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE tasks.id = comments.task_id
            AND is_team_member(goals.team_id, auth.uid())
        )
    );

CREATE POLICY "Team members can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks
            JOIN public.projects ON projects.id = tasks.project_id
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE tasks.id = task_id
            AND is_team_member(goals.team_id, auth.uid())
        ) AND auth.uid() = user_id
    );

CREATE POLICY "Comment authors can update their comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Comment authors can delete their comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- Attachments table policies
CREATE POLICY "Team members can view attachments"
    ON public.attachments FOR SELECT
    USING (
        (task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.tasks
            JOIN public.projects ON projects.id = tasks.project_id
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE tasks.id = attachments.task_id
            AND is_team_member(goals.team_id, auth.uid())
        )) OR
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.projects
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE projects.id = attachments.project_id
            AND is_team_member(goals.team_id, auth.uid())
        ))
    );

CREATE POLICY "Team members can upload attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (
        ((task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.tasks
            JOIN public.projects ON projects.id = tasks.project_id
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE tasks.id = task_id
            AND is_team_member(goals.team_id, auth.uid())
        )) OR
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.projects
            JOIN public.goals ON goals.id = projects.goal_id
            WHERE projects.id = project_id
            AND is_team_member(goals.team_id, auth.uid())
        ))) AND auth.uid() = uploaded_by
    );

CREATE POLICY "Attachment uploaders can delete their attachments"
    ON public.attachments FOR DELETE
    USING (auth.uid() = uploaded_by);

-- Activity logs table policies
CREATE POLICY "Team members can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "System can create activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (is_team_member(team_id, auth.uid()) AND auth.uid() = user_id);