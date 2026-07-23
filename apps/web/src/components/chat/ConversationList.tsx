import { Link } from 'react-router-dom';
import { ApiError } from '@/services/http';
import { formatTime } from '@/utils/format';
import { Banner } from '@/components/ui/Banner';
import type { Conversation } from '@/types/chat';

interface ConversationListProps {
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  activeUserId: string | undefined;
  myUserId: string;
}

export function ConversationList({
  conversations,
  isLoading,
  isError,
  error,
  activeUserId,
  myUserId,
}: ConversationListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {isLoading && <p className="p-4 text-sm text-silver-muted">Carregando...</p>}

      {isError && (
        <div className="p-4">
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        </div>
      )}

      {conversations && conversations.length === 0 && (
        <p className="p-4 text-sm text-silver-muted">Nenhuma conversa ainda.</p>
      )}

      {conversations?.map((conversation) => {
        const active = conversation.otherUserId === activeUserId;
        const mine = conversation.lastMessageSenderId === myUserId;

        return (
          <Link
            key={conversation.otherUserId}
            to={`/mensagens/${conversation.otherUserId}`}
            state={{ displayName: conversation.otherDisplayName }}
            className={`block px-4 py-3 border-b border-silver/5 ${
              active ? 'bg-ember/10' : 'hover:bg-navy-light/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-display italic uppercase tracking-tight text-sm truncate">
                {conversation.otherDisplayName}
              </p>
              <span className="font-mono text-[9px] text-silver-muted shrink-0">
                {formatTime(conversation.lastMessageAt)}
              </span>
            </div>
            <p className="font-mono text-[11px] text-silver-muted truncate mt-0.5">
              {mine && 'Você: '}
              {conversation.lastMessageContent}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
