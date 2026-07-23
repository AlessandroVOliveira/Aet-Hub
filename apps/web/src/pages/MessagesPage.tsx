import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useDirectMessagesSocket } from '@/hooks/useDirectMessagesSocket';
import { ConversationList } from '@/components/chat/ConversationList';
import { DirectMessageThread } from '@/components/chat/DirectMessageThread';

interface MessagesLocationState {
  displayName?: string;
}

// Mesmo cálculo de altura de ChatPage.tsx (3.5rem = h-14 do header mobile
// do AppLayout) — segunda tela full-height com scroll interno próprio.
export function MessagesPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, token } = useAuth();
  const location = useLocation();
  const locationState = location.state as MessagesLocationState | null;

  const { data, isLoading, isError, error } = useConversations();
  useDirectMessagesSocket(token, user?.id);

  // Cadeia de resolução de nome, primeiros dois elos: conversa já no cache
  // (lista carregada) tem prioridade sobre o state de navegação (que só
  // existe se a rota foi acessada via <Link> da própria lista/ranking) —
  // ambos podem ficar indisponíveis num acesso direto por URL, caso em que
  // DirectMessageThread completa a cadeia com o que sobrar.
  const conversationName = data?.conversations.find((c) => c.otherUserId === userId)
    ?.otherDisplayName;
  const otherDisplayNameHint = conversationName ?? locationState?.displayName;

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      <div
        className={`w-full lg:w-72 lg:border-r lg:border-silver/10 flex-col ${
          userId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <header className="px-4 py-3 border-b border-silver/10">
          <h2 className="font-display uppercase italic tracking-tight text-lg">
            MENSAGENS <span className="text-ember">/</span>
          </h2>
          <p className="font-mono text-[10px] text-silver-muted">conversas privadas</p>
        </header>
        <ConversationList
          conversations={data?.conversations}
          isLoading={isLoading}
          isError={isError}
          error={error}
          activeUserId={userId}
          myUserId={user.id}
        />
      </div>

      <div className={`flex-1 ${userId ? 'flex' : 'hidden lg:flex'} flex-col`}>
        {userId ? (
          // key={userId} força remount ao trocar de conversa — sem ele, o
          // rascunho digitado (`content`) e o `isAtBottomRef` da thread
          // anterior vazariam para a nova conversa em vez de resetar.
          <DirectMessageThread
            key={userId}
            otherUserId={userId}
            otherDisplayNameHint={otherDisplayNameHint}
          />
        ) : (
          <div className="flex-1 grid place-items-center">
            <p className="text-sm text-silver-muted">Selecione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}
