import { useAuth } from '@/hooks/useAuth';

export function HomePage() {
  const { user } = useAuth();

  return (
    <section>
      <h2>Bem-vindo, {user?.displayName ?? user?.username}</h2>
      <p>Torneios, inscrição e chaveamento chegam nas próximas fatias.</p>
    </section>
  );
}
