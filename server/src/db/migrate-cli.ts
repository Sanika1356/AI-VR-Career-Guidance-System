import { migrate } from './migrate.js';

migrate().catch((error) => {
  console.error('Database migration failed', error);
  process.exitCode = 1;
});
