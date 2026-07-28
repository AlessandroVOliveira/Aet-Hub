import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateCosmeticItem, useUpdateCosmeticItem } from '@/hooks/useAdminCosmeticMutations';
import { applyIssuesToForm } from '@/utils/apply-issues-to-form';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import type {
  CosmeticItem,
  CosmeticItemFormFields,
  CreateCosmeticItemPayload,
  UpdateCosmeticItemPayload,
} from '@/types/cosmetic';

interface CosmeticFormProps {
  mode: 'create' | 'edit';
  cosmeticItem?: CosmeticItem;
}

const labelClass = 'font-mono text-[10px] text-silver-muted uppercase tracking-widest';
const inputClass =
  'mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors disabled:opacity-40';
const errorClass = 'block mt-1 text-xs font-mono text-ember';

function emptyDefaults(): CosmeticItemFormFields {
  return {
    kind: 'FRAME',
    name: '',
    description: '',
    rarity: 'COMMON',
    priceInPoints: 0,
    className: '',
    emoji: '',
    unlockAchievementCode: '',
    isActive: true,
  };
}

function toFormDefaults(item: CosmeticItem): CosmeticItemFormFields {
  return {
    kind: item.kind,
    name: item.name,
    description: item.description,
    rarity: item.rarity,
    priceInPoints: item.priceInPoints,
    className: item.className ?? '',
    emoji: item.emoji ?? '',
    unlockAchievementCode: item.unlockAchievementCode ?? '',
    isActive: item.isActive,
  };
}

export function CosmeticForm({ mode, cosmeticItem }: CosmeticFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateCosmeticItem();
  const updateMutation = useUpdateCosmeticItem(cosmeticItem?.id ?? '');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CosmeticItemFormFields>({
    defaultValues: cosmeticItem ? toFormDefaults(cosmeticItem) : emptyDefaults(),
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
    const payload = {
      kind: values.kind,
      name: values.name.trim(),
      description: values.description.trim(),
      rarity: values.rarity,
      priceInPoints: Number(values.priceInPoints),
      className: values.className?.trim() || undefined,
      emoji: values.emoji?.trim() || undefined,
      unlockAchievementCode: values.unlockAchievementCode?.trim() || undefined,
      isActive: values.isActive,
    };

    if (mode === 'create') {
      const createPayload: CreateCosmeticItemPayload = payload;
      createMutation.mutate(createPayload, {
        onSuccess: () => navigate('/admin/cosmeticos'),
        onError: (error) => {
          if (error instanceof ApiError && error.issues) {
            applyIssuesToForm(error.issues, setError);
          }
        },
      });
    } else {
      const updatePayload: UpdateCosmeticItemPayload = payload;
      updateMutation.mutate(updatePayload, {
        onSuccess: () => navigate('/admin/cosmeticos'),
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
        {mode === 'create' ? 'Novo cosmético' : 'Editar cosmético'}
      </h2>

      {generalError && <Banner variant="error">{generalError}</Banner>}

      <div>
        <label htmlFor="kind" className={labelClass}>
          Categoria
        </label>
        <select id="kind" className={inputClass} {...register('kind')}>
          <option value="FRAME">Borda</option>
          <option value="BANNER">Banner</option>
          <option value="TITLE">Título</option>
          <option value="FONT">Fonte</option>
          <option value="EFFECT">Efeito</option>
          <option value="MASCOT">Mascote</option>
        </select>
        <p className="mt-1 text-xs text-silver-muted">
          Borda, Título, Fonte e Mascote já têm telas de compra/equipar. Banner e Efeito
          aguardam fatias futuras.
        </p>
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
        {errors.name && <span className={errorClass}>Informe o nome do cosmético</span>}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descrição
        </label>
        <textarea
          id="description"
          rows={2}
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
          <option value="RARE">Raro</option>
          <option value="EPIC">Épico</option>
          <option value="LEGENDARY">Lendário</option>
        </select>
      </div>

      <div>
        <label htmlFor="priceInPoints" className={labelClass}>
          Preço em pontos
        </label>
        <input
          id="priceInPoints"
          type="number"
          min={0}
          className={inputClass}
          {...register('priceInPoints', { required: true, min: 0, valueAsNumber: true })}
        />
        {errors.priceInPoints && (
          <span className={errorClass}>Preço não pode ser negativo</span>
        )}
        <p className="mt-1 text-xs text-silver-muted">
          0 = item grátis padrão (a menos que tenha código de conquista abaixo).
        </p>
      </div>

      <div>
        <label htmlFor="className" className={labelClass}>
          Classes visuais (Tailwind)
        </label>
        <input
          id="className"
          className={inputClass}
          placeholder="ex.: ring-2 ring-ember animate-ember-glow"
          {...register('className', { maxLength: 200 })}
        />
      </div>

      <div>
        <label htmlFor="emoji" className={labelClass}>
          Emoji (mascotes)
        </label>
        <input
          id="emoji"
          className={inputClass}
          placeholder="ex.: 🐺"
          {...register('emoji', { maxLength: 16 })}
        />
        <p className="mt-1 text-xs text-silver-muted">
          Só usado por itens da categoria Mascote — sprite renderizado sobre o avatar.
        </p>
      </div>

      <div>
        <label htmlFor="unlockAchievementCode" className={labelClass}>
          Código de conquista (opcional)
        </label>
        <input
          id="unlockAchievementCode"
          className={inputClass}
          placeholder="ex.: FIRST_WIN"
          {...register('unlockAchievementCode', { maxLength: 60 })}
        />
        <p className="mt-1 text-xs text-silver-muted">
          Se preenchido, o item só é desbloqueado ao conquistar esse código — não fica
          comprável com pontos.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" {...register('isActive')} />
        <label htmlFor="isActive" className="text-sm text-silver-muted">
          Item ativo (aparece no armário cosmético dos players)
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
