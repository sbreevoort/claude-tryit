import { createContext, useContext } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: true,
  loading: false,
});

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
