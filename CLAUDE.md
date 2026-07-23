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
- **Leitura agregada global bloqueada por RLS (ranking, RF-30)**: quando um
  endpoint precisa agregar dados de TODOS os usuários mas a RLS restringe
  cada sessão às próprias linhas (ex. `SUM(amount)` de `points_transactions`
  por usuário), o padrão é função SQL `SECURITY DEFINER`
  (`app_points_leaderboard()`, migration `points_leaderboard_function`) —
  mesma técnica de `app_current_user_tournament_ids()`, mas retornando
  `TABLE` com SÓ colunas públicas (username/display_name/soma de pontos):
  a função é a fronteira de exposição, nunca devolver email/hash/linhas
  individuais. Sempre `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE TO
  aet_hub_app`. Chamada via `tx.$queryRaw` dentro de `withRls` (contexto
  irrelevante pra função definer, mas mantém a convenção). Dois gotchas:
  `SUM`/`RANK` chegam como `BigInt` no `$queryRaw` — converter com
  `Number(...)` no repository, senão `JSON.stringify` estoura `TypeError`
  na resposta; e `position` NÃO é válido sem aspas em `RETURNS TABLE`
  (reservada pela sintaxe `POSITION(x IN y)`) — usar `"position"`.
- **Chat geral (RF-37) — socket continua broadcast-only**: escrita SEMPRE
  via REST (`POST /chat/messages` com `validateBody`/rate limit/`withRls`),
  nunca por evento socket cliente→servidor — mantém validação, limite e
  tratamento de erro nos middlewares Express que o resto do projeto já
  usa. O broadcast `chat:message` (namespace `/chat`, handshake autenticado
  pelo `socketAuthMiddleware` compartilhado de `config/socket.ts`) CARREGA
  a mensagem no payload — diferente do fire-and-refetch do bracket
  (payload mínimo + invalidate), porque refetch da história a cada
  mensagem não escala — e é emitido DEPOIS do `withRls` retornar (emitir
  dentro entregaria payload de transação que ainda pode sofrer rollback).
  Autor denormalizado (`ChatMessage.senderDisplayName`, snapshot no
  INSERT): não alargar a RLS de `users`/`profiles` pra permitir join (RLS
  é row-level — exporia email/password_hash no nível de linha) nem
  atravessar `ChatMessage.user` com `include` (relação obrigatória + RLS,
  ver bullet acima); rename de displayName não retroage, semântica de
  snapshot aceita. Rate limit de escrita por USUÁRIO
  (`keyGenerator: (req) => req.user!.id`), não por IP — os eventos da AET
  são presenciais, dezenas de players no mesmo wifi. Policy de SELECT usa
  `current_setting('app.current_user_id', true) <> ''` (só sessão
  autenticada — mais estreito que o `USING (true)` das tabelas de
  catálogo, porque mensagem é conteúdo de usuário).
- **Chat privado (RF-38) — extensões sobre o padrão do chat geral**
  (`modules/chat/direct-messages.*`, mesmo módulo porque é o mesmo
  ator/proteção/fluxo): sem tabela Conversation — a lista de conversas é
  derivada por `DISTINCT ON` sobre o par, via `$queryRaw` **sem WHERE de
  propósito** (a RLS de `direct_messages`, sender OU recipient = sessão,
  é o filtro; rodar fora do `withRls` devolveria conversas de todo
  mundo). DOIS displayNames em snapshot (`senderDisplayName` +
  `recipientDisplayName`) pelo mesmo motivo do chat geral — e o do
  destinatário vem da função `SECURITY DEFINER`
  `app_dm_recipient_display_name(target_user_id)` (migration
  `direct_messages_rls_policies`), que valida destinatário ativo E
  devolve o nome numa chamada só; a policy de INSERT fica simples
  (sender = sessão, recipient ≠ sender) porque existência é FK e
  "ativo/não deletado" é regra de negócio do service, não fronteira de
  segurança. Entrega em tempo real reusa o namespace `/chat` com room
  por usuário (`socket.join('user:'+id)` no `on('connection')`) e emit
  direcionado `.to('user:'+a).to('user:'+b).emit('chat:dm', ...)` — o
  broadcast `chat:message` do chat geral segue para o namespace inteiro
  (rooms não afetam emit de namespace). Rate limiter é a MESMA instância
  do chat geral (orçamento único de 20 msg/min por usuário somando os
  dois chats — instância nova dobraria a capacidade de spam). Gotcha de
  `$queryRaw` tagged: repetir a mesma expressão com `${param}` em
  `DISTINCT ON` e no `ORDER BY` falha com 42P10 — cada interpolação
  vira um placeholder posicional NOVO (`$1`, `$2`) e o Postgres exige
  expressões textualmente idênticas; materializar a expressão numa
  subquery interna e referenciar a coluna resolve
  (`direct-messages.repository.ts#listConversations`).
