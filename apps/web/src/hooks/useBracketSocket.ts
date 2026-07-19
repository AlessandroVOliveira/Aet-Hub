import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/services/http';
import { bracketQueryKey } from '@/hooks/useBracket';

interface UseBracketSocketResult {
  tournamentJustCompleted: boolean;
}

// O banner de campeão da BracketPage NÃO depende de tournamentJustCompleted:
// se o evento for emitido antes da tela abrir (ou perdido num F5), não há
// como recuperá-lo depois. A fonte de verdade é o próprio dado do bracket
// (slot campeão preenchido), sempre disponível via refetch.
export function useBracketSocket(
  tournamentId: string | undefined,
  token: string | null,
): UseBracketSocketResult {
  const queryClient = useQueryClient();
  const [tournamentJustCompleted, setTournamentJustCompleted] = useState(false);

  useEffect(() => {
    if (!token || !tournamentId) return;

    const socket: Socket = io(`${API_BASE_URL}/tournaments`, { auth: { token } });

    socket.emit('tournament:join', tournamentId);

    socket.on('bracket:updated', () => {
      queryClient.invalidateQueries({ queryKey: bracketQueryKey(tournamentId) });
    });

    socket.on('tournament:completed', () => {
      queryClient.invalidateQueries({ queryKey: bracketQueryKey(tournamentId) });
      setTournamentJustCompleted(true);
    });

    return () => {
      socket.emit('tournament:leave', tournamentId);
      socket.disconnect();
    };
  }, [token, tournamentId, queryClient]);

  return { tournamentJustCompleted };
}
