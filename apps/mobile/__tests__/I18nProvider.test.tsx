import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { createI18n, I18nProvider, useTranslation } from '../src/i18n/I18nProvider';

const Probe: React.FC = () => {
  const { t } = useTranslation();
  return <Text testID="probe">{t('common:appName')}</Text>;
};

describe('I18nProvider', () => {
  it('defaults to Hebrew when no locale prop is provided', () => {
    const { getByTestId } = render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(getByTestId('probe').props.children).toBe('כושר לזוגות');
  });

  it('honors an explicit English locale', () => {
    const { getByTestId } = render(
      <I18nProvider locale="en">
        <Probe />
      </I18nProvider>,
    );
    expect(getByTestId('probe').props.children).toBe('Couple Fit');
  });

  it('renders from a supplied i18n instance and follows its language changes', async () => {
    const instance = createI18n('en');
    const { getByTestId } = render(
      <I18nProvider instance={instance}>
        <Probe />
      </I18nProvider>,
    );

    expect(getByTestId('probe').props.children).toBe('Couple Fit');
    await act(async () => {
      await instance.changeLanguage('he');
    });
    expect(getByTestId('probe').props.children).toBe('כושר לזוגות');
  });
});
