import React, { createContext, useContext, useMemo } from 'react';
import { RootStore, type RootStoreDeps } from './RootStore';

const StoresContext = createContext<RootStore | null>(null);

export type StoresProviderProps = {
  children: React.ReactNode;
  /** Pre-built RootStore. Tests pass a custom one to inject mocks. */
  store?: RootStore;
  deps?: RootStoreDeps;
};

export const StoresProvider: React.FC<StoresProviderProps> = ({ children, store, deps }) => {
  const value = useMemo(() => store ?? new RootStore(deps!), [store, deps]);
  return <StoresContext.Provider value={value}>{children}</StoresContext.Provider>;
};

export const useStores = (): RootStore => {
  const ctx = useContext(StoresContext);
  if (!ctx) throw new Error('useStores called outside <StoresProvider>');
  return ctx;
};
