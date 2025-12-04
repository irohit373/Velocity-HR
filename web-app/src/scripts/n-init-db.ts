import dotenv from 'dotenv';

// Load environment variables before importing db
dotenv.config({ path: '.env.local' });

async function initializeDatabase() {
  // Dynamically import db after environment variables are loaded
  const { sql } = await import('../lib/db.js');
  
  try {
    console.log('🗄️  Initializing database...');

    // Create jobs table
    console.log('Creating jobs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
        job_id SERIAL PRIMARY KEY,
        hr_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_title VARCHAR(255) NOT NULL,
        job_description TEXT NOT NULL,
        required_experience_years INTEGER DEFAULT 0,
        tags TEXT[],
        location VARCHAR(255),
        salary_range VARCHAR(100),
        ai_generated_summary TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expiry_date TIMESTAMP
      )
    `;

    // Create applicants table
    console.log('Creating applicants table...');
    await sql`
      CREATE TABLE IF NOT EXISTS applicants (
        applicant_id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        dob DATE,
        experience_years INTEGER DEFAULT 0,
        detail_box TEXT,
        resume_url TEXT NOT NULL,
        ai_generated_score DECIMAL(5,2),
        ai_generated_summary TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id, email)
      )
    `;

    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_hr_id ON jobs(hr_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applicants_score ON applicants(ai_generated_score)`;

    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Create an HR user account through /signup');
    console.log('2. Login and start posting jobs');
    console.log('3. Make sure your FastAPI backend is running');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run initialization
initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });