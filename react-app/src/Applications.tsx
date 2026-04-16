import { lazy } from 'react';
import type { LazyExoticComponent } from 'react';

type PlaceholderComponent = () => JSX.Element;

export interface Application {
  name: string;
  routePath: string;
  accessRoles: string[];
  component: LazyExoticComponent<PlaceholderComponent>;
}

const MKBToolPlaceholder: PlaceholderComponent = () => <div>MKB Tool 2026</div>;
const IntegrationDashboardPlaceholder: PlaceholderComponent = () => (
  <div>Integration Dashboard</div>
);

export const applications: Application[] = [
  {
    name: 'MKB Tool 2026',
    routePath: '/rekentool',
    accessRoles: ['MKBTOOL_ADMIN'],
    component: lazy(() => Promise.resolve({ default: MKBToolPlaceholder })),
  },
  {
    name: 'Integration Dashboard',
    routePath: '/id/transactions',
    accessRoles: ['Integration_Dashboard_Client_Int_Tech_user'],
    component: lazy(() =>
      Promise.resolve({ default: IntegrationDashboardPlaceholder })
    ),
  },
];
