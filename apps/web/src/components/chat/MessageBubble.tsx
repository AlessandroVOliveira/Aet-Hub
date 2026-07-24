import { formatTime } from '@/utils/format';
import { ReportForm } from '@/components/reports/ReportForm';
import type { ReportedContentType } from '@/types/report';

interface MessageBubbleProps {
  id: string;
  mine: boolean;
  senderName?: string;
  content: string;
  createdAt: string;
  // Chat geral e DM são endpoints RF-40 diferentes (ver reports.service.ts),
  // mesmo componente/UI pros dois — só o tipo denunciado muda.
  reportContentType: ReportedContentType;
}

// Reusado pelo chat geral (com senderName, várias pessoas no canal) e pelo
// chat privado (sem senderName — só dois participantes, o nome é redundante).
export function MessageBubble({
  id,
  mine,
  senderName,
  content,
  createdAt,
  reportContentType,
}: MessageBubbleProps) {
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
        {/* div, não <p> — ReportForm pode renderizar um <div> quando
            expandido (não é conteúdo válido dentro de <p>). */}
        <div
          className={`text-[9px] font-mono mt-1 flex items-center gap-2 flex-wrap ${mine ? 'text-white/70' : 'text-silver-muted'}`}
        >
          {formatTime(createdAt)}
          {!mine && <ReportForm contentType={reportContentType} contentId={id} />}
        </div>
      </div>
    </div>
  );
}
