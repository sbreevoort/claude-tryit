import { Suspense, lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { applications } from './Applications';
import AuthenticatedRoute from './AuthenticatedRoute';
import LandingPage from './landing/pages/LandingPage';
import ProtectedRoute from './landing/components/ProtectedRoute';
import Layout from './libs/shared/components/Layout/Layout';
import Header from './libs/shared/components/Layout/Header';

const UserManagementPage = lazy(() => import('./settings/UserManagementPage'));

const RootLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
    <Header />
    <Outlet />
  </div>
);

const ApplicationPortalRoutes = () => (
  <Routes>
    <Route element={<RootLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/settings"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <UserManagementPage />
          </Suspense>
        }
      />
      <Route element={<AuthenticatedRoute />}>
        {applications.map((app) => {
          const AppComponent = app.component;
          return (
            <Route
              key={app.routePath}
              element={
                <ProtectedRoute
                  access={app.accessRoles}
                  scope={app.routePath}
                  appName={app.name}
                />
              }
            >
              <Route
                path={app.routePath}
                element={
                  <Suspense fallback={<div>Loading {app.name}...</div>}>
                    <Layout>
                      <AppComponent
                        name={app.name}
                        routePath={app.routePath}
                        accessRoles={app.accessRoles}
                        avatar={app.avatar}
                      />
                    </Layout>
                  </Suspense>
                }
              />
            </Route>
          );
        })}
      </Route>
    </Route>
  </Routes>
);

export default ApplicationPortalRoutes;
