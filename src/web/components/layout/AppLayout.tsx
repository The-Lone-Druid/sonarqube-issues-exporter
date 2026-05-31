import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ConnectionError } from '../shared/states';
import { useConfig, useSystemStatus } from '../../hooks/use-queries';
import { Loading } from '../shared/states';

export function AppLayout() {
  const config = useConfig();
  const status = useSystemStatus();

  if (config.isLoading) {
    return <Loading label="Connecting…" />;
  }

  if (status.isError) {
    return (
      <ConnectionError
        message={(status.error as Error)?.message ?? 'The local server could not reach SonarQube.'}
        onRetry={() => status.refetch()}
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
