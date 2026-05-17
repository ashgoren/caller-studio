import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { TitleProvider } from './contexts/TitleContext';
import { UndoProvider, useUndoState } from '@/contexts/UndoContext';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { lazy, Suspense } from 'react';
import { Layout, ThemedShell } from '@/components/layouts/Layout';
import { Spinner } from '@/components/shared';
import { SignInPage } from '@/components/auth/SignInPage';
import { SignUpPage } from '@/components/auth/SignUpPage';
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmProvider } from 'material-ui-confirm';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { logEnvironment } from './lib/utils';
import { SharedDanceView } from './components/Share/SharedDanceView';
import { SharedProgramView } from './components/Share/SharedProgramView';

const Dances             = lazy(() => import('./components/Dances').then(m => ({ default: m.Dances })));
const DancePage          = lazy(() => import('./components/Dances').then(m => ({ default: m.DancePage })));
const Programs           = lazy(() => import('./components/Programs').then(m => ({ default: m.Programs })));
const ProgramPage        = lazy(() => import('./components/Programs').then(m => ({ default: m.ProgramPage })));
const SettingsPage       = lazy(() => import('./components/Settings').then(m => ({ default: m.SettingsPage })));
const ChoreographersList = lazy(() => import('./components/Settings').then(m => ({ default: m.ChoreographersList })));
const KeyMovesList       = lazy(() => import('./components/Settings').then(m => ({ default: m.KeyMovesList })));
const VibesList          = lazy(() => import('./components/Settings').then(m => ({ default: m.VibesList })));

// Prefetch main app module in the background while the user is on the sign-in page
import('./components/Dances');

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
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
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

const ShareShell = () => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <QueryClientProvider client={queryClient}>
      <ThemedShell>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </ThemedShell>
    </QueryClientProvider>
  </LocalizationProvider>
);

const router = createBrowserRouter([
  {
    path: '/share',
    element: <ShareShell />,
    children: [
      { path: 'd/:token', element: <SharedDanceView /> },
      { path: 'p/:token', element: <SharedProgramView /> },
    ],
  },
  {
    element: <AppShell />,
    children: [
      { path: '/signin', element: <SignInPage /> },
      { path: '/signup', element: <SignUpPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
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