- **Notificações (RF-35) — escrita cruzada entre usuários via função
  definer, não policy de INSERT**: em nenhum gancho de notificação a
  sessão é o destinatário (admin cria pra player em match/resgate/torneio;
  sender cria pra recipient na DM), então `notifications` NÃO tem GRANT de
  INSERT — o único caminho de escrita é `app_create_notification(...)`
  (`SECURITY DEFINER`, migration `notifications_rls_policies`), que valida
  por tipo a linha "pai" que autoriza a operação (EXISTS contra
  `direct_messages`/`matches`/`redemptions`/`registrations` + role da
  sessão) antes de inserir. Payload denormalizado (`title`/`body` prontos
  em pt-BR + `linkPath` + `refId`) — mesma semântica de snapshot do chat;
  o frontend só renderiza e navega, nunca monta texto nem atravessa
  relação. `readAt` usa a primeira policy de UPDATE **self-only** do
  projeto E `GRANT UPDATE (read_at)` por COLUNA — a policy não consegue
  restringir "qual coluna mudou" (RLS não vê OLD row), o grant por coluna
  consegue; por isso o model NÃO tem `@updatedAt` (o Prisma tentaria
  escrever `updated_at` em todo `updateMany` e quebraria o grant).
  Criação de `Notification` via Prisma Client não existe em lugar nenhum —
  o id vem de `gen_random_uuid()::text` na função (default `cuid()` é
  client-side).
- **Dois gotchas de migration descobertos na Fatia 13** (valem pra
  qualquer tabela/função nova): (1) `session_user` é pseudo-constante
  RESERVADA do SQL (devolve a role conectada, ex. `aet_hub_app`) —
  variável plpgsql homônima NÃO a sobrepõe dentro de expressão SQL
  embutida, a comparação passa a usar o nome da role silenciosamente;
  nunca usar `session_user`/`current_user` como nome de variável
  (migration `fix_notification_session_user_shadow`). (2) o
  `ALTER DEFAULT PRIVILEGES ... GRANT ... TO aet_hub_app` de `roles.sql`
  se aplica sozinho a TODA tabela nova — uma migration de RLS que só
  concede o subconjunto desejado (ex. `SELECT` + `UPDATE (read_at)`) fica
  silenciosamente com INSERT/UPDATE/DELETE plenos por baixo; toda
  migration de RLS de tabela nova precisa de `REVOKE INSERT, UPDATE,
  DELETE ... FROM aet_hub_app` ANTES dos grants estreitos (migration
  `notifications_revoke_default_privileges`; conferir com `\dp`).
- **Emit de socket SEMPRE pós-commit**: padrão consolidado na Fatia 13 —
  os broadcasts de `bracket:updated`/`tournament:completed`, que rodavam
  DENTRO do callback do `withRls`, foram movidos pra depois do retorno
  (fire-and-refetch pré-commit fazia o cliente refetchar ANTES do commit
  e ficar stale, além do risco de anunciar transação que sofre rollback).
  Gancho que precisa emitir dado da transação retorna esse dado do
  callback e emite fora (`emitNewNotifications` em
  `notifications/notifications.emitter.ts`, chamado pelos services de
  chat/matches/tournaments/store depois do `withRls`).
