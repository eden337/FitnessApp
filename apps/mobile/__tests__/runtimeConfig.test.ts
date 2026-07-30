import { resolvePublicUrl } from '../src/services/runtimeConfig';

describe('runtimeConfig', () => {
  it('uses a configured browser-visible service URL', () => {
    expect(resolvePublicUrl('https://fitness.example/api', 'http://localhost:4000')).toBe(
      'https://fitness.example/api',
    );
  });

  it('uses the local fallback for absent or invalid configuration', () => {
    expect(resolvePublicUrl(undefined, 'http://localhost:4000')).toBe(
      'http://localhost:4000',
    );
    expect(resolvePublicUrl(42, 'http://localhost:4000')).toBe('http://localhost:4000');
  });
});
