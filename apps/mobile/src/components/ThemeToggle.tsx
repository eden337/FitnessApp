import React from 'react';
import { observer } from 'mobx-react-lite';
import { SegmentedPicker } from './SegmentedPicker';
import { useTranslation } from '../i18n/I18nProvider';
import { useStores } from '../stores/StoresContext';
import type { ThemePreference } from '../theme';

export const ThemeToggle: React.FC = observer(() => {
  const { theme } = useStores();
  const { t } = useTranslation();
  return (
    <SegmentedPicker<ThemePreference>
      testID="theme-toggle"
      label={t('common:theme.label')}
      value={theme.preference}
      onChange={(value) => void theme.setPreference(value)}
      options={[
        { value: 'system', label: t('common:theme.system') },
        { value: 'light', label: t('common:theme.light') },
        { value: 'dark', label: t('common:theme.dark') },
      ]}
    />
  );
});
