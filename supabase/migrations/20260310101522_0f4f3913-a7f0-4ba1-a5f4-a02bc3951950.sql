
ALTER TABLE public.seniors ADD COLUMN IF NOT EXISTS income_level text DEFAULT 'Low' NOT NULL;
ALTER TABLE public.seniors ADD COLUMN IF NOT EXISTS living_status text DEFAULT 'With Family' NOT NULL;

-- Migrate existing data: set living_status based on living_alone
UPDATE public.seniors SET living_status = CASE WHEN living_alone = true THEN 'Living Alone' ELSE 'With Family' END;