- **Comunidades por jogo (RF-23/RF-39) — primeira policy de DELETE
  self-only do projeto**: `posts`/`comments`/`post_likes` ganham
  `*_self_delete` (`USING user_id = sessão`) porque RF-39 pede que o
  próprio player apague o que postou — precedentes anteriores de
  conteúdo de usuário (chat, notifications) eram todos imutáveis ou
  admin-only. `Comment`/`PostLike` usam `onDelete: Cascade` no Prisma
  contra `Post`: excluir o próprio post apaga comentários/curtidas DE
  OUTROS usuários junto — isso é uma referential action do Postgres, que
  roda como o dono da FK e **não passa pela RLS** de quem está deletando;
  intencional aqui (dono do post é dono da thread), mas vale lembrar que
  cascade sempre bypassa RLS, não só nesta tabela. `Community` segue o
  padrão `store_items` de catálogo administrado: sem GRANT de DELETE em
  lugar nenhum, desativação via `isActive` — apagar comunidade com posts
  seria destrutivo demais pra um DELETE simples. `Post`/`Comment` seguem
  o snapshot de autor (`authorDisplayName`) do `ChatMessage`.
- **Novo tipo de notificação (`POST_COMMENT`) validado por dupla
  condição**: o ramo em `app_create_notification` exige `p.user_id =
  recipient_user_id AND p.user_id <> c.user_id` — a segunda cláusula
  evita notificação de comentário no próprio post (o service já nem
  chama a função nesse caso; a função é a garantia por baixo, mesmo
  padrão de defesa em profundidade dos outros ramos). Gotcha de Postgres
  a repetir sempre que um enum ganhar valor novo usado por uma função
  SQL: o `ALTER TYPE ... ADD VALUE` e o `CREATE OR REPLACE FUNCTION` que
  referencia esse valor têm que ficar em migrations (transações)
  **separadas** — usar o valor novo na mesma transação que o criou
  estoura "unsafe use of new value before it has been committed".

## Padrões do frontend (apps/web)

- **Estilização**: Tailwind v4 (`@tailwindcss/vite`), decisão da Fatia 5 que
  substitui CSS Modules (escolha original da Fatia 1) — motivo: coesão com o
  guia visual gerado no Lovable (`src-lovable/`, referência de aparência a
  partir do PRD/`docs/aethub.pdf`), cuja stack já era Tailwind v4. Tokens de
  tema (paleta `navy-dark`/`navy-light`/`ember`/`ember-glow`/`silver`/
  `silver-muted`, fontes Anton/JetBrains Mono/Inter, `@utility clip-panel`
  para os cantos cortados do visual retro) ficam em `src/styles/theme.css`
  via `@theme`; `src/styles/global.css` faz o reset básico. Componentes
  pequenos e reutilizáveis (não a lib inteira de UI do Lovable/shadcn —
  sem uso real ainda de dropdown/dialog/etc.) ficam em
  `src/components/ui/` (`Field`, `Banner`, `Panel`, `PageHeader`,
  `StatusChip`). CSS Modules remanescentes de páginas ainda não retelhadas
  são removidos conforme cada tela é migrada — não é um estado permanente
  de dois sistemas coexistindo.
- **Estrutura de layout de página**: `AppLayout` (`src/components/layout/
  AppLayout.tsx`) envolve todas as rotas, mas só desenha a casca (sidebar
  desktop / drawer mobile, saldo de pontos via `useMyWallet`) quando há
  usuário autenticado — sem usuário, renderiza só `<Outlet />`, deixando
  rotas públicas (login/cadastro) usarem seu próprio layout em tela cheia
  (`src/components/auth/AuthLayout.tsx`, split-screen com o hero da
  marca). Toda rota nova que for um "destino de produto" (não um passo de
  fluxo, tipo checkin) entra em `NAV_ITEMS` dentro de `AppLayout.tsx`;
  itens cujo **backend** ainda não existe (hoje só Comunidade) usam a
  flag `comingSoon` — aparecem no menu desabilitados com selo "em breve"
  em vez de sumirem. Uma tela com backend pronto mas ainda sem frontend
  fica de fora do nav até existir de fato — link morto é pior que omitir.
- **Lista em tempo real com payload no evento (chat)**: diferente do
  padrão fire-and-refetch do bracket (evento sem payload → invalidate →
  refetch), mensagens de chat chegam no payload do evento e são
  APPENDADAS ao cache via `setQueryData` com dedupe por `id`
  (`useChatMessages.ts#appendChatMessage`). Mutation (`onSuccess`) e
  broadcast appendam OS DOIS de propósito — cobre socket momentaneamente
  caído, e o dedupe torna a chegada dupla inofensiva; não "limpar" um dos
  caminhos. Cache `undefined` fica intacto (não criar cache parcial antes
  do GET inicial) e `invalidateQueries` no evento `connect` do socket
  ressincroniza a história após desconexão. `ChatPage` é a primeira tela
  full-height com scroll interno do app: `h-[calc(100vh-3.5rem)]
  lg:h-screen` (3.5rem = `h-14` do header mobile do `AppLayout`) +
  `overflow-y-auto` na lista; auto-scroll só acontece se o usuário já
  estava no fundo, com a posição rastreada via `useRef` atualizado no
  `onScroll` (não `useState` — zero re-render por scroll e evita
  `react-hooks/set-state-in-effect`). Hora de mensagem via `formatTime`
  (`utils/format.ts`, `Intl` HH:mm) — nunca fatiar a string ISO na mão
  (timezone).
