import 'dotenv/config';
import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';

const main = async (): Promise<void> => {
  const env = loadEnv();
  const app = await buildApp({ env });

  try {
    await app.listen({ host: env.SERVER_HOST, port: env.SERVER_PORT });
    app.log.info(`FitnessApp server listening on :${env.SERVER_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void main();
