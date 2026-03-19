import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { TitleProvider } from './contexts/TitleContext';
import { UndoProvider, useUndoState } from '@/contexts/UndoContext';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { Layout } from './components/layouts/Layout';
import { Dances, DancePage } from './components/Dances';
import { Programs, ProgramPage } from './components/Programs';
import { SettingsPage, ChoreographersList, KeyMovesList, VibesList } from './components/Settings';
import { Spinner } from '@/components/shared';
import { SignInPage } from '@/components/auth/SignInPage';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmProvider } from 'material-ui-confirm';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { logEnvironment } from './lib/utils';

const ProtectedRoute = () => {
  const { user, authLoading } = useAuth();
  if (authLoading) return <Spinner />;
  if (!user) return <Navigate to='/signin' />;
  return <Outlet />;
};

const AppInner = () => {
  const { user } = useAuth();
  const { isExecuting } = useUndoState();
  useRealtimeSync(user, isExecuting);

  return (
    <TitleProvider>
      <ConfirmProvider>
        <Layout>
          <Outlet />
        </Layout>
      </ConfirmProvider>
    </TitleProvider>
  );
};

const AppShell = () => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <QueryClientProvider client={queryClient}>
      <UndoProvider>
        <AppInner />
      </UndoProvider>
    </QueryClientProvider>
  </LocalizationProvider>
);

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/signin', element: <SignInPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <Navigate to='/dances' /> },
          { path: '/dances', element: <Dances /> },
          { path: '/dances/:id', element: <DancePage /> },
          { path: '/programs', element: <Programs /> },
          { path: '/programs/:id', element: <ProgramPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/settings/choreographers', element: <ChoreographersList /> },
          { path: '/settings/key-moves', element: <KeyMovesList /> },
          { path: '/settings/vibes', element: <VibesList /> },
        ],
      },
    ],
  },
]);

function App() {
  logEnvironment();
  return <RouterProvider router={router} />;
}

export default App;
