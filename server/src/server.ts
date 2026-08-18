import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.info(`career-guidance-api listening on http://localhost:${env.port}`);
});

function shutdown(signal: string): void {
  console.info(`${signal} received; shutting down gracefully`);
  server.close((error) => {
    if (error) {
      console.error('Server shutdown failed', error);
      process.exitCode = 1;
    }
    process.exit();
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
