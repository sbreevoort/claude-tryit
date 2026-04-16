import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthContextProvider from './libs/shared/contexts/AuthContext/AuthContextProvider';
import SessionContextProvider from './libs/shared/contexts/SessionContext/SessionContextProvider';
import GlobalContextProvider from './libs/shared/contexts/GlobalContext/GlobalContextProvider';
import ApplicationPortalRoutes from './ApplicationPortalRoutes';

const queryClient = new QueryClient();

const ApplicationPortal = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <GlobalContextProvider>
        <SessionContextProvider>
          <AuthContextProvider>
            <ApplicationPortalRoutes />
          </AuthContextProvider>
        </SessionContextProvider>
      </GlobalContextProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default ApplicationPortal;