- **Chat privado (`/mensagens`)**: bolha compartilhada com o chat geral
  via `components/chat/MessageBubble.tsx` (`senderName` opcional — DM não
  mostra nome, o header da thread já identifica o outro lado). A lista de
  conversas é atualizada localmente por `upsertConversation`
  (`useConversations.ts`: remove a entrada do mesmo `otherUserId`, insere
  no topo; cache `undefined` fica intacto, mesma regra do append). O
  evento `chat:dm` chega pelo MESMO socket/namespace do chat geral, mas
  em hook próprio (`useDirectMessagesSocket`) montado pela página — a
  entrega da MENSAGEM em si continua assim; o aviso fora da tela vem da
  notificação (`notification:new`, hook global no `AppLayout` — ver
  bullet de Notificações abaixo).
  `DirectMessageThread` renderiza com `key={userId}`: sem isso, trocar de
  conversa preserva o rascunho digitado e o `isAtBottomRef` da conversa
  anterior. Componente filho de um pai full-height usa `h-full`, nunca
  repete o `h-[calc(100vh-3.5rem)]` do wrapper (o calc é só do elemento
  de topo da rota). Nome do outro lado numa conversa sem histórico:
  cadeia cache de conversas → `location.state.displayName` (vindo do
  ranking) → derivado da primeira mensagem → `'Player'`.
- **Notificações (`/notificacoes`)**: primeiro socket GLOBAL do app —
  `useNotificationsSocket` é montado pelo `AppLayout` (não por página),
  antes do early return `if (!user)` (regra de hooks), abrindo uma
  terceira conexão ao namespace `/chat` (junto de `useChatSocket`/
  `useDirectMessagesSocket`; consolidar as três numa conexão
  compartilhada é dívida registrada no próprio hook, não replicar uma
  quarta). Evento `notification:new` faz PREPEND no cache (lista é desc —
  contraste com o append do chat), mesmas regras de `appendChatMessage`
  (dedupe por id, cache `undefined` intacto), incrementando `unreadCount`
  junto. Badge de não-lidas no item do nav e no sino do header mobile
  deriva do `unreadCount` do `GET /notifications` — não há endpoint de
  contagem separado. Marcação de lida é automática ao abrir a página:
  mutation disparada em `useEffect` com guarda `unreadCount > 0`
  (mutation em effect não é setState, não fere
  `react-hooks/set-state-in-effect`); o `onSuccess` zera SÓ o
  `unreadCount` no cache via `setQueryData`, deixando o `readAt` dos
  itens stale de propósito — o destaque visual das não-lidas sobrevive à
  visita e some no próximo refetch. O tipo do frontend chama-se
  `AppNotification`, NUNCA `Notification` — o TS resolveria
  silenciosamente para o tipo DOM global (`lib.dom`) sem erro nem import.
  Clique numa notificação navega pro `linkPath` vindo do servidor; o
  frontend não monta rota por tipo.
- **Dois padrões de campo de formulário, não misturar**: formulários
  simples com `useState` controlado (Login, Cadastro) usam o componente
  `Field` (`src/components/ui/Field.tsx`: label + input + erro,
  value/onChange controlados); formulários com `react-hook-form`
  (`TournamentForm`) registram inputs nativos direto via
  `{...register(...)}` e reaproveitam as constantes locais
  `labelClass`/`inputClass` do próprio arquivo (`Field` é controlado,
  incompatível com `register`). Erro de validação em ambos os casos usa a
  mesma classe visual (`text-ember`, ver prop `error` do `Field` e a
  constante `errorClass` em `TournamentForm`).
