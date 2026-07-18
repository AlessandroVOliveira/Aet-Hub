import { Outlet, useNavigate } from 'react-router-dom';
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
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Sair
          </button>
        )}
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
