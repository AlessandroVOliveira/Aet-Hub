import { Link } from 'react-router-dom';
import { useCommunities } from '@/hooks/useCommunities';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';

export function CommunitiesPage() {
  const { data, isLoading, isError, error } = useCommunities();

  return (
    <div>
      <PageHeader
        eyebrow="FEED_REGIONAL"
        title="COMUNIDADE"
        accent="AET"
        description="A voz da fronteira competitiva. Poste, comente, encontre time."
      />

      <div className="p-4 md:p-8">
        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.communities.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhuma comunidade disponível ainda.</p>
        )}

        {data && data.communities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.communities.map((community) => (
              <Link
                key={community.id}
                to={`/comunidade/${community.id}`}
                className="group bg-navy-light ring-1 ring-silver/10 hover:ring-ember/50 transition overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video bg-navy-dark overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-ember/40 via-navy-dark to-navy-light" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-6xl italic tracking-tighter text-silver/20">
                      {(community.game?.slug ?? community.name).slice(0, 4).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-mono text-[10px] text-silver-muted mb-1">
                    {community.game?.name ?? 'Geral'}
                  </p>
                  <h3 className="font-display text-xl uppercase italic tracking-tight mb-2 group-hover:text-ember transition">
                    {community.name}
                  </h3>
                  <p className="text-sm text-silver-muted line-clamp-2 flex-1">
                    {community.description}
                  </p>
                  <p className="font-mono text-[10px] text-silver-muted mt-3">
                    {community.postCount} {community.postCount === 1 ? 'post' : 'posts'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
