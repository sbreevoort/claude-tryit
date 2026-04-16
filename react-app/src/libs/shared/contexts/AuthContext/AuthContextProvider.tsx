import type { ReactNode } from 'react';
import AuthContext from './AuthContext';

interface AuthContextProviderProps {
  children: ReactNode;
}

const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  return (
    <AuthContext.Provider value={{ isAuthenticated: true, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
