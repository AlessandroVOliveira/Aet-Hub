import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { HomePage } from '@/pages/HomePage';
import { TournamentsPage } from '@/pages/TournamentsPage';
import { TournamentDetailPage } from '@/pages/TournamentDetailPage';
import { BracketPage } from '@/pages/BracketPage';
import { MyRegistrationsPage } from '@/pages/MyRegistrationsPage';
import { StorePage } from '@/pages/StorePage';
import { StoreItemDetailPage } from '@/pages/StoreItemDetailPage';
import { MyRedemptionsPage } from '@/pages/MyRedemptionsPage';
import { AdminTournamentsPage } from '@/pages/AdminTournamentsPage';
import { AdminTournamentFormPage } from '@/pages/AdminTournamentFormPage';
import { AdminCheckinPage } from '@/pages/AdminCheckinPage';

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
          { path: '/torneios/:id/chaveamento', element: <BracketPage /> },
          { path: '/minhas-inscricoes', element: <MyRegistrationsPage /> },
          { path: '/loja', element: <StorePage /> },
          { path: '/loja/:id', element: <StoreItemDetailPage /> },
          { path: '/minhas-trocas', element: <MyRedemptionsPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin/torneios', element: <AdminTournamentsPage /> },
              { path: '/admin/torneios/novo', element: <AdminTournamentFormPage /> },
              { path: '/admin/torneios/:id/editar', element: <AdminTournamentFormPage /> },
              { path: '/admin/torneios/:id/checkin', element: <AdminCheckinPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
