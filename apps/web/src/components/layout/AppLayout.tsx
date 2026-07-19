import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.logo}>AET HUB</h1>
        {user && (
          <div className={styles.actions}>
            <nav>
              <Link to="/torneios" className={styles.navLink}>
                Torneios
              </Link>
              <Link to="/minhas-inscricoes" className={styles.navLink}>
                Minhas inscrições
              </Link>
              {user.role === 'ADMIN' && (
                <Link to="/admin/torneios" className={styles.navLink}>
                  Admin
                </Link>
              )}
            </nav>
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              Sair
            </button>
          </div>
        )}
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
