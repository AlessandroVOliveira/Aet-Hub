import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateGame, useUpdateGame } from '@/hooks/useAdminGameMutations';
import { applyIssuesToForm } from '@/utils/apply-issues-to-form';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import type { CreateGamePayload, Game, UpdateGamePayload } from '@/types/game';

interface GameFormValues {
  name: string;
  isActive: boolean;
}

interface GameFormProps {
  mode: 'create' | 'edit';
  game?: Game;
}

const labelClass = 'font-mono text-[10px] text-silver-muted uppercase tracking-widest';
const inputClass =
  'mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors disabled:opacity-40';
const errorClass = 'block mt-1 text-xs font-mono text-ember';

function emptyDefaults(): GameFormValues {
  return { name: '', isActive: true };
}

function toFormDefaults(game: Game): GameFormValues {
  return { name: game.name, isActive: game.isActive };
}

export function GameForm({ mode, game }: GameFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateGame();
  const updateMutation = useUpdateGame(game?.id ?? '');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GameFormValues>({
    defaultValues: game ? toFormDefaults(game) : emptyDefaults(),
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
    const payload = { name: values.name.trim(), isActive: values.isActive };

    if (mode === 'create') {
      const createPayload: CreateGamePayload = payload;
      createMutation.mutate(createPayload, {
        onSuccess: () => navigate('/admin/jogos'),
        onError: (error) => {
          if (error instanceof ApiError && error.issues) {
            applyIssuesToForm(error.issues, setError);
          }
        },
      });
    } else {
      const updatePayload: UpdateGamePayload = payload;
      updateMutation.mutate(updatePayload, {
        onSuccess: () => navigate('/admin/jogos'),
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
        {mode === 'create' ? 'Novo jogo' : 'Editar jogo'}
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
        {errors.name && <span className={errorClass}>Informe o nome do jogo</span>}
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" {...register('isActive')} />
        <label htmlFor="isActive" className="text-sm text-silver-muted">
          Jogo ativo (selecionável em torneios, comunidades e perfil)
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
