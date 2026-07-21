import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUpdateProfile } from '@/hooks/useProfileMutations';
import { ApiError } from '@/services/http';
import { Field } from '@/components/ui/Field';
import { Banner } from '@/components/ui/Banner';
import { Panel } from '@/components/ui/Panel';
import type { UserProfile } from '@/types/auth';
import type { UpdateProfilePayload } from '@/types/profile';
import type { Game } from '@/types/game';

interface ProfileFormValues {
  displayName: string;
  avatarUrl: string;
  bio: string;
  favoriteGameId: string;
  favoriteCharacter: string;
  theme: string;
}

type FieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

interface ProfileFormProps {
  profile: UserProfile;
  games: Game[];
}

const labelClass = 'font-mono text-[10px] text-silver-muted uppercase tracking-widest';
const inputClass =
  'mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors';
const errorClass = 'block mt-1 text-xs font-mono text-ember';

function toFormValues(profile: UserProfile): ProfileFormValues {
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? '',
    bio: profile.bio ?? '',
    favoriteGameId: profile.favoriteGameId ?? '',
    favoriteCharacter: profile.favoriteCharacter ?? '',
    theme: profile.theme ?? '',
  };
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateProfileForm(values: ProfileFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (values.displayName.trim().length < 2 || values.displayName.trim().length > 60) {
    errors.displayName = 'Deve ter entre 2 e 60 caracteres';
  }
  if (values.avatarUrl && !isValidUrl(values.avatarUrl)) {
    errors.avatarUrl = 'URL do avatar inválida';
  }
  if (values.bio.length > 500) {
    errors.bio = 'Máximo de 500 caracteres';
  }
  if (values.favoriteCharacter.length > 60) {
    errors.favoriteCharacter = 'Máximo de 60 caracteres';
  }
  if (values.theme.length > 30) {
    errors.theme = 'Máximo de 30 caracteres';
  }

  return errors;
}

function toPayload(values: ProfileFormValues): UpdateProfilePayload {
  return {
    displayName: values.displayName.trim(),
    avatarUrl: values.avatarUrl.trim() || null,
    bio: values.bio.trim() || null,
    favoriteGameId: values.favoriteGameId || null,
    favoriteCharacter: values.favoriteCharacter.trim() || null,
    theme: values.theme.trim() || null,
  };
}

export function ProfileForm({ profile, games }: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>(() => toFormValues(profile));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();

  function updateField<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validateProfileForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    updateProfile.mutate(toPayload(values), {
      onSuccess: () => {
        navigate('/perfil', { state: { updated: true } });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.issues) {
          const mapped: FieldErrors = {};
          for (const issue of error.issues) {
            const key = issue.path[0] as keyof ProfileFormValues;
            mapped[key] = issue.message;
          }
          setFieldErrors(mapped);
        }
      },
    });
  }

  const generalError =
    updateProfile.isError && updateProfile.error instanceof ApiError && !updateProfile.error.issues
      ? updateProfile.error.message
      : null;

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      {generalError && <Banner variant="error">{generalError}</Banner>}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Panel title="Dados básicos">
          <div className="space-y-4">
            <Field
              label="NOME DE EXIBIÇÃO"
              id="displayName"
              value={values.displayName}
              onChange={(event) => updateField('displayName', event.target.value)}
              error={fieldErrors.displayName}
            />

            <Field
              label="URL DO AVATAR (OPCIONAL)"
              id="avatarUrl"
              type="url"
              value={values.avatarUrl}
              onChange={(event) => updateField('avatarUrl', event.target.value)}
              error={fieldErrors.avatarUrl}
            />

            <div>
              <label htmlFor="bio" className={labelClass}>
                BIO (OPCIONAL)
              </label>
              <textarea
                id="bio"
                rows={4}
                className={inputClass}
                value={values.bio}
                onChange={(event) => updateField('bio', event.target.value)}
              />
              {fieldErrors.bio && <span className={errorClass}>{fieldErrors.bio}</span>}
            </div>
          </div>
        </Panel>

        <Panel title="Preferências">
          <div className="space-y-4">
            <div>
              <label htmlFor="favoriteGameId" className={labelClass}>
                JOGO FAVORITO (OPCIONAL)
              </label>
              <select
                id="favoriteGameId"
                className={inputClass}
                value={values.favoriteGameId}
                onChange={(event) => updateField('favoriteGameId', event.target.value)}
              >
                <option value="">Nenhum</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
              {fieldErrors.favoriteGameId && (
                <span className={errorClass}>{fieldErrors.favoriteGameId}</span>
              )}
            </div>

            <Field
              label="PERSONAGEM FAVORITO (OPCIONAL)"
              id="favoriteCharacter"
              value={values.favoriteCharacter}
              onChange={(event) => updateField('favoriteCharacter', event.target.value)}
              error={fieldErrors.favoriteCharacter}
            />

            <Field
              label="TEMA (OPCIONAL)"
              id="theme"
              value={values.theme}
              onChange={(event) => updateField('theme', event.target.value)}
              error={fieldErrors.theme}
            />
          </div>
        </Panel>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display px-6 py-3 tracking-widest uppercase italic transition-colors"
          >
            {updateProfile.isPending ? 'Salvando...' : 'Salvar perfil'}
          </button>
          <Link
            to="/perfil"
            className="font-mono text-[10px] uppercase tracking-widest text-silver-muted hover:text-ember transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
