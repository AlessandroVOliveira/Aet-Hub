import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Scanner, type IDetectedBarcode, type IScannerError } from '@yudiel/react-qr-scanner';
import { useTournamentCheckins } from '@/hooks/useTournamentCheckins';
import { useCreateCheckin } from '@/hooks/useCheckinMutations';
import { ApiError } from '@/services/http';
import { formatDate, registrationStatusLabels } from '@/utils/format';
import styles from './AdminCheckinPage.module.css';

export function AdminCheckinPage() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = id as string;
  const { data, isLoading, isError, error } = useTournamentCheckins(tournamentId);
  const createCheckin = useCreateCheckin(tournamentId);

  const [manualCode, setManualCode] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  function submitCheckin(qrCodeToken: string, method: 'MANUAL_CODE' | 'QR_CODE') {
    setActionError(null);
    setSuccessMessage(null);
    createCheckin.mutate(
      { qrCodeToken, method },
      {
        onSuccess: (response) => {
          const displayName =
            response.checkin.registration.user.profile?.displayName ??
            response.checkin.registration.user.username;
          setSuccessMessage(`Checkin de ${displayName} confirmado.`);
        },
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  function handleManualSubmit(event: FormEvent) {
    event.preventDefault();
    if (!manualCode.trim()) return;
    submitCheckin(manualCode.trim(), 'MANUAL_CODE');
    setManualCode('');
  }

  function handleScan(detectedCodes: IDetectedBarcode[]) {
    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;
    submitCheckin(rawValue, 'QR_CODE');
    setCameraOpen(false);
  }

  function handleScannerError(_scannerError: IScannerError) {
    setCameraError('Não foi possível acessar a câmera. Use o código manual acima.');
    setCameraOpen(false);
  }

  return (
    <section>
      <h2 className={styles.title}>Checkin</h2>
      <Link to="/admin/torneios" className={styles.backLink}>
        Voltar para torneios
      </Link>

      {successMessage && <p className={styles.successBanner}>{successMessage}</p>}
      {actionError && <p className={styles.errorBanner}>{actionError}</p>}

      <form className={styles.manualForm} onSubmit={handleManualSubmit}>
        <label htmlFor="manual-code" className={styles.manualLabel}>
          Código de checkin
        </label>
        <div className={styles.manualRow}>
          <input
            id="manual-code"
            type="text"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="Cole ou digite o código do player"
            className={styles.manualInput}
          />
          <button type="submit" className={styles.manualButton} disabled={createCheckin.isPending}>
            Confirmar
          </button>
        </div>
      </form>

      <div className={styles.cameraSection}>
        <button
          type="button"
          className={styles.cameraToggleButton}
          onClick={() => {
            setCameraError(null);
            setCameraOpen((open) => !open);
          }}
        >
          {cameraOpen ? 'Desativar câmera' : 'Ativar câmera'}
        </button>

        {cameraOpen && (
          <div className={styles.scannerWrapper}>
            <Scanner onScan={handleScan} onError={handleScannerError} />
          </div>
        )}

        {cameraError && <p className={styles.cameraError}>{cameraError}</p>}
      </div>

      {isError && (
        <p className={styles.errorBanner}>
          {error instanceof ApiError ? error.message : 'Erro inesperado'}
        </p>
      )}

      {isLoading && <p>Carregando...</p>}

      {data && data.registrations.length === 0 && (
        <p className={styles.emptyState}>Nenhuma inscrição para este torneio ainda.</p>
      )}

      {data && data.registrations.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Player</th>
                <th>Inscrição</th>
                <th>Checkin</th>
              </tr>
            </thead>
            <tbody>
              {data.registrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{registration.user.profile?.displayName ?? registration.user.username}</td>
                  <td>{registrationStatusLabels[registration.status]}</td>
                  <td>
                    {registration.checkin
                      ? `Feito às ${formatDate(registration.checkin.checkedInAt)}`
                      : 'Pendente'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
