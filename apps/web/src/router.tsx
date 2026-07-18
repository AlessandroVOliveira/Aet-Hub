import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { HomePage } from '@/pages/HomePage';
import { TournamentsPage } from '@/pages/TournamentsPage';
import { TournamentDetailPage } from '@/pages/TournamentDetailPage';
import { AdminTournamentsPage } from '@/pages/AdminTournamentsPage';
import { AdminTournamentFormPage } from '@/pages/AdminTournamentFormPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/torneios', element: <TournamentsPage /> },
          { path: '/torneios/:id', element: <TournamentDetailPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin/torneios', element: <AdminTournamentsPage /> },
              { path: '/admin/torneios/novo', element: <AdminTournamentFormPage /> },
              { path: '/admin/torneios/:id/editar', element: <AdminTournamentFormPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
