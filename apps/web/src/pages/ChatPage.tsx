import { useEffect, useRef, useState, type FormEvent, type UIEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useSendChatMessage } from '@/hooks/useChatMutations';
import { ApiError } from '@/services/http';
import { formatTime } from '@/utils/format';
import { Banner } from '@/components/ui/Banner';

// Primeira tela do app com scroll interno próprio (sem PageHeader — o
// header compacto abaixo preserva área útil pra thread). 3.5rem = h-14 do
// header mobile do AppLayout.
export function ChatPage() {
  const { user, token } = useAuth();
  const { data, isLoading, isError, error } = useChatMessages();
  const sendMessage = useSendChatMessage();
  useChatSocket(token);

  const [content, setContent] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const messages = data?.messages ?? [];
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    const list = listRef.current;
    if (!list || !lastMessageId) return;
    if (isAtBottomRef.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [lastMessageId]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const list = event.currentTarget;
    isAtBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sendMessage.isPending) return;

    sendMessage.mutate(trimmed, {
      onSuccess: () => setContent(''),
    });
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col">
      <header className="px-4 py-3 border-b border-silver/10">
        <h2 className="font-display uppercase italic tracking-tight text-lg">
          CHAT GERAL <span className="text-ember">/</span>
        </h2>
        <p className="font-mono text-[10px] text-silver-muted">
          canal aberto • todos os players
        </p>
      </header>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-navy-dark/50"
      >
        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {data && messages.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhuma mensagem ainda. Diga oi!</p>
        )}

        {messages.map((message) => {
          const mine = message.userId === user?.id;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-3 py-2 text-sm ${
                  mine ? 'bg-ember text-white' : 'bg-navy-light ring-1 ring-silver/10'
                }`}
              >
                {!mine && (
                  <p className="text-[10px] font-mono text-ember mb-0.5">
                    {message.senderDisplayName}
                  </p>
                )}
                <p className="break-words">{message.content}</p>
                <p
                  className={`text-[9px] font-mono mt-1 ${
                    mine ? 'text-white/70' : 'text-silver-muted'
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {sendMessage.isError && (
        <p className="px-4 pt-2 text-xs font-mono text-ember">
          {sendMessage.error instanceof ApiError ? sendMessage.error.message : 'Erro inesperado'}
        </p>
      )}

      <form onSubmit={handleSubmit} className="border-t border-silver/10 p-3 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={500}
          placeholder="Mensagem..."
          className="flex-1 bg-navy-light px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ember"
        />
        <button
          type="submit"
          disabled={sendMessage.isPending}
          className="px-4 bg-ember hover:bg-ember-glow disabled:opacity-60 text-white font-display italic tracking-widest uppercase text-xs"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
