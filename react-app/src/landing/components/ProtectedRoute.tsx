import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '../../libs/shared/utils/userApi';

interface ProtectedRouteProps {
  access: string[];
  scope: string;
  appName: string;
}

const ProtectedRoute = (props: ProtectedRouteProps) => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  if (isLoading) {
    return <div>Loading {props.appName}...</div>;
  }

  const isAuthorized =
    user?.roles.some((role) => props.access.includes(role)) ?? false;

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
