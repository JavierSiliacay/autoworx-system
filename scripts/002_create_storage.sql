-- Create storage bucket for damage images
INSERT INTO storage.buckets (id, name, public)
VALUES ('damage-images', 'damage-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to damage-images bucket
CREATE POLICY "Allow public upload to damage-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'damage-images');

-- Allow public read from damage-images bucket
CREATE POLICY "Allow public read from damage-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'damage-images');

-- Allow public delete from damage-images bucket (for admin)
CREATE POLICY "Allow public delete from damage-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'damage-images');
