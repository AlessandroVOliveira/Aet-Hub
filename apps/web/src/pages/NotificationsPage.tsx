import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Store, Swords, Trophy, Users } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useMarkAllNotificationsRead } from '@/hooks/useNotificationMutations';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Banner } from '@/components/ui/Banner';
import { formatDate } from '@/utils/format';
import type { AppNotification, NotificationType } from '@/types/notification';

const NOTIFICATION_ICONS: Record<NotificationType, typeof Swords> = {
  MATCH_READY: Swords,
  DIRECT_MESSAGE: MessageCircle,
  REDEMPTION_UPDATED: Store,
  TOURNAMENT_COMPLETED: Trophy,
  POST_COMMENT: Users,
};

export function NotificationsPage() {
  const { data, isLoading, isError, error } = useNotifications();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;

  // Marcação automática ao abrir a página: mutation disparada em effect
  // (não é setState, então não fere react-hooks/set-state-in-effect).
  // onSuccess só zera o contador — os itens continuam destacados como
  // não-lidos durante a visita (ver useNotificationMutations.ts). `mutate`
  // é estável entre renders (TanStack Query), então incluí-lo nas deps não
  // causa re-disparo espúrio.
  useEffect(() => {
    if (unreadCount > 0) {
      markAllRead();
    }
  }, [unreadCount, markAllRead]);

  return (
    <div>
      <PageHeader eyebrow="AVISOS" title="NOTIFI" accent="CAÇÕES" />

      <div className="p-4 md:p-8">
        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {data && data.notifications.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhuma notificação por aqui ainda.</p>
        )}

        {data && data.notifications.length > 0 && (
          <Panel title="TODAS">
            <div className="-m-4 divide-y divide-silver/10">
              {data.notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  const Icon = NOTIFICATION_ICONS[notification.type];
  const isUnread = notification.readAt === null;

  return (
    <Link
      to={notification.linkPath}
      className={`flex items-start gap-3 px-4 py-3 border-l-2 transition-colors hover:bg-navy-dark/50 ${
        isUnread ? 'bg-ember/10 border-ember' : 'border-transparent'
      }`}
    >
      <span className="size-8 shrink-0 bg-ember/20 ring-1 ring-ember/30 grid place-items-center">
        <Icon className="size-4 text-ember" />
      </span>
      <span className="min-w-0 flex-1">
        <p className="font-display italic uppercase tracking-tight text-sm">{notification.title}</p>
        <p className="text-sm text-silver-muted mt-0.5">{notification.body}</p>
        <p className="font-mono text-[10px] text-silver-muted mt-1">
          {formatDate(notification.createdAt)}
        </p>
      </span>
    </Link>
  );
}
