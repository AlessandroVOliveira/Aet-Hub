import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useMyRegistrations } from '@/hooks/useMyRegistrations';
import { useCancelRegistration } from '@/hooks/useRegistrationMutations';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';
import { formatDate, registrationStatusLabels } from '@/utils/format';
import type { Registration } from '@/types/registration';

export function MyRegistrationsPage() {
  const { data, isLoading, isError, error } = useMyRegistrations();
  const cancelRegistration = useCancelRegistration();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleCancel(registration: Registration) {
    if (!window.confirm(`Cancelar sua inscrição em "${registration.tournament.name}"?`)) return;
    setActionError(null);
    cancelRegistration.mutate(registration.tournamentId, {
      onError: (mutationError) => {
        setActionError(mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado');
      },
    });
  }

  return (
    <div>
      <PageHeader eyebrow="CHECKIN_PESSOAL" title="MINHAS" accent="INSCRIÇÕES" />

      <div className="p-4 md:p-8">
        {actionError && <Banner variant="error">{actionError}</Banner>}

        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.registrations.length === 0 && (
          <p className="text-sm text-silver-muted">
            Você ainda não se inscreveu em nenhum torneio.{' '}
            <Link to="/torneios" className="text-ember hover:underline">
              Ver torneios abertos
            </Link>
          </p>
        )}

        {data && data.registrations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.registrations.map((registration) => (
              <div key={registration.id} className="bg-navy-light ring-1 ring-silver/10 p-6 flex flex-col">
                <h3 className="font-display text-xl uppercase italic tracking-tight mb-1">
                  {registration.tournament.name}
                </h3>
                <p
                  className="font-mono text-[10px] uppercase tracking-widest text-ember mb-3"
                  data-status={registration.status}
                >
                  {registrationStatusLabels[registration.status]}
                </p>
                <p className="font-mono text-xs text-silver-muted mb-4">
                  Evento em {formatDate(registration.tournament.eventStartAt)}
                </p>

                {(registration.tournament.status === 'IN_PROGRESS' ||
                  registration.tournament.status === 'COMPLETED') && (
                  <Link
                    to={`/torneios/${registration.tournament.id}/chaveamento`}
                    state={{ tournamentName: registration.tournament.name }}
                    className="mb-4 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase tracking-widest px-3 py-2 text-center transition"
                  >
                    Ver chaveamento
                  </Link>
                )}

                {registration.status === 'CONFIRMED' && (
                  <>
                    {registration.checkin ? (
                      <p className="font-mono text-xs text-silver-muted mt-auto">
                        Checkin realizado em {formatDate(registration.checkin.checkedInAt)}
                      </p>
                    ) : (
                      <div className="mt-auto flex flex-col items-center gap-3 pt-2 border-t border-silver/10">
                        <div className="bg-silver p-2">
                          <QRCodeSVG value={registration.qrCodeToken} size={140} />
                        </div>
                        <p className="font-mono text-xs text-ember tracking-widest">
                          {registration.qrCodeToken}
                        </p>
                        <button
                          type="button"
                          disabled={cancelRegistration.isPending}
                          onClick={() => handleCancel(registration)}
                          className="w-full py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase tracking-widest transition disabled:opacity-60"
                        >
                          Cancelar inscrição
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
