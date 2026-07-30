import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repositoryRoot = resolve(process.cwd(), '../..');

describe('container stack', () => {
  it('defines the complete ordered application stack', async () => {
    const compose = await readFile(resolve(repositoryRoot, 'docker-compose.yml'), 'utf8');

    expect(compose).toContain('postgres:');
    expect(compose).toContain('migrate:');
    expect(compose).toContain('seed:');
    expect(compose).toContain('api:');
    expect(compose).toContain('web:');
    expect(compose).toContain('condition: service_completed_successfully');
    expect(compose).toContain('condition: service_healthy');
  });

  it('builds runnable server and web image targets', async () => {
    const dockerfile = await readFile(resolve(repositoryRoot, 'Dockerfile'), 'utf8');

    expect(dockerfile).toContain('AS server');
    expect(dockerfile).toContain('CMD ["node", "dist/src/server.js"]');
    expect(dockerfile).toContain('AS web');
    expect(dockerfile).toContain('expo export --platform web');
  });
});
