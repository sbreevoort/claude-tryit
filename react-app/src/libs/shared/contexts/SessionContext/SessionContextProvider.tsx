import type { ReactNode } from 'react';

interface SessionContextProviderProps {
  children: ReactNode;
}

const SessionContextProvider = ({ children }: SessionContextProviderProps) => {
  return <>{children}</>;
};

export default SessionContextProvider;
