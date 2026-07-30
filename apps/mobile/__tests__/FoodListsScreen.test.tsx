import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { FoodList } from '@fitnessapp/shared';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { createInMemoryStorage } from '../src/services/secureStorage';
import { FoodListsScreen } from '../src/screens/program/FoodListsScreen';
import { RootStore } from '../src/stores/RootStore';
import { StoresProvider } from '../src/stores/StoresContext';

const list = (slug: string, weekNumber: number | null): FoodList => ({
  id: `00000000-0000-4000-8000-${weekNumber === null ? '000000000001' : '000000000002'}`,
  slug,
  name: { he: slug, en: slug },
  description: null,
  weekNumber,
  items: [
    {
      id: '00000000-0000-4000-8000-000000000003',
      ordinal: 0,
      visualKey: 'apple',
      name: { he: 'פריט', en: 'Item' },
      portion: { he: '1', en: '1 serving' },
      notes: null,
    },
  ],
});

describe('FoodListsScreen', () => {
  it('filters global and current-week references', () => {
    const store = new RootStore({
      baseURL: 'http://x',
      storage: createInMemoryStorage(),
      setI18nLanguage: jest.fn(),
      setRtl: jest.fn(),
      initialLocale: 'en',
      api: {} as never,
    });
    store.program.lists = [list('Global foods', null), list('Week foods', 3)];
    const { getByText, getByTestId, queryByText } = render(
      <StoresProvider store={store}>
        <I18nProvider locale="en">
          <FoodListsScreen />
        </I18nProvider>
      </StoresProvider>,
    );

    expect(getByText('Global foods')).toBeTruthy();
    expect(getByTestId('food-guide-summary')).toBeTruthy();
    expect(getByTestId('food-visual-apple')).toBeTruthy();
    expect(queryByText('Week foods')).toBeNull();

    fireEvent.press(getByTestId('program-list-filter-current'));
    expect(getByText('Week foods')).toBeTruthy();
    expect(queryByText('Global foods')).toBeNull();
  });
});
