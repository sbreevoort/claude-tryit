import type { ReactNode } from 'react';

interface GlobalContextProviderProps {
  children: ReactNode;
}

const GlobalContextProvider = ({ children }: GlobalContextProviderProps) => {
  return <>{children}</>;
};

export default GlobalContextProvider;
