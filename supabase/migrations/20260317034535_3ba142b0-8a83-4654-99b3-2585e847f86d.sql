
INSERT INTO storage.buckets (id, name, public) VALUES ('senior-photos', 'senior-photos', true);

CREATE POLICY "Authenticated users can upload senior photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'senior-photos');

CREATE POLICY "Authenticated users can update senior photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'senior-photos');

CREATE POLICY "Anyone can view senior photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'senior-photos');

CREATE POLICY "Authenticated users can delete senior photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'senior-photos');
