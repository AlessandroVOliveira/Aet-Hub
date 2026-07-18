import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateTournament, useUpdateTournament } from '@/hooks/useAdminTournamentMutations';
import { validateTournamentCrossFields } from '@/utils/validate-tournament-form';
import { applyIssuesToForm } from '@/utils/apply-issues-to-form';
import { bracketTypeLabels, tiebreakerRuleLabels, tournamentStatusLabels } from '@/utils/format';
import { ApiError } from '@/services/http';
import type {
  BracketType,
  CreateTournamentPayload,
  TiebreakerRule,
  TournamentDetail,
  TournamentFormFields,
  TournamentStatus,
  UpdateTournamentPayload,
} from '@/types/tournament';
import type { Game } from '@/types/game';
import styles from './TournamentForm.module.css';

interface TournamentFormValues extends Omit<
  TournamentFormFields,
  'description' | 'tiebreakerRule'
> {
  description: string;
  tiebreakerRule: TiebreakerRule | '';
  status: TournamentStatus;
}

interface TournamentFormProps {
  mode: 'create' | 'edit';
  tournament?: TournamentDetail;
  games: Game[];
}

const BRACKET_TYPES: BracketType[] = ['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION'];
const TIEBREAKER_RULES: TiebreakerRule[] = ['HEAD_TO_HEAD', 'WIN_BALANCE'];
const ALL_STATUSES: TournamentStatus[] = [
  'DRAFT',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'CHECKIN_OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyDefaults(): TournamentFormValues {
  return {
    name: '',
    gameId: '',
    description: '',
    registrationStartAt: '',
    registrationEndAt: '',
    checkinDeadlineAt: '',
    eventStartAt: '',
    entryFeeCents: 0,
    bracketType: 'SINGLE_ELIMINATION',
    tiebreakerRule: '',
    pointsPerWin: 0,
    pointsPerLoss: 0,
    sponsors: [],
    placementRewards: [],
    status: 'DRAFT',
  };
}

function toFormDefaults(tournament: TournamentDetail): TournamentFormValues {
  return {
    name: tournament.name,
    gameId: tournament.gameId,
    description: tournament.description ?? '',
    registrationStartAt: toDatetimeLocal(tournament.registrationStartAt),
    registrationEndAt: toDatetimeLocal(tournament.registrationEndAt),
    checkinDeadlineAt: toDatetimeLocal(tournament.checkinDeadlineAt),
    eventStartAt: toDatetimeLocal(tournament.eventStartAt),
    entryFeeCents: tournament.entryFeeCents,
    bracketType: tournament.bracketType,
    tiebreakerRule: tournament.tiebreakerRule ?? '',
    pointsPerWin: tournament.pointsPerWin,
    pointsPerLoss: tournament.pointsPerLoss,
    sponsors: tournament.sponsors.map((sponsor) => ({
      name: sponsor.name,
      logoUrl: sponsor.logoUrl,
      link: sponsor.link ?? '',
    })),
    placementRewards: tournament.placementRewards.map((reward) => ({
      placement: reward.placement,
      potPercentage: Number(reward.potPercentage),
      bonusPoints: reward.bonusPoints,
    })),
    status: tournament.status,
  };
}

function toSubmitFields(values: TournamentFormValues): TournamentFormFields {
  return {
    name: values.name.trim(),
    gameId: values.gameId,
    description: values.description.trim() ? values.description.trim() : undefined,
    registrationStartAt: values.registrationStartAt,
    registrationEndAt: values.registrationEndAt,
    checkinDeadlineAt: values.checkinDeadlineAt,
    eventStartAt: values.eventStartAt,
    entryFeeCents: values.entryFeeCents,
    bracketType: values.bracketType,
    tiebreakerRule: values.tiebreakerRule || undefined,
    pointsPerWin: values.pointsPerWin,
    pointsPerLoss: values.pointsPerLoss,
    sponsors: values.sponsors.map((sponsor) => ({
      name: sponsor.name.trim(),
      logoUrl: sponsor.logoUrl.trim(),
      link: sponsor.link?.trim() ? sponsor.link.trim() : undefined,
    })),
    placementRewards: values.placementRewards.map((reward) => ({
      placement: Number(reward.placement),
      potPercentage: Number(reward.potPercentage),
      bonusPoints: Number(reward.bonusPoints),
    })),
  };
}

