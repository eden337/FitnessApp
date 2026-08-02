import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/StoresContext';
import { lightTheme, resolveTheme, type AppTheme } from './index';

const ThemeContext = createContext<AppTheme | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = observer(
  ({ children }) => {
    const { theme } = useStores();
    const systemMode = useColorScheme();
    const value = useMemo(
      () => resolveTheme(theme.preference, systemMode),
      [theme.preference, systemMode],
    );
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  },
);

export const useTheme = (): AppTheme => {
  const theme = useContext(ThemeContext);
  return theme ?? lightTheme;
};
