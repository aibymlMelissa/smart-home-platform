import { DatabaseService } from '../services/database.service';
import logger from '../utils/logger';

async function seed() {
  try {
    await DatabaseService.initialize();
    logger.info('Database seeding completed');
    await DatabaseService.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

export { seed };
