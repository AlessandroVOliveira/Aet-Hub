# AET Hub

## Visão geral

O AET Hub é o hub de jogadores dos torneios organizados pela AET (Alegrete
Esports Tournament), em Alegrete/RS. Centraliza cadastro de players, pontuação,
informações de campeonatos, checkin nos eventos e chaveamento das disputas.

Atores principais:

- **Admin**: configura métricas de pontuação, cria e gerencia torneios,
  modelos de chaveamento, apoiadores, efetua checkin de players, gerencia a
  loja de pontos, modera comunidades, acessa logs do sistema.
- **Usuário (player)**: se cadastra, mantém perfil (jogo favorito, personagem,
  tema), se inscreve em eventos, acompanha chaveamento e histórico, usa chat
  geral e privado, participa de comunidades por jogo, troca pontos na loja.

Diferenciais de produto: gamificação (níveis, achievements), design com
identidade retro/gamer e responsividade mobile.

## Stack

Monorepo com npm workspaces:

- `apps/web` — React + Vite + TypeScript (frontend)
- `apps/api` — Node.js + Express + TypeScript (backend)
- `apps/api/prisma` — PostgreSQL via Prisma ORM
- `packages/shared` — tipos e utilitários compartilhados entre web e api
- `docs` — PRD, README e demais documentos de produto

TypeScript de ponta a ponta e Prisma foram escolhidos por reforçarem os
requisitos de segurança do produto: tipagem reduz erros bobos, e o Prisma usa
queries parametrizadas nativamente, eliminando SQL injection por
concatenação de strings.

## Estrutura de pastas

```
apps/
  web/
    src/
      components/   # componentes de UI reutilizáveis
      pages/         # telas/rotas
      hooks/         # hooks React customizados
      services/      # chamadas à API
      types/          # tipos específicos do frontend
      styles/        # estilos globais/tema
  api/
    src/
      modules/        # um diretório por domínio: auth, users, tournaments,
                       # checkin, store, feed, chat
      middlewares/    # auth, validação, rate limit, tratamento de erro
      config/         # configuração de ambiente, clientes externos
      utils/          # utilitários genéricos
    prisma/
      schema.prisma
packages/
  shared/
    src/
      types/          # DTOs e tipos compartilhados web <-> api
docs/                  # PRD, README e documentação de produto
```

## Regras de trabalho (sempre seguir)

### Commits

- Sempre escrever mensagens de commit em **português do Brasil**.
- **Nunca** se mencionar como coautor ou incluir qualquer linha do tipo
  `Co-Authored-By: Claude` (ou equivalente referenciando IA/assistente) nos
  commits deste projeto.
- Mensagens no imperativo, curtas, explicando o porquê da mudança, não só o
  quê.

### Clean Code

- Nomes descritivos para variáveis, funções e componentes; evitar abreviações
  obscuras.
- Funções e componentes pequenos, com responsabilidade única.
- Evitar duplicação de código; extrair para `utils`/`hooks`/`services`
  quando fizer sentido, mas sem criar abstração prematura para casos
  hipotéticos.
- Sem código morto, comentários óbvios ou blocos de código comentados.
- Comentários apenas quando o "porquê" não é óbvio pelo código (ex.: uma
  regra de negócio não intuitiva, um workaround específico).
- Seguir a configuração de lint/format do repositório (`eslint.config.js`,
  `.prettierrc.json`) antes de considerar uma tarefa concluída.

### Gestão de contexto e memória

- Quando a janela de contexto da conversa chegar perto de 80% de uso,
  registrar no sistema de memória um resumo do que foi feito na sessão até
  aquele momento (decisões tomadas, arquivos alterados, próximos passos),
  para que o trabalho possa continuar com continuidade em uma sessão futura.

### Segurança de dados (crítico)

Este produto lida com dados pessoais de usuários (incluindo CEP para
validação de residência em Alegrete) e transações de pontos/loja. Tratar
segurança como requisito não-negociável:

- **Row Level Security (RLS)**: habilitar no PostgreSQL para toda tabela com
  dados sensíveis ou específicos de usuário; nunca depender apenas de
  filtros na aplicação.
