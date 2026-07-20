import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login as loginRequest } from '@/services/auth';
import { ApiError } from '@/services/http';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Field } from '@/components/ui/Field';
import { Banner } from '@/components/ui/Banner';

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
    <AuthLayout eyebrow="ACESSO_PLAYER" title="ENTRAR" accent="NO CONSOLE">
      {state?.registered && <Banner variant="success">Cadastro realizado — faça login.</Banner>}

      {mutation.isError && (
        <Banner variant="error">
          {mutation.error instanceof ApiError ? mutation.error.message : 'Erro inesperado'}
        </Banner>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label="USUÁRIO"
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
        />
        <Field
          label="SENHA"
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display py-3 tracking-widest uppercase italic transition-colors"
        >
          {mutation.isPending ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-xs text-silver-muted text-center pt-4">
          Novo por aqui?{' '}
          <Link to="/cadastro" className="text-ember hover:underline font-bold uppercase">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
