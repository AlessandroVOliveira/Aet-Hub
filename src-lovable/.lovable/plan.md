ns: Planejamento de telas — AET Hub (apenas frontend, dados mockados)

Escopo: montar todas as telas do sistema com dados fake em memória, mantendo a identidade visual já definida (paleta navy + ember, tipografia Anton/JetBrains Mono/Inter, estética arcade/terminal). Nenhum backend, nenhuma persistência real — os formulários apenas simulam ação e navegam.

## Fundamentos compartilhados

- **Layout base**: `__root.tsx` já com shell. Criar `components/layout/AppShell.tsx` com header fixo (logo AET, pontos, avatar) e um `SideNav` colapsável no desktop / bottom tab no mobile.
- **Design tokens**: reaproveitar `navy-dark`, `navy-light`, `silver`, `ember`, `ember-glow`. Adicionar utilitários para chips de status (LIVE, EM BREVE, ENCERRADO), badges de jogo e cards de bracket.
- **Mock data**: `src/lib/mock/*.ts` — `tournaments.ts`, `players.ts`, `matches.ts`, `shop.ts`, `feed.ts`, `notifications.ts`. Um único `currentUser` mock.
- **Estado local**: TanStack Query com `queryFn` retornando os mocks (permite trocar por fetch real depois sem refatorar telas).

## Mapa de rotas (arquivos em `src/routes/`)

```text
/                          index.tsx              Dashboard do player (já feito)
/auth/login                auth.login.tsx         Login
/auth/register             auth.register.tsx      Cadastro + validação CEP (mock)
/auth/recover              auth.recover.tsx       Recuperar senha
/tournaments               tournaments.index.tsx  Lista de torneios (filtros)
/tournaments/$id           tournaments.$id.tsx    Detalhe + inscrição
/tournaments/$id/bracket   tournaments.$id.bracket.tsx  Chave ao vivo
/tournaments/$id/checkin   tournaments.$id.checkin.tsx  QR de checkin
/ranking                   ranking.tsx            Ranking regional
/shop                      shop.index.tsx         Loja de pontos
/shop/$id                  shop.$id.tsx           Detalhe do item
/community                 community.tsx          Feed + comunidades
/chat                      chat.tsx               Chat (lista + conversa)
/profile                   profile.tsx            Meu perfil + histórico
/profile/settings          profile.settings.tsx   Configurações
/admin                     admin.index.tsx        Painel admin
/admin/tournaments/new     admin.tournaments.new.tsx  Wizard criar torneio
/admin/tournaments/$id     admin.tournaments.$id.tsx  Gerenciar torneio
```

## Detalhamento por tela

1. **Auth — Login / Cadastro / Recuperar**  
   Split screen: metade arte (mesmo tratamento do hero) + metade formulário. Cadastro em 3 steps (dados, gamer tag + jogos favoritos, endereço com CEP mock que preenche cidade/UF).

2. **Lista de Torneios** (`/tournaments`)  
   Filtros por jogo, status e data. Grid de cards com capa, prize pool, vagas, botão "Inscrever". Tabs: `Abertos | Ao vivo | Encerrados`.

3. **Detalhe de Torneio** (`/tournaments/$id`)  
   Hero, regras, formato, cronograma, lista de inscritos, patrocinadores, CTA "Inscrever" ou "Fazer checkin" conforme status.

4. **Chave ao vivo** (`/tournaments/$id/bracket`)  
   Winners/Losers/Grand Final em colunas roláveis horizontalmente. Card de match com placar ao vivo, status LIVE, link para stream. Mini painel lateral com próxima partida e chat de sala.

5. **Checkin** (`/tournaments/$id/checkin`)  
   QR grande + código manual, contador regressivo, lista de status dos participantes.

6. **Ranking** (`/ranking`)  
   Tabela densa estilo scoreboard, top 3 destacados como pódio, filtros por jogo/temporada. Linha do usuário fixa no topo.

7. **Loja de Pontos** (`/shop` + `/shop/$id`)  
   Grid de recompensas (produtos, vouchers, skins virtuais). Modal/rota de detalhe com confirmação de resgate.

8. **Comunidade** (`/community`)  
   Feed vertical (posts, resultados, memes), sidebar com comunidades/jogos, botão de novo post.

9. **Chat** (`/chat`)  
   Layout duas colunas: lista de conversas + thread. Estados: DM, grupo de time, sala de torneio.

10. **Perfil** (`/profile`)  
    Header com avatar, tag, nível, XP; abas: Visão geral, Histórico de partidas, Conquistas, Times.

11. **Configurações** (`/profile/settings`)  
    Preferências (notificações, tema, jogos favoritos), sessão, sair.

12. **Admin — Painel** (`/admin`)  
    KPIs (torneios ativos, inscritos, receita simulada), lista de torneios com ações.

13. **Admin — Criar Torneio** (`/admin/tournaments/new`)  
    Wizard 4 passos: Básico → Formato/Chave → Prêmios e Pontos → Revisão.

14. **Admin — Gerenciar Torneio** (`/admin/tournaments/$id`)  
    Abas: Inscritos (checkin manual), Chave (drag simulado), Resultados, Comunicados.

## Ordem de execução sugerida

1. AppShell + SideNav + mocks base  
2. Auth (login, cadastro, recuperar)  
3. Torneios (lista → detalhe → checkin → bracket)  
4. Ranking + Perfil + Configurações  
5. Loja de pontos  
6. Comunidade + Chat  
7. Admin (painel → wizard → gerenciar)

## Notas técnicas

- Cada rota nova segue o padrão `createFileRoute("/...")` com `head()` próprio (title/description PT-BR).  
- Componentes reutilizáveis em `src/components/`: `TournamentCard`, `MatchCard`, `BracketColumn`, `StatChip`, `SectionHeader`, `EmptyState`, `StepIndicator`.  
- Mobile-first, breakpoints `md` e `lg`. Bottom nav aparece só em `<md`.  
- Sem chamadas de rede — tudo resolvido via mocks síncronos embrulhados em Query.

Confirma esse escopo/ordem? Posso começar pelo AppShell + Auth, ou prefere que eu ataque o fluxo de Torneios primeiro.