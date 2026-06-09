import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { analytics } from '@/lib/analytics';
import { router } from './routes';

export function App() {
  useEffect(() => {
    analytics.pageView('page_view', { path: router.state.location.pathname });
    return router.subscribe(state => {
      analytics.pageView('page_view', { path: state.location.pathname });
    });
  }, []);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