- **SQL Injection**: nunca concatenar strings para montar queries SQL; usar
  sempre o Prisma (ou queries parametrizadas) para qualquer acesso ao banco.
- **XSS**: nunca renderizar HTML/conteúdo de usuário sem sanitização
  (feed, comentários, chat, perfil); preferir renderização de texto puro do
  React e sanitizar explicitamente qualquer caso que precise de HTML.
- **Autenticação**: login por nome de usuário (não e-mail), conforme
  requisito de produto; senhas sempre com hash forte (bcrypt/argon2), nunca
  armazenadas ou logadas em texto puro.
- **Segredos**: variáveis sensíveis (strings de conexão, JWT secret, chaves
  de API) apenas em `.env`, nunca commitadas; `.env.example` documenta as
  chaves necessárias sem valores reais.
- **Logs**: nunca logar senhas, tokens, dados pessoais completos (CEP, CPF
  se existir) ou payloads de autenticação.
- **Validação de entrada**: validar e sanitizar todo input do usuário no
  backend (ex.: com `zod`) antes de processar ou persistir, mesmo que já
  validado no frontend.

## Padrões do backend (apps/api)

- **Dois `PrismaClient`** (`config/prisma.ts`): `prisma` (role `aet_hub_app`,
  runtime autenticado) e `authPrisma` (role `aet_hub_auth`, escopo estreito
  só para login/cadastro). `authPrisma` só pode ser importado dentro de
  `modules/auth/` — nunca usar fora dali.
- **RLS depende de contexto de sessão por request**: toda query em tabela
  com RLS (dado sensível/de usuário) precisa passar pelo helper `withRls`
  (`config/rls.ts`), que abre uma transação interativa do Prisma e seta
  `app.current_user_id`/`app.current_role` antes das queries. `SET LOCAL`
  fora de uma transação interativa não funciona de forma confiável com o
  pool de conexões do Prisma.
- **Toda tabela nova com dado sensível/de usuário precisa de policy de RLS
  E de GRANT explícito** para a role que vai acessá-la — `FORCE ROW LEVEL
SECURITY` bloqueia por padrão mesmo com o GRANT presente se não houver
  uma policy casando a operação (SELECT/INSERT/UPDATE/DELETE) e a role.
  `INSERT ... RETURNING` (que o Prisma emite em todo INSERT, inclusive
  nested writes) exige privilégio de SELECT também, não só INSERT.
- **`asyncHandler`** (`utils/async-handler.ts`): todo handler de rota
  assíncrono deve passar por ele — o projeto usa Express 4 (não a 5), que
  não encaminha rejeições de Promise para o error handler sozinho.
- `apps/api` usa `module`/`moduleResolution: NodeNext` (ESM nativo do
  Node): todo import relativo entre arquivos `.ts` precisa da extensão
  `.js` no caminho (ex.: `import app from './app.js'`), mesmo importando
  um `.ts`.
- **Rotas com `:id`**: os tipos do Express tipam `req.params[chave]` como
  `string | string[]` (caso geral de `ParamsDictionary`, por causa de
  grupos de regex repetidos), mesmo numa rota simples `/:id`. Como
  `asyncHandler` fixa o `Request` no tipo padrão (não é genérico), o jeito
  mais simples é castar no controller (`req.params.id as string`) em vez
  de tipar cada handler com `Request<{ id: string }>` — isso conflita com
  a assinatura fixa de `asyncHandler`.
- **Scripts que rodam fora de uma request HTTP** (ex.: `prisma/seed.ts`):
  não têm sessão de usuário para setar `app.current_role` via `withRls`,
  então conectam direto com `MIGRATE_DATABASE_URL` (role owner, bypassa
  RLS) — mesmo padrão que `prisma migrate` já usa.
