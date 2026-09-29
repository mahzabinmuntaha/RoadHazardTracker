-- ====================================================================
-- Road Hazard Reporting & Tracking System
-- University Individual Project - Supabase PostgreSQL Database Schema
-- ====================================================================

-- 1. Enable UUID Extension (Supabase default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 2. Departments Table
-- Generic prototype departments (Road & Infrastructure, Traffic, etc.)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 3. User Profiles Table (Linked to Supabase auth.users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 4. Area & Hazard Type to Department Mapping Table
-- Automatically suggests responsible department based on Area + Hazard
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.area_department_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area TEXT NOT NULL,
    hazard_type TEXT NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    CONSTRAINT unique_area_hazard UNIQUE (area, hazard_type)
);

-- --------------------------------------------------------------------
-- 5. Hazards Table (Main Report Entity)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hazards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    hazard_type TEXT NOT NULL,
    area TEXT NOT NULL,
    road_name TEXT NOT NULL,
    landmark TEXT,
    severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High')),
    description TEXT NOT NULL,
    image_url TEXT,
    suggested_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected')),
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 6. Status History Table (Audit Trail)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_id UUID NOT NULL REFERENCES public.hazards(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    note TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 7. Automated Updated_at Trigger for Hazards
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_hazards_updated_at ON public.hazards;
CREATE TRIGGER set_hazards_updated_at
    BEFORE UPDATE ON public.hazards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------------------
-- 8. Automated Profile Creation on User Signup Trigger
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Community Citizen'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 9. Row Level Security (RLS) Configuration
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_department_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Departments Policies
CREATE POLICY "Anyone can view departments"
ON public.departments FOR SELECT USING (true);

CREATE POLICY "Only admin can modify departments"
ON public.departments FOR ALL USING (public.is_admin());

-- Area Department Mapping Policies
CREATE POLICY "Anyone can view mappings"
ON public.area_department_mapping FOR SELECT USING (true);

CREATE POLICY "Only admin can modify mappings"
ON public.area_department_mapping FOR ALL USING (public.is_admin());

-- Hazards Policies
CREATE POLICY "Anyone can view hazard reports"
ON public.hazards FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit hazards"
ON public.hazards FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own reports if still Reported"
ON public.hazards FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'Reported') OR public.is_admin()
);

CREATE POLICY "Users can delete own reports if still Reported"
ON public.hazards FOR DELETE USING (
    (auth.uid() = user_id AND status = 'Reported') OR public.is_admin()
);

-- Status History Policies
CREATE POLICY "Anyone can view status history"
ON public.status_history FOR SELECT USING (true);

CREATE POLICY "Authenticated users and admins can record status history"
ON public.status_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- --------------------------------------------------------------------
-- 10. Pre-seed Default Prototype Data
-- --------------------------------------------------------------------

-- Insert Prototype Departments
INSERT INTO public.departments (id, department_name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'DNCC / DSCC Road & Infrastructure Department', 'Responsible for roads, potholes, asphalt repairs, pavement collapses, and sidewalks across Dhaka.'),
('22222222-2222-2222-2222-222222222222', 'Dhaka WASA & Drainage Authority', 'Manages storm canals, open sewer manholes, roadside flooding, and waterlogging.'),
('33333333-3333-3333-3333-333333333333', 'DMP Traffic Division & Road Safety', 'Maintains traffic signals, intersection road signs, lane markings, and traffic safety barricades.'),
('44444444-4444-4444-4444-444444444444', 'DESCO / DPDC Street Lighting & Electricity', 'Handles damaged street lamps, dark road stretches, and exposed electrical street wires.'),
('55555555-5555-5555-5555-555555555555', 'City Corporation Emergency Obstacle Removal', 'Handles fallen trees, large storm debris, and road obstructions.')
ON CONFLICT (department_name) DO NOTHING;

