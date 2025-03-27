-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_modtime
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insert predefined roles
INSERT INTO roles (role, description) VALUES
('Fighter', 'Close combat heroes with high durability'),
('Assassin', 'High burst damage, low defense heroes'),
('Mage', 'Magical damage dealers with crowd control'),
('Tank', 'High defense heroes who protect the team'),
('Support', 'Heroes who provide healing and team buffs'),
('Marksman', 'Ranged physical damage dealers');

CREATE TABLE heroes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    tier VARCHAR(1) CHECK (tier IN ('S', 'A', 'B', 'C', 'D')),
    image_url TEXT,
    description TEXT,
    skills JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updating timestamp
CREATE TRIGGER update_heroes_modtime
BEFORE UPDATE ON heroes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    -- Additional metadata
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ
);

-- Trigger for updating timestamp
CREATE TRIGGER update_admins_modtime
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Policies for roles
CREATE POLICY "Roles readable by everyone"
ON roles FOR SELECT
USING (true);

CREATE POLICY "Roles modifiable only by authenticated users"
ON roles FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Roles updatable only by authenticated users"
ON roles FOR UPDATE
USING (auth.role() = 'authenticated');

-- Enable RLS
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;

-- Policies for heroes
CREATE POLICY "Heroes readable by everyone"
ON heroes FOR SELECT
USING (true);

CREATE POLICY "Heroes modifiable only by authenticated users"
ON heroes FOR ALL
USING (auth.role() = 'authenticated');

-- Create indexes to improve query performance
CREATE INDEX idx_heroes_role ON heroes(role_id);
CREATE INDEX idx_heroes_tier ON heroes(tier);
CREATE INDEX idx_admins_email ON admins(email);

-- Enable Row Level Security (RLS) for hero-storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload hero images"
ON storage.objects FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'hero-storage'
);

-- Policy to allow public read access to hero images
CREATE POLICY "Public read access for hero images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'hero-storage'
);

-- Policy to allow authenticated users to update their own uploaded images
CREATE POLICY "Authenticated users can update their hero images"
ON storage.objects FOR UPDATE
USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'hero-storage'
);

-- Policy to allow authenticated users to delete their own uploaded images
CREATE POLICY "Authenticated users can delete their hero images"
ON storage.objects FOR DELETE
USING (
    auth.role() = 'authenticated' AND
    bucket_id = 'hero-storage'
);

-- Ensure file size and type constraints at the database level
ALTER TABLE storage.objects
ADD CONSTRAINT max_file_size
CHECK (
    (metadata->>'size')::integer <= 5 * 1024 * 1024 -- 5MB limit
);

-- Optional: Add a trigger to validate file types
CREATE OR REPLACE FUNCTION validate_hero_image_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.metadata->>'mimetype' NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') THEN
        RAISE EXCEPTION 'Invalid file type';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_hero_image_type
BEFORE INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION validate_hero_image_type();