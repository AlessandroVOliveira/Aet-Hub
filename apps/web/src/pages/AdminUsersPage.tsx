import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useModerateUser } from '@/hooks/useAdminUserMutations';
import { activeStatusChip, deletedStatusChip, formatDate, mutedStatusChip } from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import type { AdminUser } from '@/types/user';

function promptReason(): string | null {
  const reason = window.prompt('Motivo (mínimo 5 caracteres):');
  if (reason === null) return null;
  const trimmed = reason.trim();
  return trimmed.length >= 5 ? trimmed : null;
}

export function AdminUsersPage() {
  const { data, isLoading, isError, error } = useAdminUsers();
  const moderateUser = useModerateUser();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleToggleActive(user: AdminUser) {
    const next = !user.isActive;
    const label = next ? 'reativar' : 'banir';
    if (!window.confirm(`Confirmar: ${label} "${user.username}"?`)) return;
    const reason = promptReason();
    if (!reason) return;
    setActionError(null);
    moderateUser.mutate(
      { id: user.id, payload: { isActive: next, reason } },
      {
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  function handleToggleMuted(user: AdminUser) {
    const next = !user.isMuted;
    const label = next ? 'silenciar' : 'dessilenciar';
    if (!window.confirm(`Confirmar: ${label} "${user.username}"?`)) return;
    const reason = promptReason();
    if (!reason) return;
    setActionError(null);
    moderateUser.mutate(
      { id: user.id, payload: { isMuted: next, reason } },
      {
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  function handleToggleDeleted(user: AdminUser) {
    const next = !user.deletedAt;
    const label = next ? 'excluir' : 'restaurar';
    if (!window.confirm(`Confirmar: ${label} "${user.username}"?`)) return;
    const reason = promptReason();
    if (!reason) return;
    setActionError(null);
    moderateUser.mutate(
      { id: user.id, payload: { deleted: next, reason } },
      {
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  return (
    <div>
      <PageHeader eyebrow="STAFF_ONLY" title="USUÁRIOS" accent="ADMIN" />

      <div className="p-4 md:p-8 space-y-4">
        {actionError && <Banner variant="error">{actionError}</Banner>}

        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.users.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum usuário cadastrado ainda.</p>
        )}

        {data && data.users.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Usuário</th>
                  <th className="px-4 py-2">E-mail</th>
                  <th className="px-4 py-2">Papel</th>
                  <th className="px-4 py-2">Conta</th>
                  <th className="px-4 py-2">Chat</th>
                  <th className="px-4 py-2">Criado em</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => {
                  const deletedChip = deletedStatusChip(user.deletedAt);
                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-silver/5 ${
                        !user.isActive || user.deletedAt ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-display italic uppercase">
                        {user.username}
                        {user.profile?.displayName && (
                          <span className="block font-mono text-[10px] normal-case not-italic text-silver-muted">
                            {user.profile.displayName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-silver-muted">{user.email}</td>
                      <td className="px-4 py-3 font-mono text-xs">{user.role}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <StatusChip {...activeStatusChip(user.isActive)} />
                          {deletedChip && <StatusChip {...deletedChip} />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip {...mutedStatusChip(user.isMuted)} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-silver-muted whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Link
                            to={`/admin/usuarios/${user.id}/editar`}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            disabled={moderateUser.isPending}
                            onClick={() => handleToggleActive(user)}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase disabled:opacity-60"
                          >
                            {user.isActive ? 'Banir' : 'Reativar'}
                          </button>
                          <button
                            type="button"
                            disabled={moderateUser.isPending}
                            onClick={() => handleToggleMuted(user)}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase disabled:opacity-60"
                          >
                            {user.isMuted ? 'Dessilenciar' : 'Silenciar'}
                          </button>
                          <button
                            type="button"
                            disabled={moderateUser.isPending}
                            onClick={() => handleToggleDeleted(user)}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase disabled:opacity-60"
                          >
                            {user.deletedAt ? 'Restaurar' : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
