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
import { ProfilePage } from '@/pages/ProfilePage';
import { ProfileEditPage } from '@/pages/ProfileEditPage';
import { PublicProfilePage } from '@/pages/PublicProfilePage';
import { RankingPage } from '@/pages/RankingPage';
import { CommunitiesPage } from '@/pages/CommunitiesPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { PostDetailPage } from '@/pages/PostDetailPage';
import { ChatPage } from '@/pages/ChatPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { StorePage } from '@/pages/StorePage';
import { StoreItemDetailPage } from '@/pages/StoreItemDetailPage';
import { MyRedemptionsPage } from '@/pages/MyRedemptionsPage';
import { AdminTournamentsPage } from '@/pages/AdminTournamentsPage';
import { AdminTournamentFormPage } from '@/pages/AdminTournamentFormPage';
import { AdminCheckinPage } from '@/pages/AdminCheckinPage';
import { AdminStoreItemsPage } from '@/pages/AdminStoreItemsPage';
import { AdminStoreItemFormPage } from '@/pages/AdminStoreItemFormPage';
import { AdminRedemptionsPage } from '@/pages/AdminRedemptionsPage';
import { AdminCommunitiesPage } from '@/pages/AdminCommunitiesPage';
import { AdminCommunityFormPage } from '@/pages/AdminCommunityFormPage';
import { AdminReportsPage } from '@/pages/AdminReportsPage';
import { AdminGamesPage } from '@/pages/AdminGamesPage';
import { AdminGameFormPage } from '@/pages/AdminGameFormPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { AdminUserEditPage } from '@/pages/AdminUserEditPage';
import { AdminAuditLogsPage } from '@/pages/AdminAuditLogsPage';
import { AdminAchievementsPage } from '@/pages/AdminAchievementsPage';
import { AdminAchievementFormPage } from '@/pages/AdminAchievementFormPage';

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
          { path: '/perfil', element: <ProfilePage /> },
          { path: '/perfil/editar', element: <ProfileEditPage /> },
          { path: '/perfil/:userId', element: <PublicProfilePage /> },
          { path: '/loja', element: <StorePage /> },
          { path: '/loja/:id', element: <StoreItemDetailPage /> },
          { path: '/minhas-trocas', element: <MyRedemptionsPage /> },
          { path: '/ranking', element: <RankingPage /> },
          { path: '/comunidade', element: <CommunitiesPage /> },
          { path: '/comunidade/:id', element: <CommunityPage /> },
          { path: '/comunidade/:id/posts/:postId', element: <PostDetailPage /> },
          { path: '/chat', element: <ChatPage /> },
          { path: '/mensagens', element: <MessagesPage /> },
          { path: '/mensagens/:userId', element: <MessagesPage /> },
          { path: '/notificacoes', element: <NotificationsPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin/torneios', element: <AdminTournamentsPage /> },
              { path: '/admin/torneios/novo', element: <AdminTournamentFormPage /> },
              { path: '/admin/torneios/:id/editar', element: <AdminTournamentFormPage /> },
              { path: '/admin/torneios/:id/checkin', element: <AdminCheckinPage /> },
              { path: '/admin/loja', element: <AdminStoreItemsPage /> },
              { path: '/admin/loja/novo', element: <AdminStoreItemFormPage /> },
              { path: '/admin/loja/:id/editar', element: <AdminStoreItemFormPage /> },
              { path: '/admin/loja/resgates', element: <AdminRedemptionsPage /> },
              { path: '/admin/comunidades', element: <AdminCommunitiesPage /> },
              { path: '/admin/comunidades/novo', element: <AdminCommunityFormPage /> },
              { path: '/admin/comunidades/:id/editar', element: <AdminCommunityFormPage /> },
              { path: '/admin/denuncias', element: <AdminReportsPage /> },
              { path: '/admin/jogos', element: <AdminGamesPage /> },
              { path: '/admin/jogos/novo', element: <AdminGameFormPage /> },
              { path: '/admin/jogos/:id/editar', element: <AdminGameFormPage /> },
              { path: '/admin/usuarios', element: <AdminUsersPage /> },
              { path: '/admin/usuarios/:id/editar', element: <AdminUserEditPage /> },
              { path: '/admin/auditoria', element: <AdminAuditLogsPage /> },
              { path: '/admin/conquistas', element: <AdminAchievementsPage /> },
              { path: '/admin/conquistas/novo', element: <AdminAchievementFormPage /> },
              { path: '/admin/conquistas/:id/editar', element: <AdminAchievementFormPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