- **Módulo é por ator/proteção de rota, não por tabela do Prisma**: quando
  duas tabelas (ou uma só) são acessadas por atores diferentes com regras
  de autorização diferentes (ex.: `registrations`/`checkins` — player
  mexe na própria inscrição, só admin faz checkin), cada ator ganha seu
  próprio módulo (`modules/registrations` só `requireAuth`,
  `modules/checkin` com `requireAuth + requireRole('ADMIN')`), mesmo que
  os repositories de ambos leiam/escrevam nos mesmos models Prisma.
  **Exceção**: quando é **um único model** cujo ciclo de vida atravessa
  dois atores como passos acoplados da mesma ação (ex.: `Match` — ver
  chave é amplo, registrar resultado é admin; `Redemption` — criar é do
  player, cumprir/cancelar é do admin), auth misturada por rota **dentro**
  do mesmo módulo (`requireRole('ADMIN')` só nas rotas que precisam,
  padrão já usado em `matches.routes.ts`/`tournament-photos.routes.ts`/
  `store.routes.ts`) é preferível a fragmentar em módulos menores — o
  critério é se as duas metades formam um único fluxo/recurso (mesmo
  módulo) ou dois fluxos de negócio independentes que só compartilham
  dado relacionado (módulos separados).
- **Broadcast via Socket.IO fora do ciclo request/response**: `services`
  não recebem `io` por injeção de dependência — `config/socket.ts` guarda
  a instância criada por `createSocketServer` num singleton de módulo
  (`getSocketServer()`), para qualquer service poder emitir sem precisar
  repassar `io` por todas as camadas. O emit é sempre best-effort (se
  `getSocketServer()` retornar `undefined`, pula sem quebrar a request —
  cobre scripts que rodam fora do server HTTP).
- **Semântica de `BracketSlot`/`Match` (motor de chaveamento)**:
  `Match.bracketSlotId` aponta para o slot de **destino** — o `BracketSlot`
  da rodada seguinte que recebe o `registrationId` do vencedor.
  `registrationAId`/`registrationBId` são copiados dos dois `BracketSlot`s
  de origem (rodada atual, posições irmãs) no momento em que o `Match` é
  criado, não derivados via join a cada leitura. Só rodada 1 tem bye (avanço
  automático sem `Match`); da rodada 2 em diante toda vaga é sempre
  preenchida por um `Match` real, porque `bracketSize` já é potência de 2.
- **Colocação final (eliminação simples)**: `matches/placement-calculator.ts`
  deriva a colocação de cada `Registration` a partir de `Match.bracketSlot.round`
  (que é a rodada de **destino**, ver item acima) — a fórmula
  `2^(maxRound - R) + 1` é só relativa entre partidas do mesmo torneio, então
  funciona mesmo com `R` rotulado como rodada de destino em vez de rodada
  jogada. Empates ficam pela rodada de eliminação (dois semifinalistas
  perdedores dividem o 3º lugar); não há critério de desempate além disso
  nesta fase (RF-18 fica para o futuro). Resultado é persistido em
  `Registration.finalPlacement`, calculado uma única vez no encerramento do
  torneio (`tournaments.service.completeTournament`), não recalculado depois.
- **Upload de arquivo (fotos de torneio, RF-15)**: `multer.memoryStorage()`,
  nunca `diskStorage` — o service só grava em disco (`UPLOAD_DIR`, env var)
  depois de validar a regra de negócio (torneio precisa estar `COMPLETED`),
  evitando arquivo órfão em disco se a validação rejeitar. Nome em disco é
  sempre gerado (`randomUUID() + extensão de uma whitelist de mimetype`),
  nunca o nome original enviado pelo usuário — elimina path traversal e
  colisão; o nome original só fica no banco (`originalName`) para exibição/
  `Content-Disposition` no download. Download é servido por endpoint
  autenticado (`res.download`), nunca por `express.static` na pasta de
  uploads — mantém controle de acesso.
- **RLS de ledger iniciado pelo próprio usuário** (ex.: débito de
  `PointsTransaction` ao resgatar item da loja): as policies de INSERT
  administrativas (`points_transactions_admin_insert`, exige
  `app.current_role = 'ADMIN'`) não cobrem ação disparada pelo player.
  Nunca "forjar" `role: 'ADMIN'` no `withRls` pra contornar — isso
  esvaziaria RLS como camada de segurança de verdade. Em vez disso,
  adicionar uma **segunda policy de INSERT aditiva** (policies permissivas
  se combinam com `OR`, sem tocar na existente), o mais estreita possível:
  tipo fixo (`type = 'REDEMPTION'`), sinal do `amount` compatível com a
  semântica do tipo (sempre negativo pra débito), e vínculo validado via
  `EXISTS` contra a linha "pai" que autoriza a operação (a própria
  `Redemption`, já filtrada pela RLS dela). Esse gap não é exclusivo de
  `points_transactions`: qualquer tabela com policy "só admin escreve"
  pode esconder o mesmo problema se uma fatia futura passar a permitir
  escrita pelo player — ex. `store_items.stock` (ver
  `store_items_stock_redemption_update`, mesma lógica pro decremento de
  estoque no resgate).
