import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Scanner, type IDetectedBarcode, type IScannerError } from '@yudiel/react-qr-scanner';
import { useTournamentCheckins } from '@/hooks/useTournamentCheckins';
import { useCreateCheckin } from '@/hooks/useCheckinMutations';
import { ApiError } from '@/services/http';
import { formatDate, registrationStatusLabels } from '@/utils/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';

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

  const done = data?.registrations.filter((registration) => registration.checkin).length ?? 0;
  const total = data?.registrations.length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="STAFF_ONLY"
        title="CHECKIN"
        accent="LIVE"
        actions={
          <Link
            to="/admin/torneios"
            className="px-4 py-2 bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase"
          >
            Voltar para torneios
          </Link>
        }
      />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_1fr] gap-8">
        <section className="bg-navy-light ring-1 ring-silver/10 p-6 space-y-4">
          {successMessage && <Banner variant="success">{successMessage}</Banner>}
          {actionError && <Banner variant="error">{actionError}</Banner>}

          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label htmlFor="manual-code" className="font-mono text-[10px] text-silver-muted uppercase tracking-widest">
              Código de checkin
            </label>
            <div className="flex gap-2">
              <input
                id="manual-code"
                type="text"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="Cole ou digite o código do player"
                className="flex-1 bg-navy-dark border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors"
              />
              <button
                type="submit"
                disabled={createCheckin.isPending}
                className="px-4 bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono text-xs uppercase transition-colors"
              >
                Confirmar
              </button>
            </div>
          </form>

          <div>
            <button
              type="button"
              onClick={() => {
                setCameraError(null);
                setCameraOpen((open) => !open);
              }}
              className="w-full py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase transition"
            >
              {cameraOpen ? 'Desativar câmera' : 'Ativar câmera'}
            </button>

            {cameraOpen && (
              <div className="mt-4 overflow-hidden ring-1 ring-silver/10">
                <Scanner onScan={handleScan} onError={handleScannerError} />
              </div>
            )}

            {cameraError && (
              <p className="mt-2 text-xs font-mono text-ember">{cameraError}</p>
            )}
          </div>
        </section>

        <section className="bg-navy-light ring-1 ring-silver/10">
          <header className="px-4 py-3 border-b border-silver/10 flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
              Status dos participantes
            </h3>
            <span className="font-mono text-xs text-ember">
              {done}/{total} confirmados
            </span>
          </header>

          {isError && (
            <div className="p-4">
              <Banner variant="error">
                {error instanceof ApiError ? error.message : 'Erro inesperado'}
              </Banner>
            </div>
          )}

          {isLoading && <p className="p-4 text-sm text-silver-muted">Carregando...</p>}

          {data && data.registrations.length === 0 && (
            <p className="p-4 text-sm text-silver-muted">Nenhuma inscrição para este torneio ainda.</p>
          )}

          {data && data.registrations.length > 0 && (
            <ul className="divide-y divide-silver/5">
              {data.registrations.map((registration) => (
                <li key={registration.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-mono">
                      {registration.user.profile?.displayName ?? registration.user.username}
                    </p>
                    <p className="text-[10px] text-silver-muted font-mono">
                      {registrationStatusLabels[registration.status]}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-1 ${
                      registration.checkin
                        ? 'bg-ember/20 text-ember ring-1 ring-ember/40'
                        : 'bg-navy-dark text-silver-muted ring-1 ring-silver/20'
                    }`}
                  >
                    {registration.checkin ? `feito às ${formatDate(registration.checkin.checkedInAt)}` : 'pendente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
