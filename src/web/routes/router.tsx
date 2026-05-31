import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { OverviewPage } from '../features/overview/OverviewPage';
import { IssuesPage } from '../features/issues/IssuesPage';
import { HotspotsPage } from '../features/hotspots/HotspotsPage';
import { MeasuresPage } from '../features/measures/MeasuresPage';

export const router = createBrowserRouter([
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
