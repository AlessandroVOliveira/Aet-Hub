import { useEffect, useRef, useState, type FormEvent, type UIEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useSendDirectMessage } from '@/hooks/useDirectMessageMutations';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import { MessageBubble } from '@/components/chat/MessageBubble';

interface DirectMessageThreadProps {
  otherUserId: string;
  // Primeiros dois elos da cadeia de resolução de nome (conversa no cache
  // → location.state) já vêm resolvidos de MessagesPage; os dois últimos
  // (derivado da primeira mensagem carregada → fallback 'Player') dependem
  // de `data.messages`, que só existe aqui dentro — por isso o restante da
  // cadeia é resolvido neste componente, não em MessagesPage.
  otherDisplayNameHint?: string;
}

// Molde direto de ChatPage.tsx, adaptado pra thread 1:1: sem senderName nas
// bolhas (só dois participantes, o nome é redundante) e com header/botão
// voltar próprios da navegação lista <-> thread no mobile.
export function DirectMessageThread({
  otherUserId,
  otherDisplayNameHint,
}: DirectMessageThreadProps) {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useDirectMessages(otherUserId);
  const sendMessage = useSendDirectMessage(otherUserId);

  const [content, setContent] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const messages = data?.messages ?? [];
  const lastMessageId = messages.at(-1)?.id;

  const firstMessage = messages[0];
  const otherDisplayName =
    otherDisplayNameHint ??
    (firstMessage
      ? firstMessage.senderId === user?.id
        ? firstMessage.recipientDisplayName
        : firstMessage.senderDisplayName
      : 'Player');

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
    // Diferente de ChatPage.tsx (raiz da rota, sem pai com altura própria),
    // este componente já vive dentro da coluna de thread de MessagesPage,
    // que por sua vez está no wrapper full-height da página — repetir o
    // cálculo `h-[calc(100vh-3.5rem)] lg:h-screen` aqui duplicaria a altura
    // (100vh dentro de 100vh). `h-full` herda do pai, que já é a medida
    // certa via flex stretch.
    <div className="h-full flex flex-col">
      <header className="px-4 py-3 border-b border-silver/10 flex items-center gap-3">
        <Link to="/mensagens" className="lg:hidden" aria-label="Voltar para conversas">
          <ArrowLeft className="size-5 text-silver-muted" />
        </Link>
        <div>
          <h2 className="font-display uppercase italic tracking-tight text-lg">
            {otherDisplayName}
          </h2>
          <p className="font-mono text-[10px] text-silver-muted">mensagem privada</p>
        </div>
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

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            id={message.id}
            mine={message.senderId === user?.id}
            content={message.content}
            createdAt={message.createdAt}
            reportContentType="DIRECT_MESSAGE"
          />
        ))}
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
