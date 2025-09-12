import { MongooseConnection } from '../src/infrastructure/database/mongooseConnection';
import { MongooseUserRepository } from '../src/auth/repositories';
import { PasswordService } from '../src/auth/services';
import { Permission } from '../src/auth/entities';
import { logger } from '../src/utils/logger';

/**
 * Script to create the initial admin user
 * Run with: npm run seed:admin
 */
async function createAdminUser() {
  try {
    logger.info('Starting admin user creation script...');

    // Connect to database
    const dbConnection = MongooseConnection.getInstance();
    await dbConnection.connect();
    logger.info('Connected to database');

    // Initialize services
    const userRepository = new MongooseUserRepository();
    const passwordService = new PasswordService();

    // Admin user configuration
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blog.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    // Check if admin user already exists
    const existingAdmin = await userRepository.findByEmail(adminEmail);
    if (existingAdmin) {
      logger.warn('Admin user already exists', { email: adminEmail });
      console.log('❌ Admin user already exists with email:', adminEmail);
      process.exit(0);
    }

    // Validate password strength
    if (adminPassword.length < 8) {
      throw new Error('Admin password must be at least 8 characters long');
    }

    // Hash password
    logger.info('Hashing admin password...');
    const hashedPassword = await passwordService.hash(adminPassword);

    // Create admin user
    logger.info('Creating admin user...', { email: adminEmail });
    const adminUser = await userRepository.create({
      email: adminEmail,
      passwordHash: hashedPassword,
      permissions: [Permission.READ_POSTS, Permission.CREATE_POSTS, Permission.ADMIN],
      refreshTokens: []
    });

    logger.info('Admin user created successfully', { 
      userId: adminUser.id, 
      email: adminUser.email,
      permissions: adminUser.permissions 
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Permissions:', adminUser.permissions.join(', '));
    console.log('');
    console.log('You can now login using:');
    console.log(`POST /api/auth/login`);
    console.log(`{`);
    console.log(`  "email": "${adminUser.email}",`);
    console.log(`  "password": "${adminPassword}"`);
    console.log(`}`);

    process.exit(0);

  } catch (error) {
    logger.error('Failed to create admin user', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    console.error('❌ Failed to create admin user:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createAdminUser();
}

export { createAdminUser };