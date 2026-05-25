import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

export const sql = neon(databaseUrl);

let migrationRan = false;

// Auto-run schema migrations to ensure table schema coherence
export async function ensureDbCoherence() {
  if (migrationRan) return;
  migrationRan = true;
  
  try {
    // 1. Partners Table
    await sql`
      CREATE TABLE IF NOT EXISTS partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `;
    
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
    `;

    // 2. Schools Table
    await sql`
      CREATE TABLE IF NOT EXISTS schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        branding_logo TEXT,
        color_theme VARCHAR(50) DEFAULT '#2563eb',
        template VARCHAR(50) DEFAULT 'cbse-portrait',
        qr_type VARCHAR(20) DEFAULT 'url',
        lanyard_text VARCHAR(255),
        lanyard_color VARCHAR(50),
        lanyard_text_color VARCHAR(50),
        created_at TIMESTAMP DEFAULT now()
      );
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_schools_partner_lookup ON schools(partner_id, created_at DESC);
    `;

    // 3. Students Table
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        id_number VARCHAR(100) NOT NULL,
        grade VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'STUDENT',
        email VARCHAR(255),
        phone VARCHAR(50),
        blood_group VARCHAR(20),
        issue_date VARCHAR(50),
        expiry_date VARCHAR(50),
        avatar_url TEXT,
        thumbnail_url TEXT,
        signature_url TEXT,
        image_adjustments JSONB DEFAULT '{"zoom": 1, "x": 0, "y": 0, "rotate": 0, "brightness": 100, "contrast": 100}'::jsonb,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_students_school_id_number ON students(school_id, id_number);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_students_school_created ON students(school_id, created_at DESC);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_students_pending ON students(school_id) WHERE status = 'pending';
    `;

    console.log('NeonDB schema and B-Tree indexes are fully coherent!');
  } catch (err) {
    console.error('Failed to ensure database coherence:', err);
    // Reset so it attempts migration on the next call if this failed
    migrationRan = false;
  }
}
