import { useState } from 'react';
import { useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';
import {
  AUDIT_LOG_ACTION_OPTIONS,
  AUDIT_LOG_ENTITY_TYPE_OPTIONS,
  auditLogActionLabel,
  auditLogEntityTypeLabel,
  formatDate,
} from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';
import type { AuditLog } from '@/types/audit-log';

const selectClass =
  'bg-navy-dark ring-1 ring-silver/20 focus:ring-ember outline-none px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-silver-muted';

// Reason é o único campo de metadata presente em toda ação hoje (mesma
// convenção usada por moderação/contestação de resultado) — o resto do
// payload (ex. diff de campos editados) fica só disponível como JSON bruto,
// sem uma tela dedicada por tipo de ação.
function metadataSummary(metadata: AuditLog['metadata']): string {
  if (!metadata) return '—';
  if (typeof metadata.reason === 'string' && metadata.reason.trim()) return metadata.reason;
  return JSON.stringify(metadata);
}

export function AdminAuditLogsPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const { data, isLoading, isError, error } = useAdminAuditLogs({
    action: action || undefined,
    entityType: entityType || undefined,
  });

  return (
    <div>
      <PageHeader eyebrow="STAFF_ONLY" title="LOG DE AUDITORIA" accent="ADMIN" />

      <div className="p-4 md:p-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          <select
            className={selectClass}
            value={action}
            onChange={(event) => setAction(event.target.value)}
          >
            <option value="">Todas as ações</option>
            {AUDIT_LOG_ACTION_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {auditLogActionLabel(value)}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
          >
            <option value="">Todas as entidades</option>
            {AUDIT_LOG_ENTITY_TYPE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {auditLogEntityTypeLabel(value)}
              </option>
            ))}
          </select>
        </div>

        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.auditLogs.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum registro encontrado.</p>
        )}

        {data && data.auditLogs.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Ação</th>
                  <th className="px-4 py-2">Entidade</th>
                  <th className="px-4 py-2">Autor</th>
                  <th className="px-4 py-2">Detalhes</th>
                  <th className="px-4 py-2">Quando</th>
                </tr>
              </thead>
              <tbody>
                {data.auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-silver/5 align-top">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {auditLogActionLabel(log.action)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {auditLogEntityTypeLabel(log.entityType)}
                      <span className="block text-silver-muted/60">{log.entityId}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {log.actor.profile?.displayName ?? log.actor.username}
                    </td>
                    <td className="px-4 py-3 text-xs text-silver max-w-sm">
                      <p className="line-clamp-3 text-pretty">{metadataSummary(log.metadata)}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
