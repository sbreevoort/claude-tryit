import { lazy } from 'react';
import type { LazyExoticComponent } from 'react';

export interface AppComponentProps {
  name: string;
  routePath: string;
  accessRoles: string[];
  avatar?: string;
}

type AppComponent = (props: AppComponentProps) => JSX.Element;

export interface Application {
  name: string;
  routePath: string;
  accessRoles: string[];
  avatar?: string;
  component: LazyExoticComponent<AppComponent>;
}

export const applications: Application[] = [
  {
    name: 'MKB Tool 2026',
    routePath: '/rekentool',
    accessRoles: ['MKBTOOL_ADMIN'],
    component: lazy(() =>
      import('./apps/rekentool').then((m) => ({ default: m.RekentoolApp }))
    ),
  },
  {
    name: 'Integration Dashboard',
    routePath: '/id/transactions',
    accessRoles: ['Integration_Dashboard_Client_Int_Tech_user'],
    component: lazy(() =>
      import('./apps/imon').then((m) => ({ default: m.IntegrationMonitorApp }))
    ),
  },
  {
    name: 'My Vitality',
    avatar: 'VIT',
    routePath: '/vitality',
    accessRoles: ['VITALITY_USER'],
    component: lazy(() =>
      import('./apps/vitality').then((m) => ({ default: m.VitalityApp }))
    ),
  },
  {
    name: 'AI Tester',
    avatar: 'AI',
    routePath: '/ai-test',
    accessRoles: ['AI_TESTER'],
    component: lazy(() =>
      import('./apps/aitester').then((m) => ({ default: m.AITesterApp }))
    ),
  },
];