- **RLS + relações obrigatórias do Prisma**: se uma query usa `include`/
  `select` que atravessa uma relação **obrigatória** (`Model campo Model`,
  sem `?`) pra uma tabela com RLS, e a linha do outro lado fica invisível
  pela policy (mesmo sem esse campo estar pedido no `select`!), o Prisma
  falha com `PrismaClientUnknownRequestError: Field <campo> is required to
  return data, got null instead` em vez de simplesmente omitir o dado —
  isso vale mesmo pra relações não pedidas explicitamente, sempre que
  outra relação incluída depende delas internamente (ex.: pedir
  `registrationA.user` de um `Match` falha se a `Registration` do
  adversário existir mas o `User` dela estiver escondido por RLS). Numa
  relação **opcional** (`Model? `), o mesmo cenário só faz o campo vir
  `null` silenciosamente, sem erro — o que também pode mascarar um gap de
  RLS sem avisar (foi assim que `profiles` ficou sem policy até alguém
  notar que `displayName` do adversário sempre vinha `null`). Ao expandir
  visibilidade entre usuários (ex. "colegas de torneio se veem"), sempre
  auditar TODAS as tabelas atravessadas pela relação, não só a primeira.
- **Padrão "colegas de torneio se veem"** (`registrations`, `users`,
  `profiles`): três policies aditivas, uma por tabela, todas reaproveitando
  a mesma função `app_current_user_tournament_ids()` (`SECURITY DEFINER`,
  dona = `aet_hub_owner`/superuser do container). Nunca fazer um `EXISTS
  (SELECT ... FROM registrations WHERE ...)` **direto** dentro de uma
  policy da própria tabela `registrations` — Postgres detecta isso como
  "infinite recursion detected in policy" (42P17) porque avaliar a
  subquery reaciona a mesma RLS que está sendo avaliada. A função
  `SECURITY DEFINER` quebra esse ciclo: roda com privilégio do dono
  (bypassa RLS por completo), então a leitura interna não reaciona a
  policy. Mesmo quando a tabela-alvo da policy é diferente de
  `registrations` (caso de `users`/`profiles`), reaproveitar a função em
  vez de duplicar a lógica.
- **Concorrência em valor agregado sem coluna própria** (saldo de pontos =
  `SUM(amount)` do ledger, sem coluna "balance" em lugar nenhum): checar
  saldo e depois inserir um débito não é atômico por si só — duas
  requisições concorrentes podem ler o mesmo saldo suficiente antes de
  qualquer uma comitar. O padrão idiomático do projeto pra isso é
  `pg_advisory_xact_lock(hashtext('<prefixo>:' || id))` logo no início da
  transação (`store.service.ts#redeemStoreItem`) — serializa só as
  requisições do mesmo `id` (ex. mesmo usuário), liberado sozinho no
  commit/rollback. Diferente de decremento de estoque (`stock: {
  decrement: 1 }` com `WHERE stock > 0`), que já é atômico via `UPDATE`
  condicional — não precisa de lock adicional.

## Padrões do frontend (apps/web)

- **Estilização**: CSS Modules + variáveis CSS (não Tailwind, decisão
  tomada na Fatia 1 do frontend). Tokens de tema (cores, gradiente,
  tipografia, espaçamento, `--clip-panel` para os cantos cortados do
  visual retro) ficam em `src/styles/theme.css`; `src/styles/global.css`
  faz o reset básico. Cada componente/página tem seu `Nome.module.css`
  ao lado do `.tsx`.
