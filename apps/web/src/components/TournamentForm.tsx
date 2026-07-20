import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateTournament, useUpdateTournament } from '@/hooks/useAdminTournamentMutations';
import { validateTournamentCrossFields } from '@/utils/validate-tournament-form';
import { applyIssuesToForm } from '@/utils/apply-issues-to-form';
import { bracketTypeLabels, tiebreakerRuleLabels, tournamentStatusLabels } from '@/utils/format';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
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

const labelClass = 'font-mono text-[10px] text-silver-muted uppercase tracking-widest';
const inputClass =
  'mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors';
const errorClass = 'block mt-1 text-xs font-mono text-ember';

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
    <form onSubmit={onSubmit} className="p-4 md:p-8 max-w-2xl space-y-4">
      <h2 className="font-display text-3xl uppercase italic tracking-tight">
        {mode === 'create' ? 'Novo torneio' : 'Editar torneio'}
      </h2>

      {generalError && <Banner variant="error">{generalError}</Banner>}

      <div>
        <label htmlFor="name" className={labelClass}>
          Nome
        </label>
        <input
          id="name"
          className={inputClass}
          {...register('name', { required: true, minLength: 3, maxLength: 120 })}
        />
        {errors.name && <span className={errorClass}>Informe um nome de 3 a 120 caracteres</span>}
      </div>

      <div>
        <label htmlFor="gameId" className={labelClass}>
          Jogo
        </label>
        <select id="gameId" className={inputClass} {...register('gameId', { required: true })}>
          <option value="">Selecione...</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        {errors.gameId && <span className={errorClass}>Selecione um jogo</span>}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descrição (opcional)
        </label>
        <textarea
          id="description"
          rows={4}
          className={inputClass}
          {...register('description', { maxLength: 2000 })}
        />
        {errors.description && <span className={errorClass}>Máximo de 2000 caracteres</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="registrationStartAt" className={labelClass}>
            Início das inscrições
          </label>
          <input
            id="registrationStartAt"
            type="datetime-local"
            className={inputClass}
            {...register('registrationStartAt', { required: true })}
          />
          {errors.registrationStartAt && <span className={errorClass}>Campo obrigatório</span>}
        </div>

        <div>
          <label htmlFor="registrationEndAt" className={labelClass}>
            Fim das inscrições
          </label>
          <input
            id="registrationEndAt"
            type="datetime-local"
            className={inputClass}
            {...register('registrationEndAt', { required: true })}
          />
          {errors.registrationEndAt && (
            <span className={errorClass}>
              {errors.registrationEndAt.message ?? 'Campo obrigatório'}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="checkinDeadlineAt" className={labelClass}>
            Prazo de check-in
          </label>
          <input
            id="checkinDeadlineAt"
            type="datetime-local"
            className={inputClass}
            {...register('checkinDeadlineAt', { required: true })}
          />
          {errors.checkinDeadlineAt && (
            <span className={errorClass}>
              {errors.checkinDeadlineAt.message ?? 'Campo obrigatório'}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="eventStartAt" className={labelClass}>
            Início do evento
          </label>
          <input
            id="eventStartAt"
            type="datetime-local"
            className={inputClass}
            {...register('eventStartAt', { required: true })}
          />
          {errors.eventStartAt && (
            <span className={errorClass}>{errors.eventStartAt.message ?? 'Campo obrigatório'}</span>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="entryFeeCents" className={labelClass}>
          Taxa de inscrição (centavos)
        </label>
        <input
          id="entryFeeCents"
          type="number"
          min={0}
          step={1}
          className={inputClass}
          {...register('entryFeeCents', { required: true, valueAsNumber: true, min: 0 })}
        />
        {errors.entryFeeCents && (
          <span className={errorClass}>Informe um valor válido (0 = gratuito)</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bracketType" className={labelClass}>
            Formato de chave
          </label>
          <select
            id="bracketType"
            className={inputClass}
            {...register('bracketType', { required: true })}
          >
            {BRACKET_TYPES.map((type) => (
              <option key={type} value={type}>
                {bracketTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tiebreakerRule" className={labelClass}>
            Critério de desempate (opcional)
          </label>
          <select id="tiebreakerRule" className={inputClass} {...register('tiebreakerRule')}>
            <option value="">Nenhum</option>
            {TIEBREAKER_RULES.map((rule) => (
              <option key={rule} value={rule}>
                {tiebreakerRuleLabels[rule]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pointsPerWin" className={labelClass}>
            Pontos por vitória
          </label>
          <input
            id="pointsPerWin"
            type="number"
            min={0}
            step={1}
            className={inputClass}
            {...register('pointsPerWin', { required: true, valueAsNumber: true, min: 0 })}
          />
          {errors.pointsPerWin && <span className={errorClass}>Informe um valor válido</span>}
        </div>

        <div>
          <label htmlFor="pointsPerLoss" className={labelClass}>
            Pontos por derrota
          </label>
          <input
            id="pointsPerLoss"
            type="number"
            min={0}
            step={1}
            className={inputClass}
            {...register('pointsPerLoss', { required: true, valueAsNumber: true, min: 0 })}
          />
          {errors.pointsPerLoss && <span className={errorClass}>Informe um valor válido</span>}
        </div>
      </div>

      {mode === 'edit' && (
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select id="status" className={inputClass} {...register('status', { required: true })}>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tournamentStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      )}

      <section className="bg-navy-light ring-1 ring-silver/10 p-4 space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
          Apoiadores
        </h3>
        {sponsorsArray.fields.map((field, index) => (
          <div key={field.id} className="flex flex-wrap gap-2 items-center">
            <input
              placeholder="Nome"
              className={`${inputClass} flex-1 min-w-32`}
              {...register(`sponsors.${index}.name` as const, { required: true, maxLength: 100 })}
            />
            <input
              placeholder="URL do logo"
              className={`${inputClass} flex-1 min-w-32`}
              {...register(`sponsors.${index}.logoUrl` as const, { required: true })}
            />
            <input
              placeholder="Link (opcional)"
              className={`${inputClass} flex-1 min-w-32`}
              {...register(`sponsors.${index}.link` as const)}
            />
            <button
              type="button"
              onClick={() => sponsorsArray.remove(index)}
              className="px-3 py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase transition"
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => sponsorsArray.append({ name: '', logoUrl: '', link: '' })}
          className="px-3 py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase transition"
        >
          Adicionar apoiador
        </button>
      </section>

      <section className="bg-navy-light ring-1 ring-silver/10 p-4 space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
          Premiação por colocação
        </h3>
        {placementRewardsRootError && <Banner variant="error">{placementRewardsRootError}</Banner>}
        {placementRewardsArray.fields.map((field, index) => (
          <div key={field.id} className="flex flex-wrap gap-2 items-center">
            <input
              type="number"
              min={1}
              placeholder="Colocação"
              className={`${inputClass} w-28`}
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
              className={`${inputClass} w-28`}
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
              className={`${inputClass} w-32`}
              {...register(`placementRewards.${index}.bonusPoints` as const, {
                required: true,
                valueAsNumber: true,
                min: 0,
              })}
            />
            <button
              type="button"
              onClick={() => placementRewardsArray.remove(index)}
              className="px-3 py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase transition"
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            placementRewardsArray.append({
              placement: placementRewardsArray.fields.length + 1,
              potPercentage: 0,
              bonusPoints: 0,
            })
          }
          className="px-3 py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase transition"
        >
          Adicionar colocação premiada
        </button>
      </section>

      <button
        type="submit"
        disabled={isPending || isSubmitting}
        className="w-full bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display py-3 tracking-widest uppercase italic transition-colors"
      >
        {isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
