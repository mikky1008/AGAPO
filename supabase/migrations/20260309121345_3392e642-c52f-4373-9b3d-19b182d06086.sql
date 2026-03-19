-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table for staff users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Senior citizens table
CREATE TABLE public.seniors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  address TEXT NOT NULL,
  contact_number TEXT,
  health_status TEXT NOT NULL DEFAULT 'Good' CHECK (health_status IN ('Good', 'Fair', 'Poor')),
  illnesses TEXT[] DEFAULT '{}',
  living_alone BOOLEAN DEFAULT false,
  with_family BOOLEAN DEFAULT true,
  emergency_contact TEXT,
  photo TEXT DEFAULT '',
  registered_date DATE NOT NULL DEFAULT CURRENT_DATE,
  priority_level TEXT DEFAULT 'Low' CHECK (priority_level IN ('High', 'Medium', 'Low')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seniors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view seniors" ON public.seniors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert seniors" ON public.seniors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update seniors" ON public.seniors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete seniors" ON public.seniors FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_seniors_updated_at BEFORE UPDATE ON public.seniors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assistance records table
CREATE TABLE public.assistance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  senior_id UUID NOT NULL REFERENCES public.seniors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Financial', 'Medical', 'Food', 'Other')),
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date_given DATE NOT NULL DEFAULT CURRENT_DATE,
  given_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Pending')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assistance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assistance records" ON public.assistance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assistance records" ON public.assistance_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assistance records" ON public.assistance_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete assistance records" ON public.assistance_records FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_assistance_records_updated_at BEFORE UPDATE ON public.assistance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();