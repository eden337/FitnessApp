import type { AxiosInstance } from 'axios';
import { AuthStore } from '../src/stores/AuthStore';
import { ProfileStore } from '../src/stores/ProfileStore';
import { createInMemoryStorage } from '../src/services/secureStorage';

const buildApi = () => {
  const get = jest.fn();
  const put = jest.fn();
  const patch = jest.fn();
  const post = jest.fn();
  const api = { get, put, patch, post } as unknown as AxiosInstance;
  return { api, get, put, patch, post };
};

const sampleProfile = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'a@b.io',
  displayName: 'Jane',
  locale: 'he' as const,
  gender: 'female' as const,
  birthDate: '1990-04-15',
  heightCm: 165,
};

const sampleMetrics = {
  currentWeightKg: 65,
  activityLevel: 'moderate' as const,
  goalType: 'lose' as const,
  goalWeightKg: 60,
  dietaryRestrictions: {},
};

const sampleDerived = { ageYears: 35, bmrKcal: 1370.3, tdeeKcal: 2124, targetKcal: 1624 };

describe('ProfileStore', () => {
  const buildStores = () => {
    const apiBundle = buildApi();
    const auth = new AuthStore({ api: apiBundle.api, storage: createInMemoryStorage() });
    const profile = new ProfileStore({ api: apiBundle.api, authStore: auth });
    return { ...apiBundle, auth, profile };
  };

  it('fetches: populates profile/metrics/derived and forwards the user to AuthStore', async () => {
    const { profile, auth, get } = buildStores();
    get.mockResolvedValueOnce({
      data: { profile: sampleProfile, metrics: sampleMetrics, derived: sampleDerived },
    });
    await profile.fetch();
    expect(profile.status).toBe('ready');
    expect(profile.profile).toEqual(sampleProfile);
    expect(profile.metrics).toEqual(sampleMetrics);
    expect(profile.derived).toEqual(sampleDerived);
    expect(profile.isMetricsInitialized).toBe(true);
    expect(auth.user).toEqual(sampleProfile);
  });

  it('fetch: surfaces server error to errorMessage', async () => {
    const { profile, get } = buildStores();
    get.mockRejectedValueOnce({ response: { data: { error: { code: 'unauthenticated' } } } });
    await profile.fetch();
    expect(profile.status).toBe('error');
    expect(profile.errorMessage).toBe('unauthenticated');
  });

  it('isMetricsInitialized is false until metrics arrive', async () => {
    const { profile, get } = buildStores();
    get.mockResolvedValueOnce({
      data: { profile: sampleProfile, metrics: null, derived: null },
    });
    await profile.fetch();
    expect(profile.isMetricsInitialized).toBe(false);
  });

  it('setupMetrics PUTs and applies the result on success', async () => {
    const { profile, put } = buildStores();
    put.mockResolvedValueOnce({
      data: { profile: sampleProfile, metrics: sampleMetrics, derived: sampleDerived },
    });
    const ok = await profile.setupMetrics({
      gender: 'female',
      birthDate: '1990-04-15',
      heightCm: 165,
      currentWeightKg: 65,
      activityLevel: 'moderate',
      goalType: 'lose',
      goalWeightKg: 60,
      dietaryRestrictions: {},
    });
    expect(ok).toBe(true);
    expect(profile.metrics).toEqual(sampleMetrics);
    expect(put).toHaveBeenCalledWith('/api/v1/users/me/metrics', expect.any(Object));
  });

  it('setupMetrics returns false on failure and stores the error', async () => {
    const { profile, put } = buildStores();
    put.mockRejectedValueOnce({ response: { data: { error: { code: 'invalid_body' } } } });
    const ok = await profile.setupMetrics({
      gender: 'female',
      birthDate: '1990-04-15',
      heightCm: 165,
      currentWeightKg: 65,
      activityLevel: 'moderate',
      goalType: 'lose',
      goalWeightKg: 60,
      dietaryRestrictions: {},
    });
    expect(ok).toBe(false);
    expect(profile.errorMessage).toBe('invalid_body');
  });

  it('updateProfile PATCHes and applies the result', async () => {
    const { profile, patch } = buildStores();
    patch.mockResolvedValueOnce({
      data: { profile: { ...sampleProfile, displayName: 'New' }, metrics: null, derived: null },
    });
    const ok = await profile.updateProfile({ displayName: 'New' });
    expect(ok).toBe(true);
    expect(profile.profile?.displayName).toBe('New');
  });

  it('updateProfile: PATCH error path', async () => {
    const { profile, patch } = buildStores();
    patch.mockRejectedValueOnce(new Error('network'));
    const ok = await profile.updateProfile({ displayName: 'New' });
    expect(ok).toBe(false);
    expect(profile.errorMessage).toBe('request failed');
  });

  it('updateMetrics PATCHes through the same code path', async () => {
    const { profile, patch } = buildStores();
    patch.mockResolvedValueOnce({
      data: {
        profile: sampleProfile,
        metrics: { ...sampleMetrics, currentWeightKg: 64 },
        derived: sampleDerived,
      },
    });
    const ok = await profile.updateMetrics({ currentWeightKg: 64 });
    expect(ok).toBe(true);
    expect(profile.metrics?.currentWeightKg).toBe(64);
  });

  it('updateMetrics: error path uses fallback message when server returns nothing', async () => {
    const { profile, patch } = buildStores();
    patch.mockRejectedValueOnce({});
    const ok = await profile.updateMetrics({ currentWeightKg: 64 });
    expect(ok).toBe(false);
    expect(profile.errorMessage).toBe('request failed');
  });

  it('reset clears all state', async () => {
    const { profile, get } = buildStores();
    get.mockResolvedValueOnce({
      data: { profile: sampleProfile, metrics: sampleMetrics, derived: sampleDerived },
    });
    await profile.fetch();
    profile.reset();
    expect(profile.profile).toBeNull();
    expect(profile.metrics).toBeNull();
    expect(profile.derived).toBeNull();
    expect(profile.status).toBe('idle');
  });
});
