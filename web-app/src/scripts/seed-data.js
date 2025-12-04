import dotenv from 'dotenv';

// Load environment variables before importing db
dotenv.config({ path: '.env.local' });
import { hashPassword } from '../lib/auth';

async function seedData() {
  try {
    const { sql } = await import('../lib/db.js');
    console.log('🌱 Seeding database...');

    // Create test HR user
    const hashedPassword = await hashPassword('password123');
    const hrResult = await sql`
      INSERT INTO hrs (email, password, name)
      VALUES ('hr@example.com', ${hashedPassword}, 'HR Manager')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    if (hrResult.length === 0) {
      console.log('HR user already exists');
      const existingHR = await sql`SELECT id FROM hrs WHERE email = 'hr@example.com'`;
      const hrId = existingHR[0].id;
      console.log(`Using existing HR user with ID: ${hrId}`);
    } else {
      const hrId = hrResult[0].id;
      console.log(`✅ Created HR user (ID: ${hrId})`);
      console.log('   Email: hr@example.com');
      console.log('   Password: password123');

      // Create sample jobs
      const jobsData = [
        {
          title: 'Senior Full Stack Developer',
          description: 'We are looking for an experienced Full Stack Developer to join our team. You will work on cutting-edge web applications using modern technologies.',
          experience: 5,
          tags: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
          location: 'Remote',
          salary: '$120,000 - $160,000',
        },
        {
          title: 'Frontend Developer',
          description: 'Join our frontend team to build beautiful, responsive user interfaces. Experience with React and modern CSS is required.',
          experience: 3,
          tags: ['React', 'TypeScript', 'Tailwind CSS'],
          location: 'New York, NY',
          salary: '$90,000 - $120,000',
        },
        {
          title: 'DevOps Engineer',
          description: 'We need a DevOps engineer to manage our cloud infrastructure, CI/CD pipelines, and ensure system reliability.',
          experience: 4,
          tags: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
          location: 'Hybrid',
          salary: '$110,000 - $140,000',
        },
      ];

      for (const job of jobsData) {
        await sql`
          INSERT INTO jobs (
            hr_id, job_title, job_description, required_experience_years,
            tags, location, salary_range, is_active
          )
          VALUES (
            ${hrId}, ${job.title}, ${job.description}, ${job.experience},
            ${job.tags}, ${job.location}, ${job.salary}, true
          )
        `;
        console.log(`✅ Created job: ${job.title}`);
      }
    }

    console.log('');
    console.log('✅ Seeding completed!');
    console.log('');
    console.log('You can now:');
    console.log('1. Login as HR: hr@example.com / password123');
    console.log('2. View jobs at /jobs');
    console.log('3. Manage jobs at /dashboard/recruitment');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });