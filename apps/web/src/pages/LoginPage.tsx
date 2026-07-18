import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login as loginRequest } from '@/services/auth';
import { ApiError } from '@/services/http';
import { useAuth } from '@/hooks/useAuth';
import styles from './LoginPage.module.css';

interface LocationState {
  from?: { pathname: string };
  registered?: boolean;
}

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      login(data.token);
      navigate(state?.from?.pathname ?? '/', { replace: true });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) return;
    mutation.mutate({ username: username.trim(), password });
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Entrar</h2>

      {state?.registered && (
        <p className={styles.successBanner}>Cadastro realizado — faça login.</p>
      )}

      {mutation.isError && (
        <p className={styles.errorBanner}>
          {mutation.error instanceof ApiError ? mutation.error.message : 'Erro inesperado'}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className={styles.submitButton} disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className={styles.footerLink}>
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  );
}