- **Data fetching**: TanStack Query (`@tanstack/react-query`) para toda
  chamada à API — mutations para escrita, `useQuery` para leitura/cache.
  Fetch wrapper único em `src/services/http.ts` (`apiRequest`/`ApiError`,
  base `import.meta.env.VITE_API_URL`); cada domínio ganha seu arquivo em
  `src/services/` (ex. `auth.ts`), nunca `fetch` direto num componente.
- **Estado de autenticação**: token JWT em `localStorage`
  (`'aet-hub:token'`), nunca em cookie (a API não emite cookie, só
  `Authorization: Bearer` — ver abaixo). Contexto único em `src/hooks/
  useAuth.tsx` (`AuthProvider`/`useAuth`), populado via `GET /users/me`
  com TanStack Query ao montar o app se houver token salvo. **`GET
  /users/me` não retorna `role`** (só `GET /auth/me`, que por sua vez
  não retorna perfil completo) — o frontend decodifica o `role` direto
  do payload do próprio JWT (`src/utils/jwt.ts#decodeJwtPayload`, sem
  verificar assinatura) em vez de reconciliar dois endpoints; isso é só
  para UI (esconder/mostrar elementos), a autorização de verdade
  continua sendo sempre o middleware do backend. Evite `setState`
  síncrono dentro de `useEffect` para reagir a falha de query (dispara
  `react-hooks/set-state-in-effect`) — prefira tratar o efeito colateral
  (ex. limpar `localStorage`) dentro da própria `queryFn`/mutation e
  derivar o estado exposto (`isAuthenticated`) direto do resultado da
  query.
- **Rota protegida**: componente wrapper (`src/components/
  ProtectedRoute.tsx`) baseado em `<Outlet>` do `react-router-dom` v6,
  não em loaders — redireciona pra `/login` preservando
  `location.state.from` para retomar a rota original após o login.
- **`packages/shared` fica vazio por enquanto**: tipos de request/
  response da API (ex. `RegisterPayload`, `LoginResponse`) ficam locais
  em `apps/web/src/types/` até o backend também precisar importar os
  mesmos contratos — promover pra `packages/shared` antes disso seria
  abstração especulativa sem segundo consumidor real.
- **Vite não lê o `.env` da raiz do monorepo por padrão**: `vite.config.ts`
  precisa de `envDir` apontando pra raiz (`path.resolve(__dirname,
  '../..')`), mesmo padrão que `apps/api/src/load-env.ts` já usa pro
  backend — sem isso, `import.meta.env.VITE_API_URL` fica `undefined`
  em dev mesmo com a variável definida no `.env` raiz.
- **CORS em dev** (`apps/api/src/app.ts`): `origin: true` sempre
  (reflete o `Origin` da requisição — obrigatório com `credentials:
  true`, que não aceita `'*'`). Não existe hoje um env var de allowlist
  de frontend (`CORS_ORIGIN`/`FRONTEND_URL`); API e frontend rodam só em
  dev local por enquanto.
- **Formulário com arrays dinâmicos**: `react-hook-form` (decisão tomada
  na Fatia 2b, primeira lib de formulário do projeto — telas mais simples
  como `RegisterPage` continuam com `useState` manual, sem retrofit).
  `useFieldArray` para as listas dinâmicas (ex. apoiadores/premiação por
  colocação de `TournamentForm`). Sem `@hookform/resolvers`/zod client-side
  — validação cross-field fica em função pura própria (ex.
  `utils/validate-tournament-form.ts`), mesmo padrão de função manual já
  usado em `RegisterPage`, alimentando o mesmo helper de mapeamento pra
  `setError` (`utils/apply-issues-to-form.ts`) que também consome
  `ApiError.issues` do backend — um único código pra pintar erro de campo
  seja a origem client ou server.
- **`Prisma Decimal` em resposta JSON vira string**: `Decimal.toJSON()`
  serializa como string (ex. `"12.50"`), mesmo quando o schema de escrita
  espera `number` no body (caso de `TournamentPlacementReward.
  potPercentage`, único campo `Decimal` do schema). Tipar o shape de
  leitura com o campo `string` e o shape de escrita com `number` (dois
  tipos distintos, ex. `PlacementReward`/`PlacementRewardInput`) força o
  `Number(...)` nos pontos certos do frontend em vez de deixar passar
  batom.
