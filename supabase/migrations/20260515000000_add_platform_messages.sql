CREATE TABLE public.platform_messages (
    id uuid primary key default gen_random_uuid(),
    title text,
    content text not null,
    type text not null default 'info',
    created_at timestamptz not null default now(),
    is_active boolean not null default true
);

GRANT SELECT ON public.platform_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_messages TO authenticated;
GRANT ALL ON public.platform_messages TO service_role;

ALTER TABLE public.platform_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by everyone" ON public.platform_messages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert messages" ON public.platform_messages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update messages" ON public.platform_messages FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete messages" ON public.platform_messages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