- **Chip de status por enum**: todo novo enum de status que precisar de
  indicador visual ganha um mapeamento de tom (`accent`/`live`/`muted`) ao
  lado do mapeamento de label já existente em `src/utils/format.ts` (ver
  `tournamentStatusTone` ao lado de `tournamentStatusLabels`), renderizado
  com `StatusChip` (`src/components/ui/StatusChip.tsx`) — não criar chip
  ad-hoc por tela.
- **Ícones**: `lucide-react` (mesma lib do guia do Lovable) — reaproveitar
  o mesmo ícone por conceito (ex. `Trophy` para torneios) quando a tela
  nova tiver equivalente em `src-lovable/`, em vez de escolher um novo por
  preferência pessoal.
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
- **Comunidades (`/comunidade`)**: cards da listagem reaproveitam 1:1 o
  placeholder de capa de `TournamentsPage.tsx` (gradiente `from-ember/40
  via-navy-dark to-navy-light` + sigla grande esmaecida) — sigla vem de
  `community.game?.slug` quando a comunidade tem jogo, senão do próprio
  `community.name` (comunidade "de assunto" sem jogo). Composer de
  post/comentário (textarea + contador `/500`) é o mesmo padrão visual
  do mock `src-lovable/src/routes/community.tsx`, mas sem nenhuma
  dependência da stack TanStack Router do Lovable — página real usa
  `react-router-dom` como o resto do app. Excluir post/comentário usa
  `window.confirm` (mesmo padrão já usado em `AdminTournamentsPage`/
  `AdminStoreItemsPage`) — **cuidado ao testar via automação de
  browser**: `window.confirm` nativo bloqueia o event loop da página
  (inclusive `Input.dispatchMouseEvent`/screenshot via CDP travam até o
  dialog ser resolvido); sobrescrever `window.confirm` via
  `javascript_tool` só vale para o `document` atual — qualquer navegação
  de página cheia depois reseta o override, precisa reaplicar.
  `PostComment` é o nome do tipo em `types/community.ts` — **nunca
  `Comment`**, mesma armadilha silenciosa do `AppNotification` (colide
  com o tipo DOM global `lib.dom`).
- **Chip de status reaproveitado entre domínios**: `storeItemActiveChip`
  virou `activeStatusChip` em `utils/format.ts` quando `AdminCommunitiesPage`
  precisou do mesmo Ativo/Inativo — o helper já era genérico (só recebia
  `boolean`), só o nome era específico da loja; renomear e atualizar os
  usos existentes evita duplicar a mesma função por domínio.

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

`docs/aethub.pdf` é a referência visual/estética **original** do produto
(deck de design): tema escuro (quase preto) com acentos em gradiente
vermelho/laranja neon, painéis com cantos cortados/hexagonais e borda
brilhante, ícones pixel art (8-bit) para conquistas/XP/loot combinados com
painéis glassmorphic mais modernos para destaques de feature, tipografia
condensada/bold em telas de título e fonte estilo LED/monoespaçada para
números (leaderboard). Mascote: lobo com coroa, logo "Alegrete E-Sports".

`src-lovable/` é um layout gerado no Lovable a partir só do PRD (sem
nenhuma noção do backend real) — é a referência visual **concreta** que o
`apps/web` de fato implementa desde a Fatia 5, numa interpretação própria
do deck acima: paleta navy/ember/silver (não o "vermelho/laranja neon"
literal do deck), tipografia Anton/JetBrains Mono/Inter, sem os ícones
pixel art 8-bit. Não é um workspace do monorepo nem é importado por
`apps/web` — é só a fonte de onde os tokens/telas foram portados
manualmente, tela por tela (ver "Padrões do frontend" acima). Ele também
desenha telas/ações sem contrapartida no backend hoje (comunidade,
XP/nível/conquistas, login social, DMs/canais e presença "online" do
chat); o tratamento disso no
frontend real está descrito em "Estrutura de layout de página" acima —
nunca copiar uma tela do Lovable 1:1 sem antes checar se a rota/campo
correspondente existe na API.

O roadmap do deck (Level 1 MVP → Level 4 Integração) cita explicitamente
**PIX** como o método de pagamento planejado para inscrição paga — hoje o
produto não processa pagamento real (`entryFeeCents`/`potPercentage` são
só informativos até essa integração existir) — e também torneios em
equipe/dupla e integração com VOD/streaming como itens de fase futura,
nenhum dos dois modelados no schema atual.