export function TournamentForm({ mode, tournament, games }: TournamentFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateTournament();
  const updateMutation = useUpdateTournament(tournament?.id ?? '');

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TournamentFormValues>({
    defaultValues: tournament ? toFormDefaults(tournament) : emptyDefaults(),
  });

  const sponsorsArray = useFieldArray({ control, name: 'sponsors' });
  const placementRewardsArray = useFieldArray({ control, name: 'placementRewards' });

  const isPending = mode === 'create' ? createMutation.isPending : updateMutation.isPending;

  const generalError =
    (createMutation.isError &&
    createMutation.error instanceof ApiError &&
    !createMutation.error.issues
      ? createMutation.error.message
      : null) ??
    (updateMutation.isError &&
    updateMutation.error instanceof ApiError &&
    !updateMutation.error.issues
      ? updateMutation.error.message
      : null);

  const placementRewardsRootError = (errors.placementRewards as { message?: string } | undefined)
    ?.message;

  const onSubmit = handleSubmit((values) => {
    const crossFieldIssues = validateTournamentCrossFields(toSubmitFields(values));
    if (crossFieldIssues.length > 0) {
      applyIssuesToForm(crossFieldIssues, setError);
      return;
    }

    if (mode === 'create') {
      const payload: CreateTournamentPayload = toSubmitFields(values);
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/admin/torneios'),
        onError: (error) => {
          if (error instanceof ApiError && error.issues) {
            applyIssuesToForm(error.issues, setError);
          }
        },
      });
    } else {
      const payload: UpdateTournamentPayload = { ...toSubmitFields(values), status: values.status };
      updateMutation.mutate(payload, {
        onSuccess: () => navigate('/admin/torneios'),
        onError: (error) => {
          if (error instanceof ApiError && error.issues) {
            applyIssuesToForm(error.issues, setError);
          }
        },
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <h2 className={styles.title}>{mode === 'create' ? 'Novo torneio' : 'Editar torneio'}</h2>

      {generalError && <p className={styles.errorBanner}>{generalError}</p>}

      <div className={styles.field}>
        <label htmlFor="name">Nome</label>
        <input id="name" {...register('name', { required: true, minLength: 3, maxLength: 120 })} />
        {errors.name && (
          <span className={styles.fieldError}>Informe um nome de 3 a 120 caracteres</span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="gameId">Jogo</label>
        <select id="gameId" {...register('gameId', { required: true })}>
          <option value="">Selecione...</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        {errors.gameId && <span className={styles.fieldError}>Selecione um jogo</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Descrição (opcional)</label>
        <textarea id="description" {...register('description', { maxLength: 2000 })} />
        {errors.description && <span className={styles.fieldError}>Máximo de 2000 caracteres</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="registrationStartAt">Início das inscrições</label>
        <input
          id="registrationStartAt"
          type="datetime-local"
          {...register('registrationStartAt', { required: true })}
        />
        {errors.registrationStartAt && <span className={styles.fieldError}>Campo obrigatório</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="registrationEndAt">Fim das inscrições</label>
        <input
          id="registrationEndAt"
          type="datetime-local"
          {...register('registrationEndAt', { required: true })}
        />
        {errors.registrationEndAt && (
          <span className={styles.fieldError}>
            {errors.registrationEndAt.message ?? 'Campo obrigatório'}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="checkinDeadlineAt">Prazo de check-in</label>
        <input
          id="checkinDeadlineAt"
          type="datetime-local"
          {...register('checkinDeadlineAt', { required: true })}
        />
        {errors.checkinDeadlineAt && (
          <span className={styles.fieldError}>
            {errors.checkinDeadlineAt.message ?? 'Campo obrigatório'}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="eventStartAt">Início do evento</label>
        <input
          id="eventStartAt"
          type="datetime-local"
          {...register('eventStartAt', { required: true })}
        />
        {errors.eventStartAt && (
          <span className={styles.fieldError}>
            {errors.eventStartAt.message ?? 'Campo obrigatório'}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="entryFeeCents">Taxa de inscrição (centavos)</label>
        <input
          id="entryFeeCents"
          type="number"
          min={0}
          step={1}
          {...register('entryFeeCents', { required: true, valueAsNumber: true, min: 0 })}
        />
        {errors.entryFeeCents && (
          <span className={styles.fieldError}>Informe um valor válido (0 = gratuito)</span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="bracketType">Formato de chave</label>
        <select id="bracketType" {...register('bracketType', { required: true })}>
          {BRACKET_TYPES.map((type) => (
            <option key={type} value={type}>
              {bracketTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="tiebreakerRule">Critério de desempate (opcional)</label>
        <select id="tiebreakerRule" {...register('tiebreakerRule')}>
          <option value="">Nenhum</option>
          {TIEBREAKER_RULES.map((rule) => (
            <option key={rule} value={rule}>
              {tiebreakerRuleLabels[rule]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="pointsPerWin">Pontos por vitória</label>
        <input
          id="pointsPerWin"
          type="number"
          min={0}
          step={1}
          {...register('pointsPerWin', { required: true, valueAsNumber: true, min: 0 })}
        />
        {errors.pointsPerWin && <span className={styles.fieldError}>Informe um valor válido</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="pointsPerLoss">Pontos por derrota</label>
        <input
          id="pointsPerLoss"
          type="number"
          min={0}
          step={1}
          {...register('pointsPerLoss', { required: true, valueAsNumber: true, min: 0 })}
        />
        {errors.pointsPerLoss && <span className={styles.fieldError}>Informe um valor válido</span>}
      </div>

      {mode === 'edit' && (
        <div className={styles.field}>
          <label htmlFor="status">Status</label>
          <select id="status" {...register('status', { required: true })}>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tournamentStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      )}

      <section className={styles.arraySection}>
        <h3 className={styles.arraySectionTitle}>Apoiadores</h3>
        {sponsorsArray.fields.map((field, index) => (
          <div key={field.id} className={styles.arrayRow}>
            <input
              placeholder="Nome"
              {...register(`sponsors.${index}.name` as const, { required: true, maxLength: 100 })}
            />
            <input
              placeholder="URL do logo"
              {...register(`sponsors.${index}.logoUrl` as const, { required: true })}
            />
            <input placeholder="Link (opcional)" {...register(`sponsors.${index}.link` as const)} />
            <button
              type="button"
              className={styles.arrayRowRemove}
              onClick={() => sponsorsArray.remove(index)}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.arrayAddButton}
          onClick={() => sponsorsArray.append({ name: '', logoUrl: '', link: '' })}
        >
          Adicionar apoiador
        </button>
      </section>

      <section className={styles.arraySection}>
        <h3 className={styles.arraySectionTitle}>Premiação por colocação</h3>
        {placementRewardsRootError && (
          <p className={styles.arraySectionError}>{placementRewardsRootError}</p>
        )}
        {placementRewardsArray.fields.map((field, index) => (
          <div key={field.id} className={styles.arrayRow}>
            <input
              type="number"
              min={1}
              placeholder="Colocação"
              {...register(`placementRewards.${index}.placement` as const, {
                required: true,
                valueAsNumber: true,
                min: 1,
              })}
            />
            <input
              type="number"
              min={0}
              max={100}
              placeholder="% do pot"
              {...register(`placementRewards.${index}.potPercentage` as const, {
                required: true,
                valueAsNumber: true,
                min: 0,
                max: 100,
              })}
            />
            <input
              type="number"
              min={0}
              placeholder="Pontos bônus"
              {...register(`placementRewards.${index}.bonusPoints` as const, {
                required: true,
                valueAsNumber: true,
                min: 0,
              })}
            />
            <button
              type="button"
              className={styles.arrayRowRemove}
              onClick={() => placementRewardsArray.remove(index)}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.arrayAddButton}
          onClick={() =>
            placementRewardsArray.append({
              placement: placementRewardsArray.fields.length + 1,
              potPercentage: 0,
              bonusPoints: 0,
            })
          }
        >
          Adicionar colocação premiada
        </button>
      </section>

      <button type="submit" className={styles.submitButton} disabled={isPending || isSubmitting}>
        {isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
