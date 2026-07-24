import { useState } from 'react';
import { useReportMutation } from '@/hooks/useReportMutation';
import { ApiError } from '@/services/http';
import type { ReportedContentType } from '@/types/report';

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

interface ReportFormProps {
  contentType: ReportedContentType;
  contentId: string;
  // Aplicado só no gatilho colapsado (ex. "ml-auto" pra alinhar à direita
  // num action row) — o painel expandido sempre usa `basis-full` pra
  // quebrar linha, independente de como o gatilho foi alinhado.
  triggerClassName?: string;
}

// Único componente compartilhado pelas 4 superfícies de conteúdo
// denunciável (posts/comentários, comentário de notícia, chat, DM) — RF-40,
// Fatia A. Sem modal/página nova (nenhum modal existe no projeto hoje):
// colapsado é só um gatilho inline no action row existente; expandido é um
// textarea inline, mesmo padrão do composer de comentário de notícia
// (Record<id, boolean> de expand). `normal-case` no painel expandido evita
// herdar o `uppercase` dos action rows onde este componente é montado — só
// o texto do gatilho deve ficar em caixa alta.
export function ReportForm({ contentType, contentId, triggerClassName }: ReportFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState('');
  const mutation = useReportMutation();

  if (mutation.isSuccess) {
    return (
      <span className={`font-mono text-[10px] uppercase text-silver-muted ${triggerClassName ?? ''}`}>
        Denúncia enviada
      </span>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`font-mono text-[10px] uppercase hover:text-ember transition-colors ${triggerClassName ?? ''}`}
      >
        Denunciar
      </button>
    );
  }

  const trimmedReason = reason.trim();
  const canSubmit = trimmedReason.length >= MIN_REASON_LENGTH && !mutation.isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    mutation.mutate({ contentType, contentId, reason: trimmedReason });
  }

  function handleCancel() {
    setExpanded(false);
    setReason('');
  }

  return (
    <div className="basis-full mt-2 bg-navy-dark p-3 normal-case">
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={2}
        maxLength={MAX_REASON_LENGTH}
        placeholder="Descreva o motivo da denúncia..."
        className="w-full bg-navy-light p-2 text-xs font-mono text-silver outline-none focus:ring-1 focus:ring-ember resize-none"
      />
      {mutation.isError && (
        <p className="mt-1 text-[10px] font-mono text-ember">
          {mutation.error instanceof ApiError ? mutation.error.message : 'Erro inesperado'}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-silver-muted">
          {reason.length}/{MAX_REASON_LENGTH}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="font-mono text-[10px] uppercase text-silver-muted hover:text-silver transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="px-3 py-1 bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono text-[10px] uppercase transition-colors"
          >
            {mutation.isPending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
