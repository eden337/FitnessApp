import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

describe('GET /health', () => {
  it('responds with status ok and the configured environment', async () => {
    const env = loadEnv({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
    const app = await buildApp({ env });

    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      status: 'ok',
      service: 'fitnessapp-server',
      env: 'test',
    });

    await app.close();
  });
});
