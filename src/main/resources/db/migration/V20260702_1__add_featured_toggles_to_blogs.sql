-- Add new columns to blog_articles for better control and filtering
ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS featured_on_homepage BOOLEAN DEFAULT FALSE;
ALTER TABLE blog_articles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
