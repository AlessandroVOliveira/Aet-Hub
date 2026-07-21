import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCreateStoreItem, useUpdateStoreItem } from '@/hooks/useAdminStoreItemMutations';
import { applyIssuesToForm } from '@/utils/apply-issues-to-form';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import type { CreateStoreItemPayload, StoreItem, UpdateStoreItemPayload } from '@/types/store';

interface StoreItemFormValues {
  name: string;
  description: string;
  costInCoins: number;
  stockUnlimited: boolean;
  stock: number;
  imageUrl: string;
  partnerName: string;
  isActive: boolean;
}

interface StoreItemFormProps {
  mode: 'create' | 'edit';
  item?: StoreItem;
}

const labelClass = 'font-mono text-[10px] text-silver-muted uppercase tracking-widest';
const inputClass =
  'mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors disabled:opacity-40';
const errorClass = 'block mt-1 text-xs font-mono text-ember';

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function emptyDefaults(): StoreItemFormValues {
  return {
    name: '',
    description: '',
    costInCoins: 0,
    stockUnlimited: true,
    stock: 0,
    imageUrl: '',
    partnerName: '',
    isActive: true,
  };
}

function toFormDefaults(item: StoreItem): StoreItemFormValues {
  return {
    name: item.name,
    description: item.description,
    costInCoins: item.costInCoins,
    stockUnlimited: item.stock === null,
    stock: item.stock ?? 0,
    imageUrl: item.imageUrl ?? '',
    partnerName: item.partnerName ?? '',
    isActive: item.isActive,
  };
}

function toSubmitFields(values: StoreItemFormValues): CreateStoreItemPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    costInCoins: values.costInCoins,
    stock: values.stockUnlimited ? null : Number(values.stock),
    imageUrl: values.imageUrl.trim() ? values.imageUrl.trim() : undefined,
    partnerName: values.partnerName.trim() ? values.partnerName.trim() : undefined,
    isActive: values.isActive,
  };
}

export function StoreItemForm({ mode, item }: StoreItemFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateStoreItem();
  const updateMutation = useUpdateStoreItem(item?.id ?? '');

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StoreItemFormValues>({
    defaultValues: item ? toFormDefaults(item) : emptyDefaults(),
  });

  const stockUnlimited = useWatch({ control, name: 'stockUnlimited' });
  const isPending = mode === 'create' ? createMutation.isPending : updateMutation.isPending;

  const generalError =
    (createMutation.isError && createMutation.error instanceof ApiError && !createMutation.error.issues
      ? createMutation.error.message
      : null) ??
    (updateMutation.isError && updateMutation.error instanceof ApiError && !updateMutation.error.issues
      ? updateMutation.error.message
      : null);

  const onSubmit = handleSubmit((values) => {
    const payload: CreateStoreItemPayload = toSubmitFields(values);

    if (mode === 'create') {
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/admin/loja'),
        onError: (error) => {
          if (error instanceof ApiError && error.issues) {
            applyIssuesToForm(error.issues, setError);
          }
        },
      });
    } else {
      const updatePayload: UpdateStoreItemPayload = payload;
      updateMutation.mutate(updatePayload, {
        onSuccess: () => navigate('/admin/loja'),
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
        {mode === 'create' ? 'Novo item' : 'Editar item'}
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
        {errors.name && <span className={errorClass}>Informe o nome do item</span>}
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
        <label htmlFor="costInCoins" className={labelClass}>
          Custo (pontos)
        </label>
        <input
          id="costInCoins"
          type="number"
          min={1}
          step={1}
          className={inputClass}
          {...register('costInCoins', {
            required: true,
            valueAsNumber: true,
            min: 1,
            validate: (value) => Number.isInteger(value) || 'Custo precisa ser um número inteiro',
          })}
        />
        {errors.costInCoins && (
          <span className={errorClass}>{errors.costInCoins.message ?? 'Custo precisa ser maior que zero'}</span>
        )}
      </div>

      <div>
        <label className={labelClass}>Estoque</label>
        <div className="mt-1 flex items-center gap-2">
          <input id="stockUnlimited" type="checkbox" {...register('stockUnlimited')} />
          <label htmlFor="stockUnlimited" className="text-sm text-silver-muted">
            Estoque ilimitado
          </label>
        </div>
        {!stockUnlimited && (
          <input
            id="stock"
            type="number"
            min={0}
            step={1}
            className={`${inputClass} mt-2`}
            {...register('stock', {
              valueAsNumber: true,
              min: 0,
              validate: (value) =>
                stockUnlimited || Number.isInteger(value) || 'Estoque não pode ser negativo',
            })}
          />
        )}
        {errors.stock && <span className={errorClass}>Estoque não pode ser negativo</span>}
      </div>

      <div>
        <label htmlFor="imageUrl" className={labelClass}>
          URL da imagem (opcional)
        </label>
        <input
          id="imageUrl"
          className={inputClass}
          {...register('imageUrl', {
            validate: (value) => !value.trim() || isValidUrl(value.trim()) || 'URL da imagem inválida',
          })}
        />
        {errors.imageUrl && <span className={errorClass}>{errors.imageUrl.message}</span>}
      </div>

      <div>
        <label htmlFor="partnerName" className={labelClass}>
          Parceiro (opcional)
        </label>
        <input
          id="partnerName"
          className={inputClass}
          {...register('partnerName', { maxLength: 120 })}
        />
        {errors.partnerName && <span className={errorClass}>Máximo de 120 caracteres</span>}
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" {...register('isActive')} />
        <label htmlFor="isActive" className="text-sm text-silver-muted">
          Item ativo (visível na loja)
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
