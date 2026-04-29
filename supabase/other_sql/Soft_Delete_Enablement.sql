
-- 1. Add deleted_at columns
ALTER TABLE public.seniors
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.assistance_records
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Update RLS policies on seniors to hide soft-deleted rows
--    Drop old permissive SELECT and replace with filtered one
DROP POLICY IF EXISTS "Authenticated users can view seniors" ON public.seniors;
CREATE POLICY "Authenticated users can view seniors"
  ON public.seniors FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Allow admins to see deleted rows too
CREATE POLICY "Admins can view deleted seniors"
  ON public.seniors FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Update RLS on assistance_records
DROP POLICY IF EXISTS "Authenticated users can view assistance records" ON public.assistance_records;
CREATE POLICY "Authenticated users can view assistance records"
  ON public.assistance_records FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can view deleted assistance records"
  ON public.assistance_records FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Helper function: soft-delete a senior (sets deleted_at, does NOT remove row)
CREATE OR REPLACE FUNCTION public.soft_delete_senior(_senior_id UUID, _user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.seniors
  SET deleted_at = now()
  WHERE id = _senior_id
    AND deleted_at IS NULL;
END;
$$;

-- 5. Helper function: soft-delete an assistance record
CREATE OR REPLACE FUNCTION public.soft_delete_assistance(_record_id UUID, _user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.assistance_records
  SET deleted_at = now()
  WHERE id = _record_id
    AND deleted_at IS NULL;
END;
$$;

-- 6. Helper function: restore a soft-deleted senior (admin only)
CREATE OR REPLACE FUNCTION public.restore_senior(_senior_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.seniors
  SET deleted_at = NULL
  WHERE id = _senior_id;
END;
$$;

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seniors_deleted_at ON public.seniors (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assistance_deleted_at ON public.assistance_records (deleted_at) WHERE deleted_at IS NULL;