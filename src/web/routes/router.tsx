import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { OverviewPage } from '../features/overview/OverviewPage';
import { IssuesPage } from '../features/issues/IssuesPage';
import { HotspotsPage } from '../features/hotspots/HotspotsPage';
import { MeasuresPage } from '../features/measures/MeasuresPage';
import { ReportView } from '../features/report/ReportView';

export const router = createBrowserRouter([
  // Chrome-less print route used by PDF export (Playwright / browser print).
  { path: '/report', element: <ReportView /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'issues', element: <IssuesPage /> },
      { path: 'hotspots', element: <HotspotsPage /> },
      { path: 'measures', element: <MeasuresPage /> },
      { path: '*', element: <Navigate to="/overview" replace /> },
    ],
  },
]);
