import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { I18nProvider, useTranslation } from '../src/i18n/I18nProvider';

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
});
