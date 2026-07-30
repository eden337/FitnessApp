import React, { useMemo } from 'react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next, useTranslation as useI18nextTranslation } from 'react-i18next';
import { namespaces, resources, supportedLocales, type Locale } from './resources';

/**
 * Build a fresh i18next instance. Factored out so tests can construct isolated
 * instances and toggle locale without leaking state between specs.
 */
export const createI18n = (locale: Locale = 'he'): typeof i18n => {
  const instance = i18n.createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'he',
    supportedLngs: [...supportedLocales],
    defaultNS: 'common',
    ns: [...namespaces],
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
};

export type I18nProviderProps = {
  children: React.ReactNode;
  locale?: Locale;
  instance?: typeof i18n;
};

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  locale = 'he',
  instance,
}) => {
  const createdInstance = useMemo(() => createI18n(locale), [locale]);
  return <I18nextProvider i18n={instance ?? createdInstance}>{children}</I18nextProvider>;
};

export const useTranslation = useI18nextTranslation;
