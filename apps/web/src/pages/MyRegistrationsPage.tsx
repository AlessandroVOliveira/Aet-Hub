import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useMyRegistrations } from '@/hooks/useMyRegistrations';
import { useCancelRegistration } from '@/hooks/useRegistrationMutations';
import { ApiError } from '@/services/http';
import { formatDate, registrationStatusLabels } from '@/utils/format';
import type { Registration } from '@/types/registration';
import styles from './MyRegistrationsPage.module.css';

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
    <section>
      <h2 className={styles.title}>Minhas inscrições</h2>

      {actionError && <p className={styles.errorBanner}>{actionError}</p>}

      {isError && (
        <p className={styles.errorBanner}>
          {error instanceof ApiError ? error.message : 'Erro inesperado'}
        </p>
      )}

      {isLoading && <p>Carregando...</p>}

      {!isLoading && !isError && data?.registrations.length === 0 && (
        <p className={styles.emptyState}>
          Você ainda não se inscreveu em nenhum torneio.{' '}
          <Link to="/torneios">Ver torneios abertos</Link>
        </p>
      )}

      {data && data.registrations.length > 0 && (
        <div className={styles.grid}>
          {data.registrations.map((registration) => (
            <div key={registration.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{registration.tournament.name}</h3>
              <p className={styles.cardStatus} data-status={registration.status}>
                {registrationStatusLabels[registration.status]}
              </p>
              <p className={styles.cardDetail}>
                Evento em {formatDate(registration.tournament.eventStartAt)}
              </p>

              {(registration.tournament.status === 'IN_PROGRESS' ||
                registration.tournament.status === 'COMPLETED') && (
                <Link
                  to={`/torneios/${registration.tournament.id}/chaveamento`}
                  state={{ tournamentName: registration.tournament.name }}
                  className={styles.bracketLink}
                >
                  Ver chaveamento
                </Link>
              )}

              {registration.status === 'CONFIRMED' && (
                <>
                  {registration.checkin ? (
                    <p className={styles.cardDetail}>
                      Checkin realizado em {formatDate(registration.checkin.checkedInAt)}
                    </p>
                  ) : (
                    <>
                      <div className={styles.qrWrapper}>
                        <QRCodeSVG value={registration.qrCodeToken} size={160} />
                      </div>
                      <p className={styles.code}>{registration.qrCodeToken}</p>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        disabled={cancelRegistration.isPending}
                        onClick={() => handleCancel(registration)}
                      >
                        Cancelar inscrição
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
