import { useState } from 'react';
import { useAdminReports } from '@/hooks/useAdminReports';
import { useDismissReport } from '@/hooks/useAdminReportMutations';
import {
  formatDate,
  reportedContentTypeLabels,
  reportStatusLabels,
  reportStatusTone,
} from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import type { Report, ReportStatus } from '@/types/report';

const STATUS_FILTERS: { label: string; value: ReportStatus | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Dispensadas', value: 'DISMISSED' },
];

export function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const { data, isLoading, isError, error } = useAdminReports(
    statusFilter === 'ALL' ? undefined : statusFilter,
  );
  const dismissReport = useDismissReport();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleDismiss(report: Report) {
    if (!window.confirm('Dispensar esta denúncia? (sem violação encontrada)')) return;
    setActionError(null);
    dismissReport.mutate(report.id, {
      onError: (mutationError) => {
        setActionError(mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado');
      },
    });
  }

  return (
    <div>
      <PageHeader eyebrow="STAFF_ONLY" title="DENÚNCIAS" accent="ADMIN" />

      <div className="p-4 md:p-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest ${
                statusFilter === filter.value
                  ? 'bg-navy-dark ring-1 ring-ember/40 text-ember'
                  : 'ring-1 ring-silver/20 text-silver-muted hover:text-silver'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {actionError && <Banner variant="error">{actionError}</Banner>}

        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.reports.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhuma denúncia encontrada.</p>
        )}

        {data && data.reports.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Conteúdo</th>
                  <th className="px-4 py-2">Denunciante</th>
                  <th className="px-4 py-2">Autor</th>
                  <th className="px-4 py-2">Motivo</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Criado em</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.reports.map((report) => (
                  <tr key={report.id} className="border-b border-silver/5 align-top">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {reportedContentTypeLabels[report.contentType]}
                    </td>
                    <td className="px-4 py-3 text-xs text-silver max-w-xs">
                      <p className="line-clamp-3 text-pretty">{report.contentSnapshot}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {report.reporterDisplayName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {report.contentAuthorDisplayName}
                    </td>
                    <td className="px-4 py-3 text-xs text-silver max-w-xs">
                      <p className="line-clamp-3 text-pretty">{report.reason}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip
                        label={reportStatusLabels[report.status]}
                        tone={reportStatusTone[report.status]}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted whitespace-nowrap">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {report.status === 'PENDING' && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={dismissReport.isPending}
                            onClick={() => handleDismiss(report)}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase disabled:opacity-60"
                          >
                            Dispensar
                          </button>
                        </div>
                      )}
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
