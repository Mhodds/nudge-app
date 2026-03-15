
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can select own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

DROP POLICY IF EXISTS "Users can select own kicks" ON public.kicks;
DROP POLICY IF EXISTS "Users can insert own kicks" ON public.kicks;
DROP POLICY IF EXISTS "Users can update own kicks" ON public.kicks;
DROP POLICY IF EXISTS "Users can delete own kicks" ON public.kicks;

-- Recreate as permissive (default)
CREATE POLICY "Users can select own sessions" ON public.sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can select own kicks" ON public.kicks FOR SELECT TO authenticated USING (public.owns_kick_session(session_id));
CREATE POLICY "Users can insert own kicks" ON public.kicks FOR INSERT TO authenticated WITH CHECK (public.owns_kick_session(session_id));
CREATE POLICY "Users can update own kicks" ON public.kicks FOR UPDATE TO authenticated USING (public.owns_kick_session(session_id));
CREATE POLICY "Users can delete own kicks" ON public.kicks FOR DELETE TO authenticated USING (public.owns_kick_session(session_id));
