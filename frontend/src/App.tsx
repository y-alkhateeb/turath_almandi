/**
 * App Component
 * Main application component with routing
 */

import { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from '@/routes';
import { useAppSettings } from '@/hooks/useAppSettings';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { PageLoading } from '@/components/common/PageLoading';

function App() {
  // Initialize app settings (updates document title and favicon)
  useAppSettings();

  return (
    <>
      {/* Offline Banner - Shows when connection is lost */}
      <OfflineBanner />

      {/* App Routes with Suspense for lazy loading */}
      <Suspense fallback={<PageLoading />}>
        {useRoutes(routes)}
      </Suspense>
    </>
  );
}

export default App;
