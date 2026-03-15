
-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'training')),
  timestamp TIMESTAMPTZ NOT NULL,
  team_name TEXT,
  made_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  accuracy INTEGER NOT NULL DEFAULT 0,
  avg_feel NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kicks table
CREATE TABLE public.kicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('made', 'miss')),
  kick_type TEXT,
  distance TEXT NOT NULL,
  angle TEXT NOT NULL,
  wind TEXT,
  technical_miss TEXT,
  feel INTEGER,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kicks ENABLE ROW LEVEL SECURITY;

-- Sessions RLS: users own their sessions
CREATE POLICY "Users can select own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- Security definer function to check kick ownership
CREATE OR REPLACE FUNCTION public.owns_kick_session(_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions WHERE id = _session_id AND user_id = auth.uid()
  )
$$;

-- Kicks RLS: users can access kicks belonging to their sessions
CREATE POLICY "Users can select own kicks" ON public.kicks FOR SELECT USING (public.owns_kick_session(session_id));
CREATE POLICY "Users can insert own kicks" ON public.kicks FOR INSERT WITH CHECK (public.owns_kick_session(session_id));
CREATE POLICY "Users can update own kicks" ON public.kicks FOR UPDATE USING (public.owns_kick_session(session_id));
CREATE POLICY "Users can delete own kicks" ON public.kicks FOR DELETE USING (public.owns_kick_session(session_id));

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_timestamp ON public.sessions(timestamp DESC);
CREATE INDEX idx_kicks_session_id ON public.kicks(session_id);
