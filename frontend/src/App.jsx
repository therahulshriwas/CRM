// frontend/src/App.jsx
// Application root. Bootstraps authentication on mount and defines the full route tree.
// Pages are lazy-loaded (React.lazy + Suspense) to keep the initial bundle light.
// Used in: main.jsx.

import React, { useEffect, Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/common/LoadingScreen';

// Lazy-loaded route pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadDetail = lazy(() => import('./pages/LeadDetail'));
const Deals = lazy(() => import('./pages/Deals'));
const Customers = lazy(() => import('./pages/Customers'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Employees = lazy(() => import('./pages/Employees'));
const Chat = lazy(() => import('./pages/Chat'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Projects = lazy(() => import('./pages/Projects'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AIWorkspace = lazy(() => import('./pages/AIWorkspace'));
const Search = lazy(() => import('./pages/Search'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Help = lazy(() => import('./pages/Help'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Suspense fallback shared by every lazy route
const withLoader = (Component) => (
  <Suspense fallback={<LoadingScreen label="Loading module..." />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: withLoader(Landing),
  },
  {
    path: '/login',
    element: withLoader(Login),
  },
  {
    path: '/register',
    element: withLoader(Register),
  },
  {
    path: '/forgot-password',
    element: withLoader(ForgotPassword),
  },
  {
    path: '/reset-password',
    element: withLoader(ResetPassword),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
         children: [
          { index: true, element: withLoader(Dashboard) },
          { path: 'leads', element: withLoader(Leads) },
          { path: 'leads/:id', element: withLoader(LeadDetail) },
          { path: 'deals', element: withLoader(Deals) },
          { path: 'customers', element: withLoader(Customers) },
          { path: 'calendar', element: withLoader(Calendar) },
          { path: 'tasks', element: withLoader(Tasks) },
          { path: 'projects', element: withLoader(Projects) },
          { path: 'chat', element: withLoader(Chat) },
          { path: 'invoices', element: withLoader(Invoices) },
          { path: 'employees', element: withLoader(Employees) },
          { path: 'reports', element: withLoader(Reports) },
          { path: 'analytics', element: withLoader(Analytics) },
          { path: 'ai-workspace', element: withLoader(AIWorkspace) },
          { path: 'search', element: withLoader(Search) },
          { path: 'notifications', element: withLoader(Notifications) },
          { path: 'profile', element: withLoader(Profile) },
          { path: 'settings', element: withLoader(Settings) },
           { path: 'help', element: withLoader(Help) },
          { path: 'admin', element: withLoader(Admin) },
          { path: '*', element: <Navigate to="/app" replace /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: withLoader(NotFound),
  },
]);

// Verifies the persisted session on app mount before rendering the router.
function AppBootstrap() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <RouterProvider router={router} />;
}

function App() {
  return <AppBootstrap />;
}

export default App;
