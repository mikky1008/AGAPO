-- ============================================================
-- FIX: handle_new_user trigger was ignoring the 'role' field
-- from signup metadata, causing all new accounts to default
-- to 'staff' even when registering as 'admin'.
--
-- RUN THIS in your Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
