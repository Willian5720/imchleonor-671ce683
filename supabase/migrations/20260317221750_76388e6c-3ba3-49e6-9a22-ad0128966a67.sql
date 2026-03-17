-- Enable realtime for security_events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;