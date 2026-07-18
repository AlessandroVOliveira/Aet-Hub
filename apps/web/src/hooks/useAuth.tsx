import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '@/services/auth';
import { decodeJwtPayload } from '@/utils/jwt';
import type { Role } from '@/types/auth';

const TOKEN_STORAGE_KEY = 'aet-hub:token';

interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  displayName: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me', token],
    queryFn: async () => {
      try {
        return await getMe(token!);
      } catch (error) {
        // token expirado/inválido: limpa o storage aqui (dentro da queryFn,
        // não num efeito) pra não reusar o mesmo token numa próxima sessão
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        throw error;
      }
    },
    enabled: !!token,
    retry: false,
  });

  const isAuthenticated = !!token && !isError;

  function login(newToken: string) {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    queryClient.clear();
  }

  const user = useMemo<SessionUser | null>(() => {
    if (!data || !token) return null;
    const claims = decodeJwtPayload<{ role: Role }>(token);
    return {
      id: data.profile.user.id,
      username: data.profile.user.username,
      email: data.profile.user.email,
      displayName: data.profile.displayName,
      role: claims?.role ?? 'PLAYER',
    };
  }, [data, token]);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    isLoading: !!token && isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return context;
}
