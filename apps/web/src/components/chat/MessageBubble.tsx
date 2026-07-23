import { formatTime } from '@/utils/format';

interface MessageBubbleProps {
  mine: boolean;
  senderName?: string;
  content: string;
  createdAt: string;
}

// Reusado pelo chat geral (com senderName, várias pessoas no canal) e pelo
// chat privado (sem senderName — só dois participantes, o nome é redundante).
export function MessageBubble({ mine, senderName, content, createdAt }: MessageBubbleProps) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] px-3 py-2 text-sm ${
          mine ? 'bg-ember text-white' : 'bg-navy-light ring-1 ring-silver/10'
        }`}
      >
        {!mine && senderName && (
          <p className="text-[10px] font-mono text-ember mb-0.5">{senderName}</p>
        )}
        <p className="break-words">{content}</p>
        <p
          className={`text-[9px] font-mono mt-1 ${mine ? 'text-white/70' : 'text-silver-muted'}`}
        >
          {formatTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
