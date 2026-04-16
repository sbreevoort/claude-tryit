import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import { applications } from './Applications';
import AuthenticatedRoute from './AuthenticatedRoute';
import LandingPage from './landing/pages/LandingPage';

const ProtectedRoute = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

const ApplicationPortalRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route element={<AuthenticatedRoute />}>
      {applications.map((app) => {
        const AppComponent = app.component;
        return (
          <Route
            key={app.routePath}
            path={app.routePath}
            element={
              <Suspense fallback={<div>Loading {app.name}...</div>}>
                <ProtectedRoute>
                  <AppComponent />
                </ProtectedRoute>
              </Suspense>
            }
          />
        );
      })}
    </Route>
  </Routes>
);

export default ApplicationPortalRoutes;
