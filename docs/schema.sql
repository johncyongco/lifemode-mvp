-- SESSIONS table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent TEXT,
  mode TEXT DEFAULT 'quick',
  thought TEXT,
  exchange_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress',
  clarity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- MESSAGES table (separate from sessions for proper relational data)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'user')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()
  ));

-- WISDOM ENTRIES table
CREATE TABLE public.wisdom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  intent TEXT,
  micro_lens TEXT,
  macro_lens TEXT,
  perspective TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wisdom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wisdom"
  ON public.wisdom FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wisdom"
  ON public.wisdom FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wisdom"
  ON public.wisdom FOR DELETE
  USING (auth.uid() = user_id);
