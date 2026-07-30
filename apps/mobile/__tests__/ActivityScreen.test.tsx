import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { AxiosInstance } from 'axios';
import type { SharedActivity } from '@fitnessapp/shared';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { ActivityScreen } from '../src/screens/activity/ActivityScreen';
import { createInMemoryStorage } from '../src/services/secureStorage';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';

const activity: SharedActivity = {
  id: '00000000-0000-4000-8000-000000000001',
  coupleId: '00000000-0000-4000-8000-000000000002',
  actor: {
    userId: '00000000-0000-4000-8000-000000000003',
    displayName: 'Alex',
  },
  kind: 'hydration',
  note: 'Morning glasses done',
  createdAt: '2026-07-30T09:00:00.000Z',
};

const buildStore = () => {
  const post = jest.fn().mockResolvedValue({
    data: { ...activity, kind: 'vegetables', note: 'Colorful dinner' },
  });
  const api = { post } as unknown as AxiosInstance;
  return {
    post,
    store: new RootStore({
      baseURL: 'http://x',
      storage: createInMemoryStorage(),
      setI18nLanguage: jest.fn(),
      setRtl: jest.fn(),
      initialLocale: 'en',
      api,
    }),
  };
};

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a loading state before an empty feed is resolved', () => {
    const { store } = buildStore();
    store.activity.status = 'loading';
    const { getByTestId, getByText, queryByText } = render(
      <StoresProvider store={store}>
        <I18nProvider locale="en">
          <ActivityScreen onBack={jest.fn()} />
        </I18nProvider>
      </StoresProvider>,
    );

    expect(getByTestId('activity-loading')).toBeTruthy();
    expect(getByText('Loading shared wins…')).toBeTruthy();
    expect(queryByText('Your shared wins will appear here.')).toBeNull();
  });

  it('shows the privacy promise and existing partner wins', () => {
    const { store } = buildStore();
    store.activity.activities = [activity];
    store.activity.status = 'ready';
    const { getByText } = render(
      <StoresProvider store={store}>
        <I18nProvider locale="en">
          <ActivityScreen onBack={jest.fn()} />
        </I18nProvider>
      </StoresProvider>,
    );

    expect(
      getByText(
        'Celebrate healthy actions together. Body measurements always stay private.',
      ),
    ).toBeTruthy();
    expect(getByText('Alex')).toBeTruthy();
    expect(getByText('Morning glasses done')).toBeTruthy();
  });

  it('shares a selected safe win with an optional note', async () => {
    const { store, post } = buildStore();
    const { getByTestId, getByText } = render(
      <StoresProvider store={store}>
        <I18nProvider locale="en">
          <ActivityScreen onBack={jest.fn()} />
        </I18nProvider>
      </StoresProvider>,
    );

    fireEvent.press(getByTestId('activity-kind-vegetables'));
    fireEvent.changeText(getByTestId('activity-note'), '  Colorful dinner  ');
    fireEvent.press(getByTestId('activity-share'));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/v1/progress/activities', {
        kind: 'vegetables',
        note: 'Colorful dinner',
      }),
    );
    expect(getByText('Shared! One more win for your team.')).toBeTruthy();
  });
});
