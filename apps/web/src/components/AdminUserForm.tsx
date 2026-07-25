import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUpdateUserByAdmin } from '@/hooks/useAdminUserMutations';
import { useGames } from '@/hooks/useGames';
import { ApiError } from '@/services/http';
import { Field } from '@/components/ui/Field';
import { Banner } from '@/components/ui/Banner';
import { Panel } from '@/components/ui/Panel';
import type { AdminUpdateUserPayload, AdminUser } from '@/types/user';

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

interface AdminUserFormValues {
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  favoriteGameId: string;
  favoriteCharacter: string;
  theme: string;
  reason: string;
}

type FieldErrors = Partial<Record<keyof AdminUserFormValues, string>>;

interface AdminUserFormProps {
  user: AdminUser;
}

const labelClass = 'font-mono text-[10px] text-silver-muted uppercase tracking-widest';
const inputClass =
  'mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors';
const errorClass = 'block mt-1 text-xs font-mono text-ember';

function toFormValues(user: AdminUser): AdminUserFormValues {
  return {
    username: user.username,
    email: user.email,
    displayName: user.profile?.displayName ?? '',
    avatarUrl: user.profile?.avatarUrl ?? '',
    bio: user.profile?.bio ?? '',
    favoriteGameId: user.profile?.favoriteGameId ?? '',
    favoriteCharacter: user.profile?.favoriteCharacter ?? '',
    theme: user.profile?.theme ?? '',
    reason: '',
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

function validateAdminUserForm(values: AdminUserFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (values.username.trim().length < 3 || values.username.trim().length > 30) {
    errors.username = 'Deve ter entre 3 e 30 caracteres';
  } else if (!/^[a-zA-Z0-9_]+$/.test(values.username.trim())) {
    errors.username = 'Só letras, números e underscore';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'E-mail inválido';
  }
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
  if (values.reason.trim().length < MIN_REASON_LENGTH) {
    errors.reason = `Descreva o motivo com pelo menos ${MIN_REASON_LENGTH} caracteres`;
  }

  return errors;
}

function toPayload(values: AdminUserFormValues, original: AdminUser): AdminUpdateUserPayload {
  const payload: AdminUpdateUserPayload = { reason: values.reason.trim() };

  if (values.username.trim() !== original.username) payload.username = values.username.trim();
  if (values.email.trim() !== original.email) payload.email = values.email.trim();

  const displayName = values.displayName.trim();
  if (displayName !== (original.profile?.displayName ?? '')) payload.displayName = displayName;

  const avatarUrl = values.avatarUrl.trim() || null;
  if (avatarUrl !== (original.profile?.avatarUrl ?? null)) payload.avatarUrl = avatarUrl;

  const bio = values.bio.trim() || null;
  if (bio !== (original.profile?.bio ?? null)) payload.bio = bio;

  const favoriteGameId = values.favoriteGameId || null;
  if (favoriteGameId !== (original.profile?.favoriteGameId ?? null)) {
    payload.favoriteGameId = favoriteGameId;
  }

  const favoriteCharacter = values.favoriteCharacter.trim() || null;
  if (favoriteCharacter !== (original.profile?.favoriteCharacter ?? null)) {
    payload.favoriteCharacter = favoriteCharacter;
  }

  const theme = values.theme.trim() || null;
  if (theme !== (original.profile?.theme ?? null)) payload.theme = theme;

  return payload;
}

export function AdminUserForm({ user }: AdminUserFormProps) {
  const [values, setValues] = useState<AdminUserFormValues>(() => toFormValues(user));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();
  const { data: gamesData } = useGames();
  const updateUser = useUpdateUserByAdmin(user.id);

  function updateField<K extends keyof AdminUserFormValues>(key: K, value: AdminUserFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validateAdminUserForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    updateUser.mutate(toPayload(values, user), {
      onSuccess: () => {
        navigate('/admin/usuarios');
      },
      onError: (error) => {
        if (error instanceof ApiError && error.issues) {
          const mapped: FieldErrors = {};
          for (const issue of error.issues) {
            const key = issue.path[0] as keyof AdminUserFormValues;
            mapped[key] = issue.message;
          }
          setFieldErrors(mapped);
        }
      },
    });
  }

  const generalError =
    updateUser.isError && updateUser.error instanceof ApiError && !updateUser.error.issues
      ? updateUser.error.message
      : null;

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <h2 className="font-display text-3xl uppercase italic tracking-tight">Editar usuário</h2>

      {generalError && <Banner variant="error">{generalError}</Banner>}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Panel title="Conta">
          <div className="space-y-4">
            <Field
              label="NOME DE USUÁRIO"
              id="username"
              value={values.username}
              onChange={(event) => updateField('username', event.target.value)}
              error={fieldErrors.username}
            />
            <Field
              label="E-MAIL"
              id="email"
              type="email"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              error={fieldErrors.email}
            />
          </div>
        </Panel>

        <Panel title="Perfil">
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
                {gamesData?.games.map((game) => (
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

        <Panel title="Motivo da alteração">
          <div>
            <textarea
              id="reason"
              rows={3}
              maxLength={MAX_REASON_LENGTH}
              placeholder="Descreva o motivo do ajuste/correção..."
              className={inputClass}
              value={values.reason}
              onChange={(event) => updateField('reason', event.target.value)}
            />
            <div className="mt-1 flex items-center justify-between">
              {fieldErrors.reason ? (
                <span className={errorClass}>{fieldErrors.reason}</span>
              ) : (
                <span />
              )}
              <span className="font-mono text-[10px] text-silver-muted">
                {values.reason.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
          </div>
        </Panel>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateUser.isPending}
            className="bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display px-6 py-3 tracking-widest uppercase italic transition-colors"
          >
            {updateUser.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <Link
            to="/admin/usuarios"
            className="font-mono text-[10px] uppercase tracking-widest text-silver-muted hover:text-ember transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
