import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateCommunity, useUpdateCommunity } from '@/hooks/useAdminCommunityMutations';
import { applyIssuesToForm } from '@/utils/apply-issues-to-form';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import type { Community, CreateCommunityPayload, UpdateCommunityPayload } from '@/types/community';
import type { Game } from '@/types/game';

interface CommunityFormValues {
  name: string;
  description: string;
  gameId: string;
  isActive: boolean;
}

interface CommunityFormProps {
  mode: 'create' | 'edit';
  community?: Community;
  games: Game[];
}

const labelClass = 'font-mono text-[10px] text-silver-muted uppercase tracking-widest';
const inputClass =
  'mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors disabled:opacity-40';
const errorClass = 'block mt-1 text-xs font-mono text-ember';

function emptyDefaults(): CommunityFormValues {
  return { name: '', description: '', gameId: '', isActive: true };
}

function toFormDefaults(community: Community): CommunityFormValues {
  return {
    name: community.name,
    description: community.description,
    gameId: community.gameId ?? '',
    isActive: community.isActive,
  };
}

function toSubmitFields(values: CommunityFormValues): CreateCommunityPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    gameId: values.gameId || null,
    isActive: values.isActive,
  };
}

export function CommunityForm({ mode, community, games }: CommunityFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateCommunity();
  const updateMutation = useUpdateCommunity(community?.id ?? '');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CommunityFormValues>({
    defaultValues: community ? toFormDefaults(community) : emptyDefaults(),
  });

  const isPending = mode === 'create' ? createMutation.isPending : updateMutation.isPending;

  const generalError =
    (createMutation.isError && createMutation.error instanceof ApiError && !createMutation.error.issues
      ? createMutation.error.message
      : null) ??
    (updateMutation.isError && updateMutation.error instanceof ApiError && !updateMutation.error.issues
      ? updateMutation.error.message
      : null);

  const onSubmit = handleSubmit((values) => {
    const payload: CreateCommunityPayload = toSubmitFields(values);

    if (mode === 'create') {
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/admin/comunidades'),
        onError: (error) => {
          if (error instanceof ApiError && error.issues) {
            applyIssuesToForm(error.issues, setError);
          }
        },
      });
    } else {
      const updatePayload: UpdateCommunityPayload = payload;
      updateMutation.mutate(updatePayload, {
        onSuccess: () => navigate('/admin/comunidades'),
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
        {mode === 'create' ? 'Nova comunidade' : 'Editar comunidade'}
      </h2>

      {generalError && <Banner variant="error">{generalError}</Banner>}

      <div>
        <label htmlFor="name" className={labelClass}>
          Nome
        </label>
        <input
          id="name"
          className={inputClass}
          {...register('name', { required: true, minLength: 1, maxLength: 120 })}
        />
        {errors.name && <span className={errorClass}>Informe o nome da comunidade</span>}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descrição
        </label>
        <textarea
          id="description"
          rows={4}
          className={inputClass}
          {...register('description', { required: true, minLength: 1, maxLength: 2000 })}
        />
        {errors.description && <span className={errorClass}>Informe a descrição</span>}
      </div>

      <div>
        <label htmlFor="gameId" className={labelClass}>
          Jogo (opcional)
        </label>
        <select id="gameId" className={inputClass} {...register('gameId')}>
          <option value="">Sem jogo (assunto geral)</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" {...register('isActive')} />
        <label htmlFor="isActive" className="text-sm text-silver-muted">
          Comunidade ativa (visível pros players)
        </label>
      </div>

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
