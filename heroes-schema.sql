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

-- Add a check constraint to validate the skills JSONB structure
CREATE OR REPLACE FUNCTION validate_skills_structure()
RETURNS TRIGGER AS $$
DECLARE
    skill JSONB;
BEGIN
    -- Skip validation if skills is null
    IF NEW.skills IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if skills is an array
    IF jsonb_typeof(NEW.skills) != 'array' THEN
        RAISE EXCEPTION 'Skills must be an array';
    END IF;

    -- Validate each skill in the array
    FOR skill IN SELECT * FROM jsonb_array_elements(NEW.skills)
    LOOP
        -- Check required fields
        IF NOT (
            skill ? 'id' AND
            skill ? 'name' AND
            skill ? 'description' AND
            skill ? 'type'
        ) THEN
            RAISE EXCEPTION 'Each skill must have id, name, description, and type fields';
        END IF;

        -- Validate type field
        IF NOT (
            skill->>'type' = 'passive' OR
            skill->>'type' = 'skill 1' OR
            skill->>'type' = 'skill 2' OR
            skill->>'type' = 'skill 3' OR
            skill->>'type' = 'ultimate' OR
            skill->>'type' = 'special skill'
        ) THEN
            RAISE EXCEPTION 'Skill type must be either "passive" or "skill 1" or "skill 2" or "skill 3" or "ultimate" or "special skill"';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_heroes_skills
BEFORE INSERT OR UPDATE ON heroes
FOR EACH ROW
EXECUTE FUNCTION validate_skills_structure();

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

-- Create a junction table for hero-role relationships
CREATE TABLE hero_roles (
    hero_id INTEGER REFERENCES heroes(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (hero_id, role_id)
);

-- Modify the heroes table to remove the role_id column
ALTER TABLE heroes DROP COLUMN role_id;

-- Add constraint to ensure at least one primary role per hero
CREATE OR REPLACE FUNCTION ensure_primary_role()
RETURNS TRIGGER AS $$
DECLARE
    primary_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO primary_count
    FROM hero_roles
    WHERE hero_id = NEW.hero_id AND is_primary = TRUE;

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.is_primary = TRUE THEN
            -- Set all other roles for this hero to non-primary
            UPDATE hero_roles
            SET is_primary = FALSE
            WHERE hero_id = NEW.hero_id AND role_id != NEW.role_id;
        ELSIF primary_count = 0 THEN
            -- Ensure at least one primary role
            NEW.is_primary = TRUE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_hero_primary_role
BEFORE INSERT OR UPDATE ON hero_roles
FOR EACH ROW
EXECUTE FUNCTION ensure_primary_role();

-- Trigger to check maximum 3 roles per hero
CREATE OR REPLACE FUNCTION check_max_roles()
RETURNS TRIGGER AS $$
DECLARE
    role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO role_count
    FROM hero_roles
    WHERE hero_id = NEW.hero_id;

    IF role_count > 3 THEN
        RAISE EXCEPTION 'Heroes cannot have more than 3 roles';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_roles
AFTER INSERT ON hero_roles
FOR EACH ROW
EXECUTE FUNCTION check_max_roles();

-- Enable RLS for hero_roles
ALTER TABLE hero_roles ENABLE ROW LEVEL SECURITY;

-- Policies for hero_roles
CREATE POLICY "Hero roles readable by everyone"
ON hero_roles FOR SELECT
USING (true);

CREATE POLICY "Hero roles modifiable only by authenticated users"
ON hero_roles FOR ALL
USING (auth.role() = 'authenticated');