- **RHF + `<select>` com valor vindo de uma query assíncrona (ex. picker
  de jogo)**: `defaultValues` do `useForm` é capturado só uma vez no mount
  — se o componente montar antes da lista de opções (`useGames()`) estar
  carregada, o `<select>` não acha a `<option>` correspondente e o campo
  fica vazio mesmo com o dado certo no estado interno do RHF (bug sutil,
  sem erro nenhum, só o dropdown aparentando "esquecer" o valor). Mesma
  lógica já documentada pra "montar só depois que os dados existem" (ver
  fluxo de edição abaixo) se aplica a **toda** fonte de dado usada pra
  montar `defaultValues`, não só o recurso principal — por isso
  `AdminTournamentFormPage` carrega `useGames()` no nível da página e só
  monta `<TournamentForm>` depois que jogos (e, em modo edição, o torneio)
  já chegaram, em vez de `TournamentForm` chamar `useGames()` internamente.
- **Instalar dependência nova de frontend com o dev server do Vite já
  rodando**: reinicie o processo (`npm run dev --workspace apps/web`) e
  limpe `apps/web/node_modules/.vite` depois do `npm install` — só assim
  o Vite repete o pre-bundling (`optimizeDeps`) da dependência nova de
  forma limpa. Sem isso, um F5/reload no meio de uma sessão de dev pode
  disparar um full-reload automático do Vite bem no meio de uma request
  em andamento (ex. `GET /users/me` da reidratação de sessão), abortando-a
  e derrubando a sessão — não é bug de autenticação, é artefato do dev
  server ficando defasado em relação ao `package.json`.

## Banco de dados local (Docker Compose)

- `npm run db:up --workspace apps/api` sobe o Postgres.
- `npm run db:roles --workspace apps/api` cria/atualiza as roles de
  runtime (`aet_hub_app`, `aet_hub_auth`) e os grants de nível de schema —
  precisa rodar **depois de qualquer `prisma migrate reset`**, porque o
  reset recria o schema `public` do zero e apaga o `GRANT USAGE ON SCHEMA`.
- Privilégios de nível de tabela para `aet_hub_app` ficam garantidos direto
  na migration `rls_policies` (`GRANT ... ON ALL TABLES IN SCHEMA public`),
  não só via `ALTER DEFAULT PRIVILEGES` em `roles.sql` — `ALTER DEFAULT
PRIVILEGES` só vale para tabelas criadas depois dele, então não
  retroagiria para tabelas recriadas por um reset.
- `npm run db:seed --workspace apps/api` (`apps/api/prisma/seed.ts`) além
  dos 3 jogos de exemplo, cria um admin de teste (`admin`/`admin123` por
  padrão, overridável via `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD`/
  `ADMIN_SEED_EMAIL`) — único jeito de conseguir uma conta `ADMIN` sem
  `UPDATE` manual no Postgres, já que o cadastro público sempre cria
  `PLAYER` de propósito (RLS impede escalonamento).

## Documentação de produto

O PRD completo está em `docs/PRD.md` (requisitos funcionais/não-funcionais,
modelo de dados conceitual, fluxos principais, roadmap por fases). O
`README.md` na raiz cobre como rodar o projeto localmente.

`docs/aethub.pdf` é a referência visual/estética para o frontend (ainda não
iniciado): tema escuro (quase preto) com acentos em gradiente vermelho/
laranja neon, painéis com cantos cortados/hexagonais e borda brilhante,
ícones pixel art (8-bit) para conquistas/XP/loot combinados com painéis
glassmorphic mais modernos para destaques de feature, tipografia
condensada/bold em telas de título e fonte estilo LED/monoespaçada para
números (leaderboard). Mascote: lobo com coroa, logo "Alegrete E-Sports".
O roadmap do deck (Level 1 MVP → Level 4 Integração) cita explicitamente
**PIX** como o método de pagamento planejado para inscrição paga — hoje o
produto não processa pagamento real (`entryFeeCents`/`potPercentage` são
só informativos até essa integração existir) — e também torneios em
equipe/dupla e integração com VOD/streaming como itens de fase futura,
nenhum dos dois modelados no schema atual.
