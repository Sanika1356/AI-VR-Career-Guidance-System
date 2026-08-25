import { migrate } from './migrate.js';
import { safeErrorDetails } from '../utils/safe-error.js';

migrate().catch((error) => {
  console.error(JSON.stringify({
    event: 'database_migration_failed',
    ...safeErrorDetails(error),
  }));
  process.exitCode = 1;
});
