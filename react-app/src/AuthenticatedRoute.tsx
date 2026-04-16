import { Outlet } from 'react-router-dom';
import { useAuth } from './libs/shared/contexts/AuthContext/AuthContext';

const AuthenticatedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Unauthorized</div>;
  }

  return <Outlet />;
};

export default AuthenticatedRoute;