-- Insert Predefined Area-Department Mappings
INSERT INTO public.area_department_mapping (area, hazard_type, department_id) VALUES
-- Mirpur (DNCC)
('Mirpur (DNCC)', 'Broken Road / Pothole', '11111111-1111-1111-1111-111111111111'),
('Mirpur (DNCC)', 'Open Manhole', '22222222-2222-2222-2222-222222222222'),
('Mirpur (DNCC)', 'Waterlogging', '22222222-2222-2222-2222-222222222222'),
('Mirpur (DNCC)', 'Broken Traffic Signal', '33333333-3333-3333-3333-333333333333'),
('Mirpur (DNCC)', 'Damaged Street Light', '44444444-4444-4444-4444-444444444444'),
('Mirpur (DNCC)', 'Fallen Tree / Obstacle', '55555555-5555-5555-5555-555555555555'),

-- Dhanmondi (DSCC)
('Dhanmondi (DSCC)', 'Broken Road / Pothole', '11111111-1111-1111-1111-111111111111'),
('Dhanmondi (DSCC)', 'Open Manhole', '22222222-2222-2222-2222-222222222222'),
('Dhanmondi (DSCC)', 'Waterlogging', '22222222-2222-2222-2222-222222222222'),
('Dhanmondi (DSCC)', 'Broken Traffic Signal', '33333333-3333-3333-3333-333333333333'),
('Dhanmondi (DSCC)', 'Damaged Street Light', '44444444-4444-4444-4444-444444444444'),

-- Uttara (DNCC)
('Uttara (DNCC)', 'Broken Road / Pothole', '11111111-1111-1111-1111-111111111111'),
('Uttara (DNCC)', 'Open Manhole', '22222222-2222-2222-2222-222222222222'),
('Uttara (DNCC)', 'Waterlogging', '22222222-2222-2222-2222-222222222222'),
('Uttara (DNCC)', 'Broken Traffic Signal', '33333333-3333-3333-3333-333333333333'),
('Uttara (DNCC)', 'Damaged Street Light', '44444444-4444-4444-4444-444444444444'),

-- Old Dhaka (DSCC)
('Old Dhaka (DSCC)', 'Broken Road / Pothole', '11111111-1111-1111-1111-111111111111'),
('Old Dhaka (DSCC)', 'Open Manhole', '22222222-2222-2222-2222-222222222222'),
('Old Dhaka (DSCC)', 'Waterlogging', '22222222-2222-2222-2222-222222222222'),
('Old Dhaka (DSCC)', 'Broken Traffic Signal', '33333333-3333-3333-3333-333333333333'),
('Old Dhaka (DSCC)', 'Damaged Street Light', '44444444-4444-4444-4444-444444444444'),

-- Mohammadpur (DNCC)
('Mohammadpur (DNCC)', 'Broken Road / Pothole', '11111111-1111-1111-1111-111111111111'),
('Mohammadpur (DNCC)', 'Open Manhole', '22222222-2222-2222-2222-222222222222'),
('Mohammadpur (DNCC)', 'Waterlogging', '22222222-2222-2222-2222-222222222222'),

-- Gulshan & Banani (DNCC)
('Gulshan & Banani (DNCC)', 'Broken Road / Pothole', '11111111-1111-1111-1111-111111111111'),
('Gulshan & Banani (DNCC)', 'Broken Traffic Signal', '33333333-3333-3333-3333-333333333333'),

-- Motijheel (DSCC)
('Motijheel (DSCC)', 'Broken Road / Pothole', '11111111-1111-1111-1111-111111111111'),
('Motijheel (DSCC)', 'Waterlogging', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (area, hazard_type) DO NOTHING;

-- --------------------------------------------------------------------
-- 11. Storage Bucket Configuration for Hazard Images
-- Note: Create a public bucket named 'hazard-images' in Supabase Storage.
-- Policy:
-- INSERT: (bucket_id = 'hazard-images' AND auth.role() = 'authenticated')
-- SELECT: (bucket_id = 'hazard-images')
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hazard-images', 'hazard-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Hazard Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hazard-images');

CREATE POLICY "Authenticated Upload Hazard Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hazard-images' AND auth.role() = 'authenticated');
