import { useQuery } from '@tanstack/react-query';
import { listCosmetics } from '@/services/cosmetics';
import { useAuth } from '@/hooks/useAuth';

export const COSMETICS_QUERY_KEY = ['cosmetics'] as const;

// Catálogo ativo (frame + título nesta fatia) anotado com posse/loadout do
// usuário da sessão — busca única, sem filtro de kind no servidor; a aba
// Personalizar filtra por kind no cliente (mesmo padrão do mock portado).
export function useCosmetics() {
  const { token } = useAuth();

  return useQuery({
    queryKey: COSMETICS_QUERY_KEY,
    queryFn: () => listCosmetics(token as string),
    enabled: !!token,
  });
}
