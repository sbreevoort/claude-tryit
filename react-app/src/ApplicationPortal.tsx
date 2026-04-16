import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import AuthContextProvider from './libs/shared/contexts/AuthContext/AuthContextProvider';
import SessionContextProvider from './libs/shared/contexts/SessionContext/SessionContextProvider';
import GlobalContextProvider from './libs/shared/contexts/GlobalContext/GlobalContextProvider';
import ApplicationPortalRoutes from './ApplicationPortalRoutes';
import { DefaultErrorBoundary } from './libs/shared/components/DefaultErrorBoundary/DefaultErrorBoundary';

const queryClient = new QueryClient();

const ApplicationPortal = () => (
  <ErrorBoundary fallbackRender={(props) => <DefaultErrorBoundary {...props} />}>
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
  </ErrorBoundary>
);

export default ApplicationPortal;
