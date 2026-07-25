import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateAchievement, useUpdateAchievement } from '@/hooks/useAdminAchievementMutations';
import { applyIssuesToForm } from '@/utils/apply-issues-to-form';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import type {
  Achievement,
  AchievementRarity,
  CreateAchievementPayload,
  UpdateAchievementPayload,
} from '@/types/achievement';

interface AchievementFormValues {
  code: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  isActive: boolean;
}

interface AchievementFormProps {
  mode: 'create' | 'edit';
  achievement?: Achievement;
}

const labelClass = 'font-mono text-[10px] text-silver-muted uppercase tracking-widest';
const inputClass =
  'mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors disabled:opacity-40';
const errorClass = 'block mt-1 text-xs font-mono text-ember';

function emptyDefaults(): AchievementFormValues {
  return { code: '', name: '', description: '', rarity: 'COMMON', isActive: true };
}

function toFormDefaults(achievement: Achievement): AchievementFormValues {
  return {
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    rarity: achievement.rarity,
    isActive: achievement.isActive,
  };
}

export function AchievementForm({ mode, achievement }: AchievementFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateAchievement();
  const updateMutation = useUpdateAchievement(achievement?.id ?? '');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AchievementFormValues>({
    defaultValues: achievement ? toFormDefaults(achievement) : emptyDefaults(),
  });

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

  const onSubmit = handleSubmit((values) => {
    if (mode === 'create') {
      const createPayload: CreateAchievementPayload = {
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description.trim(),
        rarity: values.rarity,
        isActive: values.isActive,
      };
      createMutation.mutate(createPayload, {
        onSuccess: () => navigate('/admin/conquistas'),
        onError: (error) => {
          if (error instanceof ApiError && error.issues) {
            applyIssuesToForm(error.issues, setError);
          }
        },
      });
    } else {
      const updatePayload: UpdateAchievementPayload = {
        name: values.name.trim(),
        description: values.description.trim(),
        rarity: values.rarity,
        isActive: values.isActive,
      };
      updateMutation.mutate(updatePayload, {
        onSuccess: () => navigate('/admin/conquistas'),
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
        {mode === 'create' ? 'Nova conquista' : 'Editar conquista'}
      </h2>

      {generalError && <Banner variant="error">{generalError}</Banner>}

      <div>
        <label htmlFor="code" className={labelClass}>
          Código
        </label>
        <input
          id="code"
          disabled={mode === 'edit'}
          className={inputClass}
          {...register('code', { required: mode === 'create', minLength: 1, maxLength: 60 })}
        />
        {errors.code && <span className={errorClass}>Informe o código da conquista</span>}
        {mode === 'edit' && (
          <p className="mt-1 text-xs text-silver-muted">
            Código imutável — é a chave usada pelo sistema pra saber quando desbloquear.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          Nome
        </label>
        <input
          id="name"
          className={inputClass}
          {...register('name', { required: true, minLength: 1, maxLength: 120 })}
        />
        {errors.name && <span className={errorClass}>Informe o nome da conquista</span>}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descrição
        </label>
        <textarea
          id="description"
          rows={3}
          className={inputClass}
          {...register('description', { required: true, minLength: 1, maxLength: 300 })}
        />
        {errors.description && <span className={errorClass}>Informe a descrição</span>}
      </div>

      <div>
        <label htmlFor="rarity" className={labelClass}>
          Raridade
        </label>
        <select id="rarity" className={inputClass} {...register('rarity')}>
          <option value="COMMON">Comum</option>
          <option value="RARE">Rara</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" {...register('isActive')} />
        <label htmlFor="isActive" className="text-sm text-silver-muted">
          Conquista ativa (pode ser desbloqueada e aparece no perfil)
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
