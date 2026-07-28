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
  jogada. Resultado é persistido em `Registration.finalPlacement`, calculado
  uma única vez no encerramento do torneio
  (`tournaments.service.completeTournament`), não recalculado depois.
- **Regra de desempate configurável (RF-18)**: por padrão, todo mundo
  eliminado na mesma rodada empata no mesmo `placement` (ex.: os dois
  perdedores da semifinal dividem o 3º lugar). Se `Tournament.tiebreakerRule`
  estiver definido, `computePlacements` (mesmo arquivo) agrupa os empatados
  por `placement` base e renumera dentro do grupo com
  `novoPlacement = basePlacement + (nº de colegas do MESMO grupo com métrica
  estritamente maior)` — `basePlacement` já representa "1 + quantos
  jogadores estão em grupos melhores", só falta o deslocamento dentro do
  próprio grupo. A métrica varia por regra: `WIN_BALANCE` conta vitórias em
  **todo** o torneio (perdas são sempre 1 pra qualquer não-campeão em
  eliminação simples, então saldo de vitórias = contagem de vitórias);
  `HEAD_TO_HEAD` conta vitórias só em partidas onde os dois lados pertencem
  ao mesmo grupo empatado. Empates residuais na métrica continuam
  compartilhando o mesmo `placement` — é o fallback, automático pela própria
  fórmula, idêntico ao comportamento sem regra configurada. Isso muda de
  verdade o bônus de `TournamentPlacementReward` (`@@unique([tournamentId,
  placement])`, um reward por posição exata) — sem desempate, dois
  empatados em 3º recebiam cada um o bônus inteiro de 3º; com `WIN_BALANCE`,
  só quem tem mais vitórias fica realmente em 3º, o outro cai pro bônus (ou
  ausência de bônus) da posição seguinte. **`HEAD_TO_HEAD` é estruturalmente
  inerte no motor atual** (só eliminação simples): dois jogadores eliminados
  na mesma rodada nunca se enfrentaram entre si (se tivessem jogado, um já
  teria sido eliminado antes) — a métrica é sempre 0 pra todo mundo no
  grupo, então o fallback de empate compartilhado sempre se aplica na
  prática. Implementado mesmo assim, genérico e correto, pronto pra
  funcionar sozinho se o motor ganhar eliminação dupla/repescagem no
  futuro — decisão tomada com o usuário via `AskUserQuestion` em vez de
  restringir a regra só a `WIN_BALANCE`.
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
- **Feed principal de notícias (RF-36) — conteúdo externo, não gerado por
  usuário**: diferente de Comunidades (posts de player), `NewsItem`
  (`modules/feed/`) vem de uma API terceira (freenewsapi.io, header
  `x-api-key`), cacheada localmente. Não tem `userId` — não pertence a
  ninguém do Hub — então o RLS de `news_items` é **qualquer sessão
  autenticada pode INSERT**, não só admin (diferente de `communities`):
  quem popula a tabela é o próprio refresh-se-obsoleto disparado por
  QUALQUER leitura de `GET /feed/news`, e restringir a admin quebraria
  isso pra ~100% das requisições reais sem ganho de segurança (o corpo do
  INSERT nunca é texto livre de usuário, sempre o resultado mapeado de
  `feed.news-client.ts`). Sem UPDATE em lugar nenhum — conteúdo de
  notícia publicada não muda, `createMany({ skipDuplicates: true })` com
  `@@unique([category, externalId])` cobre o dedup do refetch sem custo
  de N upserts. **Trocada de API em produção**: a primeira escolha
  (APITube) foi testada com chave real e descartada — o plano free
  trunca `description`/`url`/`imageUrl` injetando o literal
  `"...(+N chars hidden)...[Upgrade subscription plan]"` DENTRO do valor
  do campo (não é limite de docs, é o dado de verdade devolvido pela API
  — confirmado lendo o campo bruto no banco e via `.slice()` no browser),
  inutilizando link/imagem de quase todo artigo.
- **freenewsapi.io é dois endpoints, não um** — `GET /news` (lista, só
  `uuid`/`title`/`published_at`/`publisher`) e `GET /details?uuid=X` (um
  artigo por vez, sem batch: `thumbnail`/`original_url`/`incipit`/`body`).
  **Gotcha real descoberto testando com chave de verdade**: a resposta de
  `/details` vem envelopada em `{"data": {...}}` (diferente de `/news`,
  que devolve o array direto em `data`) — assumir os campos soltos faz
  `original_url`/`thumbnail`/`incipit` virarem `undefined` silenciosamente
  e o artigo inteiro ser descartado no filtro de URL, sem nenhum erro
  logado (o request em si tinha sido 200 OK). **Rate limit apertado**
  (~1 req/s, 429 "Too Many Requests" com `retry_after_ms`) — buscar
  `/details` de vários artigos via `Promise.all` estoura quase todo
  request; `feed.news-client.ts` faz isso **sequencial**, com um
  `sleep(1100ms)` entre chamadas (`ARTICLES_PER_REFRESH = 8` por
  categoria/refresh — o teto existe justamente pra limitar quanto tempo
  o refresh-se-obsoleto trava a request quando dispara, já que 8 chamadas
  seriais ~1/s levam uns 9-12s no pior caso).
- **Filtro de idioma fixo em português do Brasil**: `buildListParams`
  (`feed.news-client.ts`) sempre manda `language=pt-419` — código real
  usado pela freenewsapi.io pra português do Brasil (confirmado via `GET
  /languages?country=BR`, que devolve exatamente `["pt-419"]`; NÃO é
  BCP-47 padrão, seria `pt-BR` — é convenção própria da API, mesmo padrão
  usado pra `es-419` no espanhol latino-americano). Todo o Hub é pt-BR
  (RF-03 e o resto do produto não tem i18n), então não faz sentido o
  feed trazer notícia em outro idioma; sem esse parâmetro a lista vinha
  misturada (inglês, japonês, russo, chinês, etc.).
- **Paginação por cursor no feed ("Ver notícias mais antigas")** —
  primeira lista paginada do projeto (`posts`/`comments`/`notifications`
  são todos teto fixo sem paginação real). `GET /feed/news` aceita
  `cursor` opcional (id do último item da página anterior); sem cursor =
  primeira página (9 itens, dispara o refresh-se-obsoleto); com cursor =
  página seguinte (3 itens, **nunca** dispara refresh — "ver mais
  antigas" é leitura pura do cache, não busca notícia nova).
  `feed.repository.ts#listNewsPage` ordena por `[{ publishedAt: 'desc' },
  { id: 'desc' }]` (desempate por id — vários artigos podem ter o mesmo
  `published_at`, sem o desempate o cursor pode pular/repetir linha) e
  busca `take + 1` só pra saber se existe próxima página sem precisar de
  `COUNT(*)` separado; `nextCursor: null` quando a página devolve `take`
  ou menos linhas — é o que desliga o botão "Ver mais antigas" sozinho.
  Como o refresh só insere (nunca busca histórico retroativo), o "chão"
  da paginação é sempre o artigo mais antigo já capturado desde que a
  feature entrou no ar — não existe backfill de notícia anterior a isso.
  Frontend usa `useInfiniteQuery` (`hooks/useNews.ts`, primeiro uso desse
  padrão no projeto) — `NewsFeedSection` achata `data.pages` numa lista
  só pra renderizar, o estado de `expanded` (comentário por card)
  continua funcionando igual através de páginas porque é chaveado por
  `newsItemId`, não por posição/página.
- **Refresh-se-obsoleto nunca segura uma transação Prisma através de I/O
  externo, e nem segura a response**: `feed.service.ts
  #listNews` faz (a) checagem de staleness (`MAX(fetchedAt)` por
  categoria) numa transação curta, (b) se obsoleto, dispara
  `refreshNewsInBackground` com `void` — **sem `await`** — então fetch à
  API de notícias e upsert do que foi buscado rodam depois da response já
  ter sido montada, nunca bloqueando quem abriu a Home (motivo: o fetch
  sequencial de `/details` a ~1/s, ver bullet de rate limit abaixo,
  segurava a Home por até ~9-12s no pior caso; identificado pelo usuário
  ao notar a demora, não por bug report), (c) leitura das linhas
  atuais — **sempre roda em seguida**, refresh tendo disparado ou não, e
  sempre reflete o cache de ANTES do refresh (quem gatilhou o refresh só
  vê o artigo novo na visita seguinte, não na mesma carga). Dentro de
  `refreshNewsInBackground`, o upsert continua numa transação curta e
  dentro de um `.catch` próprio (não há mais nenhuma request esperando
  essa promise pra propagar erro pra cima) — um artigo malformado nunca
  deve derrubar a Home, já aconteceu na prática: `id` numérico da APITube
  quebrando o INSERT antes da troca de provedor. `feed.news-client.ts`
  nunca lança (todo erro de rede/status/parsing vira artigo descartado/
  array vazio, logado): é o que garante fail-open — a API de notícias
  fora do ar nunca impede a Home de mostrar o que já tinha em cache.
  Diferente do fail-closed de `utils/cep.ts` (gate de segurança de
  cadastro), aqui é conteúdo editorial — degradar servindo cache stale é
  sempre preferível a quebrar a Home (e agora nunca chega a demorar pro
  usuário perceber).
- **Sem notificação para comentário em notícia**: ao contrário de
  `POST_COMMENT` (Comunidades), `app_create_notification` autoriza cada
  tipo via `EXISTS` contra uma linha-pai **pertencente ao destinatário**
  — `NewsItem` não tem `userId` e estruturalmente não pode ter, então não
  existe destinatário legítimo pra autorizar. Nenhum branch novo na
  função, nenhum valor novo em `NotificationType`; `feed.service.ts
  #createNewsComment` só insere o comentário. Vale como referência: nem
  todo "comentário em algo" ganha notificação — só quando existe um dono
  de verdade do lado de dentro do Hub.
- **Denúncia de conteúdo (RF-40, Fatia A) — só infraestrutura de fila,
  sem ação de moderação**: escopo deliberadamente cortado do PRD original
  (RF-25 "remover conteúdo, silenciar/banir usuário" fica pra uma Fatia B
  futura, decidido com o usuário via `AskUserQuestion` por ser grande
  demais pra uma fatia só) — `modules/reports/` cobre só `POST /reports`
  (player) + `GET /reports`/`PATCH /reports/:id/dismiss` (admin), nunca
  toca no conteúdo denunciado nem no usuário autor. Cobre os 5 tipos de
  conteúdo de uma vez (`ReportedContentType`: `POST`/`COMMENT`/
  `CHAT_MESSAGE`/`DIRECT_MESSAGE`/`NEWS_COMMENT`) porque o custo por tipo
  é só mais um `case` no lookup, não uma RLS nova.
- **Primeira policy de SELECT self-OR-admin nascendo de um requisito do
  Prisma, não de produto**: `reports_self_or_admin_select` (`reporter_id
  = sessão OR role = 'ADMIN'`) existe porque todo `INSERT` do Prisma
  emite `RETURNING` (regra já documentada aqui) — sem o `OR reporter_id =
  sessão`, o próprio `POST /reports` do player quebraria lendo de volta a
  linha que acabou de criar. Mesmo padrão de
  `points_transactions_self_or_admin_select`, adicionado aqui por um
  motivo puramente técnico, não porque exista uma tela "minhas
  denúncias".
- **`Report` sem NENHUMA relation Prisma pra `User`** (nem
  `reporterId`/`contentAuthorId`/`reviewedByUserId`) — mesma lição já
  documentada pra `NewsComment`/`ChatMessage`: RLS de `users` só libera
  self/ADMIN/colega-de-torneio, e um admin revisando a fila raramente
  compartilha torneio com o denunciante/autor. Compensado com DOIS
  snapshots de nome (`reporterDisplayName` + `contentAuthorDisplayName`),
  mesmo padrão dos dois snapshots de `DirectMessage`.
- **`contentId` polimórfico validado por lookup direto, não por função
  `SECURITY DEFINER`**: `reports.service.ts#lookupReportedContent`
  despacha por `switch(contentType)` pros repositories de 4 módulos
  diferentes (`communities`, `chat` x2, `feed`), rodando sob a própria
  sessão RLS do denunciante (dentro do mesmo `withRls` que depois insere
  o `Report`) — diferente de `app_create_notification` e
  `app_dm_recipient_display_name`, que existem especificamente pra
  atravessar uma fronteira de privilégio CROSS-USER. Aqui não há
  fronteira nenhuma pra atravessar: é um INSERT auto-referente (o
  denunciante denuncia como ele mesmo), então a RLS de leitura do próprio
  denunciante já é suficiente — e vira bônus de segurança de graça:
  denunciar uma `DirectMessage` da qual o denunciante não participa
  devolve 404 sozinho (RLS de `direct_messages` já esconde a linha), sem
  nenhuma checagem extra no código. Content author/snapshot vêm desse
  mesmo lookup, então o "conteúdo pra revisar" sobrevive mesmo que o
  original seja apagado depois (posts/comentários/comentário de notícia
  são self-deletable) — mesma razão dos outros snapshots do projeto.
- **`@@unique([reporterId, contentType, contentId])` + captura de P2002
  no service** evita denúncia duplicada da mesma pessoa pro mesmo
  conteúdo (409 limpo, "Você já denunciou este conteúdo") — mesmo idioma
  já usado em `postsService.likePost` pro curtir duplicado. Autor não
  pode denunciar o próprio conteúdo (`authorId === actor.id` → 400),
  checado no service, não na RLS (RLS não sabe comparar duas colunas de
  tabelas diferentes aqui).
- **Rate limiter próprio** (`createReportLimiter`, 10/min por usuário via
  `keyGenerator: req.user!.id`) — instância nova, não reaproveita
  `sendMessageLimiter`/`writeContentLimiter`: orçamento de denúncia é um
  gesto raro e deliberado, não deveria competir com o budget de chat/post
  nem ser generoso demais (spam de denúncia é o próprio vetor de abuso
  que RF-40 tenta conter).
- **Catálogo de jogos editável pelo admin** (`modules/games/`): até esta
  fatia, `Game` só era populado pelo seed (3 jogos de exemplo) — o campo
  Jogo do formulário de torneio precisava de migration/seed pra crescer.
  RLS de `games` já cobria isso desde a Fatia 1 (policy genérica de
  catálogo — SELECT público, INSERT/UPDATE/DELETE admin-only), então
  **nenhuma migration nova foi necessária**, só código de aplicação.
  Módulo novo extraído de onde estava espalhado (`GET /users/games`
  vivia dentro do módulo `users`; `findGameById`/`listActiveGames`
  moravam em `tournaments.repository.ts`, importados por
  `users`/`tournaments` services) — mesmo padrão de `store`: `GET /games`
  (qualquer autenticado, só ativos — substitui `GET /users/games`),
  `GET /games/all` (admin, incl. inativos), `POST /games`/`PATCH
  /games/:id` (admin). Slug é **gerado no servidor** a partir do nome
  (`slugify` local em `games.service.ts`, sem lib nova) — não é campo do
  formulário, evita duas fontes de verdade pro mesmo nome; duplicata de
  nome/slug vira 409 via captura de `P2002` (mesmo padrão de
  `reports.service.ts`).
- **Moderação de conteúdo (RF-25, Fatia B)** — fecha o que a Fatia A (RF-40)
  deixou de propósito fora de escopo: remover conteúdo denunciado, silenciar
  ou banir o autor, com motivo registrado. `User.isActive` (já existia,
  nunca lido em lugar nenhum) foi reaproveitado como "não banido" — mesmo
  padrão de `Game`/`StoreItem`/`Community.isActive`; `User.isMuted` é campo
  novo. Motivo vai pra `AuditLog.metadata` (`{reason, reportId?}`), não uma
  coluna `banReason` nova — é o primeiro código de aplicação a escrever
  nessa tabela (RF-06 só existia como schema até aqui; RLS dela já estava
  pronta desde a migration `rls_policies` da Fatia 1, sem nenhuma migration
  nova necessária). `ReportStatus` ganhou `RESOLVED` (terceiro valor, cobre
  as duas categorias de ação — qual ação foi tomada fica só no `AuditLog`
  via `metadata.reportId`, não multiplica valor de enum por ação).
- **`requireAuth` deixou de ser stateless** (`middlewares/auth.middleware.ts`):
  pra ban ter enforcement imediato (JWT ainda válido de um usuário banido
  precisa parar de funcionar sem esperar expirar), o middleware agora roda
  um `withRls` self-context a cada request autenticada (`tx.user.findUnique`
  checando `isActive`/`isMuted`) — **nunca** `prisma` direto aqui: sem
  `app.current_user_id` setado, a RLS de `users` devolveria vazio e todo
  mundo pareceria banido. Precisou virar assíncrono; como
  `utils/async-handler.ts#asyncHandler` já tem a assinatura exata
  `(req,res,next) => Promise<void>`, a solução foi literalmente
  `export const requireAuth = asyncHandler(async (req,res,next) => {...})`
  em vez de escrever tratamento de erro próprio. Trade-off aceito
  conscientemente: 1 transação extra por request autenticada (sem cache/
  otimização — não pedido). Tipo de `req.user` ganhou uma interface nova
  (`RequestUser`, em `modules/auth/jwt.ts`, superset de
  `AccessTokenPayload` com `isMuted`) — **não** `AuthenticatedUser`, nome já
  usado por `auth.service.ts` pro formato de resposta do login (conceito
  diferente, colidiria). Mute é um middleware **separado**
  (`requireNotMuted`, `middlewares/require-not-muted.middleware.ts`) — bloqueia
  só *criação* de conteúdo (aplicado nas 5 rotas `POST` de mensagem/post/
  comentário de chat geral, DM, comunidades e feed de notícias), não a
  sessão inteira; não precisa de query nova porque `req.user.isMuted` já
  veio populado por `requireAuth`. Login (`auth.service.ts#login`) bloqueia
  usuário banido **depois** de `verifyPassword` confirmar, nunca antes —
  não revela que a conta está banida pra quem não sabe a senha.
- **Gotcha de RLS real, não teórico, achado testando esta fatia fim a
  fim**: `DELETE FROM direct_messages WHERE id=...` como ADMIN (policy
  `direct_messages_admin_delete`, `USING role='ADMIN'`, e `GRANT DELETE`
  ambos corretos) afetava **0 linhas**, enquanto o mesmo padrão em
  `posts`/`comments`/`news_comments`/`chat_messages` funcionou de primeira.
  Causa raiz: pra `UPDATE`/`DELETE`, o Postgres exige que a linha também
  seja visível pela **policy de SELECT** da tabela (é o SELECT que
  alimenta o scan que localiza as linhas candidatas) — não basta só a
  policy do próprio comando. `chat_messages_admin_delete` "funcionava por
  acidente" porque `chat_messages_authenticated_select` já é "qualquer
  sessão autenticada" (sempre verdadeiro pra sessão do admin);
  `direct_messages_participant_select` exige `sender_id`/`recipient_id` =
  sessão, e o admin normalmente não é participante da conversa que está
  moderando. Fix: policy de SELECT aditiva pra admin em `direct_messages`
  (migration própria, `direct_messages_admin_select_policy`, criada depois
  de reproduzir o bug num `psql` isolado — comparação direta com
  `chat_messages`, que tem a mesma forma de policy de DELETE mas SELECT
  "qualquer autenticado", foi o que expôs a causa raiz). Vale como alerta
  geral: **qualquer** tabela onde a policy de DELETE/UPDATE admin é mais
  permissiva que a de SELECT correspondente tem esse mesmo risco — cobrir
  com teste fim a fim real (nunca só lint/tsc), mesmo padrão de outros
  gotchas de RLS já documentados aqui.
- **Bug de leak de dado sensível pego no teste, não no code review**:
  `PATCH /users/:id/moderation` devolvia a linha inteira de `User`
  (`tx.user.update({ where, data })` sem `select`), **incluindo
  `passwordHash`**, direto no corpo da resposta JSON — só percebido lendo a
  resposta crua de um `curl` de teste. Fix: `select` explícito em
  `users.repository.ts#updateUserModeration`, mesmo shape público de
  `listAllUsersForAdmin` (nunca devolver a linha de `User` sem `select` em
  nenhum endpoint, mesmo quando o Prisma Client não reclama de tipo — o
  TypeScript não pega esse tipo de vazamento entre o shape real devolvido
  pelo Prisma e o tipo esperado do lado do frontend).
- **`modules/users/`** ganhou as primeiras rotas admin (`GET /users`,
  `PATCH /users/:id/moderation`) — até esta fatia só tinha `/me` self-
  service. Não é RF-16 completo (sem editar perfil/excluir conta por
  admin), só o necessário pra reverter ban/mute a partir de
  `/admin/usuarios`. `reports.service.ts` chama `usersRepository`
  diretamente (`updateUserModeration`, estendendo o import named já
  existente de `findProfileByUserId` — não introduz um segundo estilo de
  import `* as usersRepository` neste arquivo) dentro do **mesmo**
  `withRls` que resolve a denúncia, nunca `usersService` (que abriria uma
  segunda transação desconectada, quebrando a atomicidade "moderar autor +
  marcar denúncia resolvida").
- **Contestação de resultado (RF-19) — mutação in-place, não anulação +
  nova partida**: `Match` já tinha campos reservados (`voidedAt`/
  `voidedReason`/`status: VOIDED`/`correctedFromMatchId`, self-relation
  `MatchCorrection`) de uma modelagem especulativa anterior a este módulo
  existir — nenhum código lia/escrevia neles. RF-19 não usa esses campos:
  `matches.service.ts#correctMatchResult` (`PATCH /matches/:id/result`,
  `POST` continua sendo o registro write-once original) segue o mesmo
  padrão da moderação (RF-25) — atualiza a linha existente e guarda o
  histórico (valor antigo/novo) só no `AuditLog`
  (`MATCH_RESULT_CORRECTED`, metadata com o diff completo + `reason`
  obrigatório, mesma convenção `min(5)/max(500)` de
  `reports.schemas.ts`/`users.schemas.ts`). `matchesRepository
  .correctMatchResult` é uma função nova separada de `updateMatchResult`
  — não toca `status`/`playedAt` (a partida já está `COMPLETED` e o
  `playedAt` original não deve mudar, é correção, não um novo jogo).
- **Escopo travado a torneio `IN_PROGRESS`**: pontos (`PointsTransaction`)
  e `Registration.finalPlacement` só existem a partir de
  `completeTournament`, calculados uma única vez (ver bullet de
  colocação final acima) — corrigir depois disso exigiria reverter
  ledger append-only (sem UPDATE, ver bullet de RLS de
  `points_transactions`) e recalcular colocação, então
  `correctMatchResult` rejeita (409) qualquer torneio que não esteja
  `IN_PROGRESS`. Fica para uma fatia futura.
- **Cascata de correção limitada a exatamente 1 nível**:
  `registrationAId`/`registrationBId` de partidas futuras são snapshots
  copiados na criação (ver bullet de semântica de `BracketSlot`/`Match`
  acima), não derivados — corrigir o vencedor de uma partida cujo
  resultado já avançou pra rodada seguinte exige propagar o snapshot.
  `correctMatchResult` localiza a partida seguinte reaproveitando
  exatamente a mesma matemática de
  `bracket-generator.ts#maybeCreateNextRoundMatch` (`targetSlot` = slot
  de destino da partida corrigida → `nextSlot` na rodada seguinte →
  `findMatchByBracketSlotId`), não uma busca por `registrationId` (que
  seria ambígua — o mesmo jogador aparece em `registrationAId`/`BId` de
  partidas anteriores também). Se a partida seguinte ainda não existe
  (par irmão não preenchido) ou existe e está `SCHEDULED`, a correção
  propaga automaticamente (`matchesRepository.updateMatchParticipant`,
  no lado `A`/`B` determinado pela paridade de `targetSlot.position`,
  mesma regra de `maybeCreateNextRoundMatch`); se a partida seguinte já
  está `COMPLETED`, rejeita (409) — cascata de mais de 1 nível
  (corrigir uma partida cujo vencedor errado já jogou E venceu mais uma
  rodada) fica pra uma fatia futura, o admin precisa corrigir a partida
  seguinte primeiro.
- **Editar/excluir dados de players (RF-16) — soft delete via campo já
  reservado no schema**: `User.deletedAt` existia desde a Fase 1 mas
  nenhum código escrevia nele — já era lido por
  `app_points_leaderboard()`/`app_dm_recipient_display_name()`
  (`deleted_at IS NULL`), confirmando soft delete como o caminho já
  esperado pelo resto do sistema, não um `DELETE` físico (que quebraria
  por FK restritiva em qualquer player com histórico — só
  `Profile`/`Address` têm `onDelete: Cascade` contra `User`, e não existe
  policy de RLS `FOR DELETE ON users` em nenhuma migration). Exclusão é
  **reversível** (decisão de produto, mesmo padrão de ban/mute): reaproveita
  a MESMA rota `PATCH /users/:id/moderation` (RF-25) com um terceiro campo
  `deleted: boolean`, em vez de uma rota `DELETE`/`restore` dedicada —
  soft delete reversível com motivo é exatamente a mesma natureza de
  "ação administrativa" que a rota já cobre; o guard de auto-ação já
  existente (`targetUserId === actor.id → 400`) cobre auto-exclusão de
  graça. **Nenhuma migration nova foi necessária** (campo já existe,
  `users_self_or_admin_update` já libera admin pra qualquer coluna).
- **`deletedAt` é uma flag independente de `isActive`, não sobreposta**:
  `auth.middleware.ts#requireAuth` e `auth.service.ts#login` checam as
  duas condições separadamente (`!user.isActive || user.deletedAt`),
  mesma mensagem genérica de "conta suspensa" nos dois casos (não revela
  publicamente ban vs. exclusão pra quem já tem JWT válido ou tentando
  logar). Consequência intencional: um usuário banido-E-excluído precisa
  das DUAS reversões (`isActive: true` E `deleted: false`) pra voltar a
  logar — restaurar sozinho não basta se ele também estava banido.
  Testado explicitamente esse caso combinado (não só os dois isolados).
- **Edição de dados (username/e-mail/perfil) é endpoint novo** (`PATCH
  /users/:id`, `adminUpdateUserSchema` em `users.schemas.ts`) —
  **sem guard de auto-edição**, diferente de `moderateUser`: editar o
  próprio username/perfil não é perigoso como auto-banir (o admin já
  pode fazer isso via `/me`). Reaproveita quase 100% do shape de
  `updateProfileSchema`/`usersRepository.updateProfile` já existente pro
  self-service, só acrescentando `username`/`email` (superfície nova,
  nenhum outro lugar do sistema editava essas duas colunas até aqui) e
  `reason` obrigatório. `changes` (diff campo a campo, só o que
  realmente mudou vs. valor atual) vai pro `AuditLog`
  (`USER_EDITED_BY_ADMIN`) — mesma convenção de "só loga o que mudou" de
  `moderateUser`.
- **Gotcha real de `error.meta.target` do Prisma sob role com RLS**: a
  primeira versão tentava um único `tx.user.update({ data: { username,
  email } })` e diferenciar qual campo colidiu (P2002) inspecionando
  `error.meta.target` — funciona perfeitamente testado direto com a role
  `aet_hub_owner` (`meta.target: ["username"]`), mas sob a role da
  aplicação (`aet_hub_app`, a que toda request real usa via `withRls`)
  o Postgres **não devolve o target** (`meta.target: null`), fazendo o
  catch sempre cair no fallback genérico. Fix: `updateUserAccountFields`
  chamado em **duas transações internas separadas** (uma só com
  `username`, outra só com `email`) quando os dois campos vêm no
  payload — o P2002 pego em cada catch isolado é necessariamente sobre
  aquele campo específico, sem depender de metadata nenhuma. Achado só
  no teste real via `curl` contra o servidor rodando (não reproduzia
  num script standalone com a role owner) — mais um caso do padrão já
  documentado aqui de que só verificação fim a fim pega esse tipo de
  coisa.
- **Log de auditoria (RF-06) — só leitura, zero migration**: `AuditLog` já
  era escrito desde RF-19/RF-25 (`recordAuditLog`) e a RLS
  (`audit_logs_admin_select`) já existia desde a migration `rls_policies`
  da Fatia 1 — o dado só estava inacessível por falta de endpoint.
  `modules/audit-logs/` é o primeiro módulo do projeto **sem nenhuma rota
  de escrita própria** (toda gravação continua vindo de dentro do
  `withRls` de quem dispara a ação administrativa, nunca deste módulo).
  `action`/`entityType` são `String` livre no Prisma (não enum) — o
  filtro (`GET /audit-logs?action=X&entityType=Y`) é igualdade simples,
  sem whitelist server-side (diferente do `VALID_REPORT_STATUSES` de
  `reports.controller.ts`, que valida contra um enum Prisma de verdade);
  a única fonte de valores válidos é o dropdown do frontend. Include de
  `actor` (`select: { id, username, profile: { displayName } }`) não
  esbarra no gotcha de relação obrigatória + RLS já documentado acima —
  `actorUserId` só aponta pra usuários `ADMIN` (só ação administrativa
  gera log), e `users_admin_visible_to_authenticated` já libera qualquer
  sessão autenticada a ver linhas com `role = 'ADMIN'`.
- **Seguir players (RF-41) — snapshot denormalizado igual DM/Report, sem
  função `SECURITY DEFINER` nova**: `Follow` (`modules/follows/`) não tem
  nenhuma relation Prisma pra `User` (mesmo motivo de `ChatMessage`/
  `DirectMessage`/`Report`: RLS de `users`/`profiles` é self/ADMIN/
  colega-de-torneio, e qualquer player pode seguir qualquer outro a
  partir de `/ranking`, que expõe todo mundo). `followingDisplayName` é
  resolvido **reaproveitando** `app_dm_recipient_display_name()` (a
  função já existente da DM, chamada via `findRecipientDisplayName`
  importado direto de `direct-messages.repository.ts`) — o comportamento
  (nome de conta ativa, bypassando RLS como fronteira estreita) é
  exatamente o mesmo, não precisou de função nova nem duplicar a query.
  `followerDisplayName` vem do próprio `Profile` do ator (sempre
  autovisível), igual ao `senderDisplayName` do chat. RLS de `follows`:
  três policies self-only (`follower_id = sessão OR following_id =
  sessão` cobre as duas listas numa policy de SELECT só), sem GRANT de
  UPDATE (relação binária, mesmo padrão de `post_likes`) — `unfollow` é
  `deleteMany` (idempotente por design, o service decide 404 pelo
  `count` em vez de depender de exceção do Prisma). Notificação
  `FOLLOWED` segue o molde de `POST_COMMENT` em `app_create_notification`
  (`EXISTS` contra a linha `follows` que autoriza); gotcha de enum já
  documentado (`ALTER TYPE ADD VALUE` e o `CREATE OR REPLACE FUNCTION`
  que o usa em migrations separadas) respeitado com o par `add_follows` /
  `follows_rls_policies`. **Fora de escopo de propósito** (mesmo corte de
  RF-40 Fatia A/B): feed de atividade dos seguidos, contagem de
  seguidores em perfil de terceiros (não existe perfil público de outro
  player hoje) e rate limiter dedicado. Testado fim a fim via
  `claude-in-chrome` com dois players reais criados via `POST
  /auth/register` (CEP real de Alegrete obtido da própria ViaCEP): seguir
  pelo `/ranking`, notificação chegando pro seguido, listas "Seguindo"/
  "Seguidores" no `/perfil` dos dois lados, unfollow pela lista, guard de
  auto-seguir (400) e de duplicata (409) via `curl`. Dados de teste
  removidos via `psql` direto (`docker exec aet-hub-postgres-1 psql`,
  usuários com follows/notifications sem FK cascade — apagados na ordem
  notifications → follows → users).
- **Sistema de níveis (XP) e conquistas (RF-29)** — três tabelas novas
  (`Achievement` catálogo admin-managed; `UserAchievement` evento de
  desbloqueio, sem relation pra `User` pelo mesmo motivo de `Follow`/
  `Report`; `XpTransaction`, ledger append-only que espelha
  `PointsTransaction` de propósito). **XP é moeda de progressão
  totalmente separada de pontos/moedas** — valores fixos
  (`modules/xp/xp-constants.ts`: `MATCH_WIN=50`, `MATCH_LOSS=10`,
  `PARTICIPATION=25`, `PLACEMENT` por tier `{1:200,2:120,3:80}`),
  independentes de `pointsPerWin`/`pointsPerLoss`/`bonusPoints`
  configuráveis por torneio — decisão tomada com o usuário via
  `AskUserQuestion` (alternativa seria XP = mesmo valor dos pontos).
  **Nível nunca é armazenado**, sempre derivado de `SUM(XpTransaction
  .amount)` via `xp-level-calculator.ts#levelFromXp` (fórmula flat,
  `XP_PER_LEVEL=500`: `level = floor(totalXp/500)+1`) — mesmo princípio
  de saldo derivado já usado em `PointsTransaction`.
  **Avaliação de conquistas só no fechamento do torneio**
  (`completeTournament`, mesmo hook onde `buildPointsTransactionEntries`
  já roda), catálogo deliberadamente pequeno nesta fatia — só 3 códigos
  hardcoded (`FIRST_TOURNAMENT`/`FIRST_WIN`/`CHAMPION`) que o
  `achievement-evaluator.ts` (pura, sem acesso a banco, testável como
  `placement-calculator.ts`) reconhece; `Achievement.code` é a chave de
  lookup, imutável após criação — critério de desbloqueio é código, não
  dado, então o admin só edita apresentação (nome/descrição/raridade/
  ativo). **Não retroativo**: torneios concluídos antes desta fatia não
  geram XP/conquista. `FIRST_WIN`/`FIRST_TOURNAMENT` usam contagem
  "prévia" (antes desta finalização) — `xp.repository
  .countPriorMatchWinsByUserIds` funciona só por ser chamado ANTES do
  insert das entries desta finalização; já
  `tournaments.repository.countPriorCompletedTournamentsByUserIds`
  precisa excluir explicitamente o próprio torneio sendo encerrado
  (`tournamentId: { not: id }`), porque `applyFinalPlacements` já rodou
  antes e teria inflado a contagem em 1 pra cada participante.
  **RLS catalog-style totalmente aberta** nas três tabelas (`SELECT
  USING (true)`, mesmo padrão de `games`/`store_items`/`communities`) —
  decisão de produto desta fatia: nível/XP/conquistas são "exibidos no
  perfil público" de qualquer player, não só o próprio. `user_achievements`/
  `xp_transactions` só têm `INSERT` admin (nunca UPDATE/DELETE, imutável)
  — e diferente de `follows`/notificações (actor é um player comum, por
  isso função `SECURITY DEFINER`), aqui o actor de `completeTournament`
  já É o admin, então uma policy direta `WITH CHECK (role = 'ADMIN')`
  basta, sem precisar de função definer pra essas escritas.
  **Perfil público de terceiros** (`GET /users/:id/public`, gap que RF-41
  tinha deixado de propósito fora de escopo) precisou de DUAS funções
  `SECURITY DEFINER` novas (migration própria
  `public_profile_read_functions`, mesmo formato de
  `points_leaderboard_function`): `app_public_profile_snapshot(target_user_id)`
  (mesmo filtro de inclusão de `app_points_leaderboard`: `role='PLAYER'
  AND is_active AND deleted_at IS NULL` — banido/excluído vira 404, nunca
  vaza email/passwordHash/CEP) pra atravessar a RLS de `users`/`profiles`
  (self/ADMIN/colega-de-torneio, não cobre "terceiro qualquer"), e
  `app_follow_counts(target_user_id)` (só contagens, já que
  `follows_self_select` bloqueia um terceiro de ver o par de outra
  pessoa). Dois `NotificationType` novos (`ACHIEVEMENT_UNLOCKED`/
  `LEVEL_UP`, PRD pede "feedback visual ao... subir de nível") seguindo o
  gotcha de enum já documentado (`ALTER TYPE ADD VALUE` + `CREATE OR
  REPLACE FUNCTION` em migrations separadas): `ACHIEVEMENT_UNLOCKED` com
  `EXISTS` contra a `user_achievements` recém-criada (`refId` = id da
  linha, já que `createMany` não devolve id — por isso o insert de
  unlock é `create` em loop, não `createMany`, volume pequeno o bastante
  pra não importar); `LEVEL_UP` reaproveita o predicado de
  `TOURNAMENT_COMPLETED` (`refId` = id do torneio). Seed de 3 conquistas
  via `seedPrisma.achievement.upsert` (mesmo padrão de `games`).
  **Decisões tomadas com o usuário via `AskUserQuestion`** antes de
  planejar: também construir o perfil público de terceiros nesta fatia
  (não só `/perfil`); XP fixo por evento (não atrelado a pontos); infra
  genérica + poucas conquistas de exemplo (não um catálogo grande com
  gatilhos fora de torneio); ranking (`/ranking`) NÃO ganha coluna de
  nível (mantém `app_points_leaderboard()` estreito).
  **Testado fim a fim via script Node ad-hoc + `claude-in-chrome`**: 4
  players reais, torneio completo até o encerramento — XP/conquistas
  corretos por posição (campeão com as 3, semifinalistas só
  `FIRST_TOURNAMENT`), um segundo cenário com 2 torneios extras
  confirmando `LEVEL_UP` e as 3 notificações `ACHIEVEMENT_UNLOCKED` reais
  (via `curl`/API direta); perfil próprio (`/perfil`) e perfil público de
  outro player a partir do link novo em `/ranking` renderizando
  corretamente (barra de XP segmentada, lista de conquistas com raridade,
  botão seguir), admin CRUD de conquistas (`/admin/conquistas`) criando/
  editando/desativando. Dados de teste (torneios `Torneio RF29*` +
  usuários `rf29p1..4`) removidos via `psql` direto (ordem: notifications
  → points_transactions → xp_transactions → user_achievements → matches
  → bracket_slots → checkins → registrations → tournaments → follows →
  users).
- **Armário cosmético — bordas e títulos (fatia 1)**: três tabelas novas
  (`CosmeticItem` catálogo, RLS estilo `achievements`/`store_items`;
  `UserCosmeticItem` posse por compra, sem relation Prisma pra `User`,
  mesmo motivo de `Follow`/`Report`) + `CosmeticRarity`
  (COMMON/RARE/EPIC/LEGENDARY, enum próprio — diferente de
  `AchievementRarity`, que só tem COMMON/RARE) + `COSMETIC_PURCHASE` em
  `PointsTransactionType`. `CosmeticItem` tem `@@unique([kind, name])`
  só pra permitir `upsert` idempotente no seed. Posse de item **derivada**
  na leitura, nunca duplicada em `UserCosmeticItem`: item grátis padrão
  (`priceInPoints === 0 && !unlockAchievementCode`) ou item
  achievement-linked (existe `UserAchievement` do código correspondente)
  são calculados em `cosmetics-ownership.ts` (função pura); só compra real
  grava linha. `PointsTransaction.userCosmeticItemId` espelha
  `redemptionId` 1:1. Módulo `modules/cosmetics/` clona `modules/games/` +
  `modules/store/` (`pg_advisory_xact_lock('cosmetic_purchase:' || userId)`,
  namespace próprio pra não serializar à toa contra resgates da loja).
  `PATCH /cosmetics/loadout` precisa estar registrada **antes** de `/:id`
  no router — senão a rota parametrizada de update-admin engole
  `/cosmetics/loadout` tratando `"loadout"` como id.
- **Gotcha de migration real: `CREATE OR REPLACE FUNCTION` não muda o shape
  do `RETURNS TABLE`**: estender `app_public_profile_snapshot` (pra
  acrescentar `equipped_frame_id`/`equipped_title_id`) via `CREATE OR
  REPLACE` falhou com 42P13 ("cannot change return type of existing
  function") — Postgres não aceita alterar os OUT parameters de uma função
  existente assim, mesmo só acrescentando coluna no fim. Precisa de `DROP
  FUNCTION` explícito antes do `CREATE` (e reaplicar `REVOKE`/`GRANT`, que
  não sobrevivem ao drop), os dois na mesma migration/transação. Vale pra
  qualquer função `SECURITY DEFINER` que ganhe coluna nova no retorno —
  `app_create_notification` nunca bateu nisso porque seu retorno
  (`RETURNS notifications`, uma linha da própria tabela) nunca mudou de
  shape.
- **Armário cosmético — propagação pro resto do produto (fatia 2)**: os 4
  pontos de leitura usam mecanismos diferentes, não um padrão único
  repetido. Ranking: `app_points_leaderboard()` estendida (mesmo
  `DROP FUNCTION` + `CREATE` acima) com `equipped_frame_id`/
  `equipped_title_id`. Chave: zero migration —
  `matches.repository.ts#registrationSeatSelect` já selecionava
  `profile.displayName`, só precisou acrescentar `equippedFrame`/
  `equippedTitle` no mesmo `select` aninhado (`cosmetic_items` é catálogo
  público). Chat geral + posts/comentários: zero query nova — os services
  já buscavam o próprio `Profile` (que já inclui o loadout) antes de
  gravar `senderDisplayName`/`authorDisplayName`; só passou a gravar mais
  3 campos como **snapshot** em colunas novas (`senderFrameClassName`/
  `senderTitleName`/`senderTitleRarity` em `ChatMessage`;
  `authorFrameClassName`/`authorTitleName`/`authorTitleRarity` em
  `Post`/`Comment`) — className/nome/raridade diretos, não FK pra
  `cosmetic_items`, pra mensagem sobreviver a item desativado/editado
  depois. DM ficou de fora (bolha de DM nem mostra `senderName` hoje).
  **Assimetria por design, não bug**: ranking/chave mostram o loadout AO
  VIVO (recalculado a cada request); chat/comunidade mostram um SNAPSHOT
  congelado no momento do envio — mesma semântica que
  `senderDisplayName`/`authorDisplayName` já tinham.
- **`PUT /tournaments/:id` não pode mais setar `IN_PROGRESS`/`COMPLETED`**:
  bug real descoberto em produção local — o admin usava a troca rápida de
  status (`useQuickStatusChange`, PUT genérico) pra mover um torneio de
  `CHECKIN_OPEN` direto pra `IN_PROGRESS`, o que só troca o campo
  `status` sem gerar `BracketSlot`/`Match` nenhum (só `POST
  /tournaments/:id/start` faz isso de verdade). Resultado: o torneio
  "Tekken 8 (cópia)" ficou marcado `IN_PROGRESS` pra sempre sem chave.
  `updateTournamentSchema` (`tournaments.schemas.ts`) agora restringe
  `status` a `MANUALLY_SETTABLE_STATUSES` (tudo exceto `IN_PROGRESS`/
  `COMPLETED`) via `.refine`, rejeitando com 400 — essas duas transições
  só acontecem pelos fluxos dedicados (`POST /:id/start`/`POST
  /:id/complete`). Ver bullet correspondente em "Padrões do frontend"
  pros botões que substituem a troca rápida pra esses dois casos.

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
- **Feed principal (RF-36) — widget na Home, não rota própria**: a pedido
  do usuário, o feed de notícias fica embutido em `HomePage.tsx`
  (`<NewsFeedSection />`, `components/feed/NewsFeedSection.tsx`, arquivo
  próprio — não inline na página como o composer de Comunidades, porque
  esta seção soma estado de abas + lista + thread de comentário
  expansível por card, um degrau de complexidade acima do composer
  simples). Sem item novo em `NAV_ITEMS` — não é um destino de produto
  separado. `NewsComment` é o nome do tipo em `types/feed.ts` — **nunca
  `Comment`**, mesma armadilha do `PostComment`/`AppNotification`.
- **Estado de expansão por card é `Record<newsItemId, boolean>`**, não
  `useState` por card nem um `expandedId` único: a lista vem de query
  (dinâmica, não um número fixo de irmãos JSX) e não há requisito de só
  uma notícia expandida por vez — o usuário pode comparar comentários de
  duas notícias ao mesmo tempo. Comentários de cada card só disparam
  query (`useNewsComments(newsItemId, enabled)`) quando o card é
  expandido — evita uma query por notícia visível na Home de uma vez só.
- **Sem componente de aba/pill reutilizável no projeto** — o toggle
  Novidades/E-sports (`CategoryToggleButton`, dentro do próprio
  `NewsFeedSection.tsx`) é o primeiro, mínimo, usando os tokens já
  existentes (`bg-ember` ativo vs. `ring-1 ring-silver/20` inativo); não
  criar um componente genérico em `components/ui/` até haver um segundo
  uso real.
- **Denúncia de conteúdo (RF-40, Fatia A) — `ReportForm` único
  reaproveitado nas 4 superfícies de conteúdo**
  (`components/reports/ReportForm.tsx`, props `contentType`/`contentId`):
  colapsado é só um botão "Denunciar" inline no action row existente
  (`isOwner ? <botão Excluir> : <ReportForm />`, mesma posição que
  Excluir ocupava — nunca os dois juntos, dono não denuncia o próprio
  conteúdo); expandido é um textarea inline com contador/Cancelar/Enviar;
  sucesso substitui o próprio componente por um rótulo estático "Denúncia
  enviada" — **sem modal nenhum**, porque nenhum existe no projeto hoje
  (todo fluxo "além de confirm simples" até agora era navegação de página
  cheia; este é o primeiro caso de expand-inline reutilizável entre
  telas, mesmo princípio do expand-by-id de `NewsFeedSection`, só que
  como componente próprio em vez de estado local por página). Prop
  `triggerClassName` (opcional) deixa o CHAMADOR alinhar só o botão
  colapsado (ex. `ml-auto`) sem acoplar isso ao componente — o painel
  expandido sempre carrega `basis-full` (quebra pra linha própria dentro
  de um container `flex flex-wrap`, sem espremer os botões vizinhos)
  independente de como o gatilho foi alinhado.
- **`MessageBubble` ganha a primeira ação por mensagem do projeto** — até
  esta fatia era puro apresentacional (`mine`/`senderName`/`content`/
  `createdAt`, sem nenhum botão). Ganhou `id` + `reportContentType:
  'CHAT_MESSAGE' | 'DIRECT_MESSAGE'` (o mesmo componente serve chat geral
  e DM, só o tipo denunciado muda — reaproveitado tal qual já era);
  `ReportForm` renderiza só quando `!mine`. Gotcha real batido aqui: o
  wrapper do timestamp era um `<p>`, e `ReportForm` pode devolver um
  `<div>` (painel expandido) — `<div>` dentro de `<p>` é HTML inválido
  (o browser fecha o `<p>` cedo demais, quebrando o layout
  silenciosamente); trocado pra `<div>` antes de adicionar a ação. Vale
  como lembrete geral: qualquer wrapper `<p>` que vá hospedar um
  componente cujo estado pode virar bloco precisa ser `<div>` primeiro.
- **Página `/admin/denuncias`** (`AdminReportsPage.tsx`) segue o mesmo
  molde de `AdminRedemptionsPage.tsx` (abas de filtro por status, tabela,
  `window.confirm` na ação, `useDismissReport` invalidando
  `['admin-reports']`) — sem ação de conteúdo/usuário na tabela ainda
  (só "Dispensar"), reflexo direto do escopo cortado da Fatia A no
  backend. Nav item `Admin Denúncias` segue o padrão exato dos outros 3
  itens admin (`icon: Shield`, prefixo "Admin ").
- **Página `/admin/jogos`** (`AdminGamesPage.tsx`/`AdminGameFormPage.tsx`/
  `GameForm.tsx`) clona o molde de `AdminStoreItemsPage`/
  `AdminStoreItemFormPage` (listagem com ativar/desativar + página
  separada de criar/editar) — form só com `name`/`isActive` (slug não é
  campo, é gerado no backend). **Sem** `GET /games/:id` no backend: a
  tela de edição reaproveita a query já cacheada de `useAdminGames()` e
  faz `.find(id)`, mesmo truque de `AdminStoreItemFormPage` — evita
  endpoint novo só pra isso. `useGames()` (consumido por `TournamentForm`/
  `ProfileEditPage`/`AdminCommunityFormPage`) é invalidado pelas mutations
  de `useAdminGameMutations.ts` — um jogo criado/desativado no admin
  reflete nesses três formulários sem nenhuma mudança neles.
- **Moderação de conteúdo (RF-25, Fatia B) — frontend**: `AdminReportsPage.tsx`
  ganhou 3 botões novos na célula de Ações (Remover conteúdo/Silenciar
  autor/Banir autor, ao lado de Dispensar) e `/admin/usuarios`
  (`AdminUsersPage.tsx`, novo, clona o molde de `AdminGamesPage.tsx`) —
  listagem + toggle de ban/mute, sem tela de criação/edição de usuário
  (RF-16 completo fica pra depois). Motivo é capturado via `window.prompt`,
  não expansão inline: é a extensão mínima da mesma família de diálogo
  nativo que `window.confirm` já usa em toda ação de moderação do projeto
  (sem modal em lugar nenhum do código) — o painel expandido de
  `ReportForm.tsx` não cabe numa célula de tabela densa sem redesenhar a
  tabela inteira. `ReportStatus` do frontend ganhou `RESOLVED` (label
  "Resolvida", tone `accent`) espelhando o enum novo do backend.
- **Contestação de resultado (RF-19) — frontend**: `BracketMatchCard.tsx`
  ganha uma segunda affordance inline (sem modal, mesmo padrão do form de
  registro) — botão "Corrigir resultado" quando `match.status ===
  'COMPLETED'` (só admin), abrindo o mesmo par radio+placar do form de
  registro, pré-preenchido com o resultado atual, mais um `<textarea>` de
  motivo com contador `{length}/500` — mesmo componente visual de
  `components/reports/ReportForm.tsx` (`MIN_REASON_LENGTH = 5`,
  `MAX_REASON_LENGTH = 500`), só que inline no próprio arquivo (não
  reaproveita `ReportForm` porque o schema de payload é outro — vencedor/
  placar/motivo, não `contentType`/`contentId`/motivo). Os campos
  vencedor+placar viraram um componente local `ResultFields` (não
  exportado, só usado dentro deste arquivo) pra não duplicar o
  fieldset/inputs entre os dois forms. **Sem gate client-side pelo status
  do torneio**: `BracketPage` não busca dados do torneio hoje, só do
  bracket, e não existe um hook de leitura pública de um único torneio —
  confia no 409 do backend (torneio não é mais `IN_PROGRESS`, ou a
  partida seguinte já foi disputada) mostrado no mesmo `<Banner
  variant="error">` inline do form, sem introduzir endpoint/hook novo só
  pra essa checagem (caso raro: só acontece se o admin tentar corrigir
  depois do torneio já ter sido encerrado).
- **Editar/excluir dados de players (RF-16) — frontend**: `AdminUserForm.tsx`
  (novo) segue o padrão `useState` controlado de `ProfileForm.tsx` (não
  `react-hook-form` — mesmo racional já documentado: bom pra formulários
  com poucos campos escalares sem array dinâmico), com campos extras de
  `username`/`email` e um **motivo obrigatório inline no próprio
  formulário** (`textarea` com contador `{length}/500`, mesmo estilo
  visual de `ReportForm.tsx`/contestação de resultado) — decisão
  deliberada de divergir do `window.prompt()` usado em Banir/Silenciar/
  Excluir (ações rápidas de uma linha da tabela): um formulário completo
  já em andamento torna um prompt separado no submit destoante.
  `AdminUserEditPage.tsx` clona o molde de `AdminGameFormPage.tsx`
  (**sem `GET /users/:id` novo** — reaproveita `useAdminUsers()` já
  cacheada e faz `.find(id)`), mas **sem modo "create"** (RF-16 não cria
  usuário, isso já é cadastro público). `toPayload` só inclui no
  `AdminUpdateUserPayload` os campos que realmente mudaram vs. o
  `AdminUser` original (mesmo espírito do diff de `changes` no backend)
  — evita disparar um 409 de duplicata reenviando o próprio
  username/email inalterado do alvo.
- **`AdminUsersPage.tsx` ganha um terceiro par de ação** (Excluir/
  Restaurar, ao lado de Banir/Silenciar já existentes) reaproveitando o
  mesmo fluxo `window.confirm` → `promptReason()` → `moderateUser.mutate`
  com `payload: { deleted, reason }` — sem nenhuma mutation nova (a
  mesma `useModerateUser` já cobre os três flags). Chip novo
  `deletedStatusChip` (`utils/format.ts`) difere dos outros dois helpers
  de chip do arquivo (`activeStatusChip`/`mutedStatusChip`) por
  devolver `null` (não renderiza nada) quando o usuário não está
  excluído, em vez de sempre ter os dois estados — usuários excluídos
  continuam visíveis na listagem (sem paginação, sem filtro/toggle
  novo), só ganham o chip extra ao lado do chip de conta e a linha
  esmaecida (`opacity-50` estendido pra `!isActive || deletedAt`).
  Link "Editar" novo na coluna de ações, mesmo estilo visual dos botões
  vizinhos.
- **Testado fim a fim via Playwright** (extensão Chrome não conectada
  nesta sessão, mesmo gotcha já visto na fatia RF-19 — script Node
  ad-hoc, não fica no repo): login admin, navegação até
  `/admin/usuarios` **via clique no link de nav, não `page.goto()`**
  (gotcha de sessão já documentado — reload aborta o `GET /users/me` da
  reidratação), edição com campos pré-preenchidos corretamente
  (username/email do alvo, não do admin), troca de jogo favorito via
  select populado por `useGames()`, motivo preenchido, salvar e
  confirmar retorno à lista com o novo `displayName` refletido; 409 de
  duplicata de username renderizado como erro no formulário sem crash
  (permanece na tela de edição); toggle Excluir → chip "Excluído"
  aparece e linha esmaece → Restaurar → chip some. Dados de teste
  (`rf16p1`/`rf16p2`, renomeados durante os testes) removidos do banco
  ao final via `psql` direto.
- **Página `/admin/auditoria` (RF-06)** — primeira tela do projeto com
  DOIS filtros independentes (ação × entidade) em vez do padrão de um só
  filtro por abas de status (`AdminReportsPage`/`AdminRedemptionsPage`):
  dois `<select>` simples em vez de pills, porque são dimensões
  ortogonais (combinam com AND) e listar todo par ação×entidade como pill
  não escalaria. Sem nenhuma ação na tabela — é a primeira tela
  puramente somente-leitura do admin (nenhum botão/mutation). `action`/
  `entityType` sendo string livre na API (ver bullet do backend) levou a
  `auditLogActionLabel`/`auditLogEntityTypeLabel` em `utils/format.ts`
  serem **funções** com fallback pro valor bruto, não `Record<Enum,
  string>` direto como os outros mapas do arquivo — uma ação nova de
  fatia futura aparece na tabela sem tradução em vez de quebrar. Coluna
  "Detalhes" mostra `metadata.reason` quando presente (todo `recordAuditLog`
  do projeto até hoje inclui `reason`) ou o JSON bruto como fallback —
  sem parser por tipo de ação, o `metadata` varia de shape
  (`MATCH_RESULT_CORRECTED` inclui placar antes/depois,
  `USER_EDITED_BY_ADMIN` inclui `changes`) e não vale a pena uma tela por
  ação nesta fatia. **Testado fim a fim via Playwright** (extensão
  Chrome não conectada nesta sessão, mesmo gotcha das fatias anteriores
  — script Node ad-hoc em `node_modules` próprio no scratchpad, não no
  repo): login admin, navegação via clique em "Admin Auditoria" no nav
  (não `page.goto()`, mesmo motivo já documentado), listagem populada
  com o histórico real de todas as fatias anteriores (RF-19/RF-25/RF-16),
  filtro por `entityType=MATCH` reduzindo corretamente a lista às duas
  correções de partida já registradas antes desta fatia.
- **Duplicar torneio (RF-17) — fatia 100% frontend, zero mudança de
  backend**: `POST /tournaments` já aceitava o payload completo de criação
  e `GET /tournaments/:id` já retornava sponsors/placementRewards
  completos — "duplicar" é só ler o torneio de origem e reenviar como um
  `POST` novo, sem nenhum conceito de "template" persistido à parte.
  Disparado por um `<Link to={`/admin/torneios/novo?duplicarDe=${id}`}>`
  novo em `AdminTournamentsPage.tsx` (ao lado de "Editar", sem gate de
  status — qualquer torneio serve de origem, diferente de "Excluir" que só
  aparece em `DRAFT`). **Query param na rota de criação existente, não uma
  rota `:id/duplicar` dedicada**: duplicar é semanticamente uma criação
  (mesmo `mode="create"`, mesmo `POST`), só com fonte de pré-preenchimento
  diferente — um segundo `:id` com significado próprio colidiria com o
  `:id` já usado por `/admin/torneios/:id/editar` (sempre "torneio-alvo do
  CRUD"). `AdminTournamentFormPage.tsx` ganhou um terceiro ramo (além de
  criar/editar): lê `duplicarDe` via `useSearchParams`, busca o torneio de
  origem com o mesmo `useAdminTournament` já usado pela edição, e só monta
  `<TournamentForm>` depois que a origem (e os jogos) carregaram — mesmo
  princípio anti-bug de `<select>` vazio já documentado acima. Em
  `TournamentForm.tsx`, nova prop `sourceTournament?: TournamentDetail`
  (só usada com `mode === 'create'`) alimenta `toDuplicateDefaults`, função
  irmã de `toFormDefaults`/`emptyDefaults`: copia todos os campos
  escalares e sponsors/placementRewards (via os mesmos helpers
  `mapSponsorsForForm`/`mapPlacementRewardsForForm` extraídos de
  `toFormDefaults`, sem duplicar a lógica de descartar `id`), mas **nome
  sufixado** (`"${nome} (cópia)"`, editável) e **as 4 datas nascem
  vazias** — datas do torneio original quase certamente estão no passado,
  copiar cegamente não faz sentido de produto e forçaria o admin a mudar
  todas de qualquer forma. `status` nunca é copiado (sempre `DRAFT`, nem
  é enviado no create). `onSubmit`/`toSubmitFields` não mudam — o mesmo
  `CreateTournamentPayload` monta igual venha de `emptyDefaults()` ou
  `toDuplicateDefaults()`. Nada em `services/admin-tournaments.ts` muda:
  a conversão "origem → valores de formulário" é apresentação (mesmo
  lugar de `toFormDefaults`), diferente de `toUpdatePayload` ali (que
  converte pra payload de escrita da API). Testado fim a fim via
  `claude-in-chrome` real (não Playwright ad-hoc desta vez): torneio de
  teste com 1 sponsor + 1 placement reward, duplicado com sucesso — nome
  sufixado, jogo já selecionado no `<select>` (não em branco), datas
  vazias com erro "Campo obrigatório" ao tentar submeter sem preenchê-las,
  sponsors/placementRewards idênticos após preencher datas e salvar,
  torneio original intacto, id novo e distinto. Dados de teste removidos
  via `DELETE /tournaments/:id` direto pela API (ambos nasceram `DRAFT`,
  dispensou `psql`).
- **Seguir players (RF-41) — sem tela de perfil público, botão entra em
  `/ranking`**: único lugar hoje que lista todo mundo é `RankingPage.tsx`
  (via `app_points_leaderboard()`), que já tinha um ícone de ação por
  linha (`MessageCircle` → DM) — o botão de seguir/deixar de seguir
  (`UserPlus`/`UserCheck` de `lucide-react`) entra ao lado, mesmo padrão
  de toggle já usado em `CommunityPage.tsx`
  (`post.likedByMe ? unlikePost : likePost`), usando um `Set` construído
  de `useFollowing()` pra saber `isFollowing` por linha. `ProfilePage.tsx`
  ganhou duas seções nesta fatia — "Seguindo" (com botão "Deixar de
  seguir" por item) e "Seguidores" (só leitura) — mesmo estilo visual do
  "Histórico de torneios" já existente na página. `NOTIFICATION_ICONS`
  (`NotificationsPage.tsx`, `Record<NotificationType, ...>`) precisou da
  chave nova `FOLLOWED` (`UserPlus`) só pra manter a exaustividade do
  tipo — sem isso o TypeScript quebra a build.
- **Nível/XP/conquistas + perfil público de terceiros (RF-29)**: primeira
  rota do frontend pra ver outro player além de `/perfil` —
  `PublicProfilePage.tsx` nova (`/perfil/:userId`), com guard
  `<Navigate to="/perfil" replace>` quando `userId === user.id` (evita
  visão duplicada de si mesmo). `RankingPage.tsx` ganhou o primeiro link
  de uma linha pra um perfil (nome do player agora é `<Link>`, antes era
  texto plano) — decisão consciente de NÃO adicionar coluna de nível na
  tabela (levaria a estender `app_points_leaderboard()`, que é
  deliberadamente estreito), nível fica só nas telas de perfil.
  `LevelProgressBar.tsx`/`AchievementsList.tsx` (`components/`, não
  `components/ui/` — são componentes de domínio, não átomos genéricos)
  construídos uma vez e reaproveitados por `ProfilePage.tsx` (próprio) e
  `PublicProfilePage.tsx` (terceiro) — visual espelha
  `src-lovable/src/routes/profile.tsx` (barra segmentada de 10 blocos,
  `Math.round((xpIntoLevel/xpForNextLevel)*10)` blocos preenchidos;
  conquista com borda/fundo por raridade), trocando o glifo `★` cru do
  mock por `Star` de `lucide-react` (convenção do projeto: sempre
  `lucide-react`, nunca glifo literal). `AchievementForm.tsx` segue o
  padrão `react-hook-form` de `GameForm.tsx`, com um detalhe novo: campo
  `code` **disabled** em modo edição (só habilitado em criação) — é a
  primeira vez que um form do projeto trava um campo por modo em vez de
  omiti-lo, porque `code` precisa aparecer (documentando o valor
  imutável) mas nunca ser editável. `AdminAchievementsPage.tsx`/
  `AdminAchievementFormPage.tsx` espelham `AdminGamesPage.tsx`/
  `AdminGameFormPage.tsx` 1:1 (sem `GET /achievements/:id`, reaproveita
  `useAdminAchievements()` já cacheada + `.find(id)`, mesmo truque). Novo
  item `Admin Conquistas` em `NAV_ITEMS` (`AppLayout.tsx`), mesmo padrão
  dos outros itens admin.
- **Armário cosmético — design portado de `pixel-palette-pal-07`**:
  `src-lovable/pixel-palette-pal-07/src/routes/profile.tsx` trouxe um
  redesenho de `/perfil` inteiro (card de perfil customizável com
  banner/moldura/mascote sobrepostos, grid de cards de cosmético por
  raridade, toggle Visão geral/Personalizar, filtro por categoria dentro
  do armário) — portado fielmente, ver regra geral desta subpasta em
  "Documentação de produto". Categorias implementadas nesta fatia:
  **bordas (frame) + títulos (title)** — fonte, mascote, banner e efeitos
  (scanline/glow) ficam pra fatias futuras, ver próxima seção.
- **Armário cosmético — implementação (fatia 1)**: `CosmeticCloset.tsx`
  (componente novo, tabs Bordas/Títulos, grid de cards com
  Comprar/Equipar/Equipado/bloqueado-por-conquista) fica dentro da aba
  "Personalizar" de `ProfilePage.tsx` (toggle `overview`/`closet` no state
  local, botão no `PageHeader`). Avatar (própria página e
  `PublicProfilePage`) recebe a `className` do frame equipado no lugar do
  ring padrão; chip de título renderiza ao lado.
  `cosmeticRarityStyle`/`cosmeticRarityLabels` novos em `utils/format.ts`
  (4 tons, fora do sistema de 3 tons do `StatusChip` — raridade de
  cosmético é um conceito à parte). Admin:
  `AdminCosmeticsPage`/`AdminCosmeticFormPage`/`CosmeticForm.tsx` clonam
  `AdminGames*`/`GameForm` 1:1, nav item `Admin Cosméticos` depois de
  `Admin Conquistas`.
- **Armário cosmético — propagação pro resto do produto (fatia 2)**:
  `PlayerBadge.tsx` (componente novo, avatar compacto + `cosmeticRarityStyle`
  pro chip de título) é o primeiro avatar de qualquer tipo em
  ranking/chave/chat/comunidade — nenhuma das 4 tinha elemento de avatar
  antes desta fatia. Reaproveitado em `RankingPage` (nova coluna flex na
  célula "Player"), `BracketMatchCard` (`seatLabel` virou `SeatLabel`,
  componente), `MessageBubble` (só quando `!mine`, mesma condição de
  `senderName`), `CommunityPage`/`PostDetailPage` (post + comentário).
  Ver bullet correspondente em "Padrões do backend" pra semântica de
  loadout ao vivo (ranking/chave) vs. snapshot congelado (chat/comunidade).
  Fatias futuras documentadas, não implementadas: Banner + Efeitos (só
  `/perfil`/`/perfil/:userId`, exige ajustar `animate-scanline` pro
  `theme.css` real e portar animações novas de banner/efeito — mascote já
  portou `animate-mascot-bounce`/`animate-mascot-float` na fatia 3, ver
  bullet abaixo); itens de raridade lendário via torneio "Major"/temporada
  (bloqueado até esses conceitos existirem no produto); DM ganhando a
  mesma decoração (só se pedido); mapear `title-duelista` (e outros itens
  desbloqueados por conquista) pra um `Achievement.code` real (decisão de
  conteúdo pendente).
- **Armário cosmético — fonte + mascote (fatia 3)**: **escopo de
  propagação assimétrico entre as duas categorias, decisão tomada com o
  usuário via `AskUserQuestion`** — diferente do que a fatia 2 tinha
  documentado como plano ("mesmas 4 superfícies" pros dois). Fonte
  propaga pras 5 superfícies (perfil próprio, perfil público, ranking,
  chave, chat geral + comunidade — DM continua fora, mesma exclusão já
  documentada na fatia 2): é só `className` num texto, funciona em
  qualquer tamanho. Mascote fica restrito a `/perfil` e `/perfil/:userId`
  (avatar de 96px, onde o mock desenha o emoji sobreposto a
  `~24px`/`text-2xl`) — **não** propaga pro `PlayerBadge` compacto
  (`ranking`/`chave`/`chat`/`comunidade`, avatar de 24px): a mesma
  proporção do mock nesse tamanho renderizaria um emoji de ~6px,
  ilegível. Consequência em cascata por toda a stack: `LeaderboardEntry`/
  `RegistrationSeat`/`ChatMessage`/`Post`/`PostComment` (backend e
  frontend) ganharam só um campo novo cada (`font`/`equippedFont`/
  `senderFontClassName`/`authorFontClassName`), nunca um par
  font+mascot — só `UserProfile`/`PublicProfile` (as duas telas de
  avatar grande) ganharam os dois (`equippedFont` E `equippedMascot`).
  **Dois campos novos em `Profile`** (`equippedFontId`/`equippedMascotId`,
  mesmo padrão de FK nullable `ON DELETE SET NULL` de
  `equippedFrameId`/`equippedTitleId`) + **um campo novo em
  `CosmeticItem`** (`emoji String?`, distinto de `className` — mascote
  usa os dois ao mesmo tempo: `emoji` é o glifo renderizado, `className`
  é só a classe de animação `animate-mascot-bounce`/`animate-mascot-float`).
  **Terceira rodada do gotcha de `DROP FUNCTION` + `CREATE FUNCTION`**
  (mesmo já documentado nas fatias 1/2): `app_points_leaderboard()`
  ganhou só `equipped_font_id` (migration `points_leaderboard_font`);
  `app_public_profile_snapshot()` ganhou `equipped_font_id` E
  `equipped_mascot_id` juntos (migration `public_profile_font_mascot`) —
  reflexo direto da assimetria de escopo acima. `registrationSeatSelect`
  (`matches.repository.ts`) e `ranking.repository.ts` só ganharam
  `equippedFont`/`font` (sem mascote); `chat.service.ts`/
  `posts.service.ts` só ganharam `senderFontClassName`/
  `authorFontClassName` nas 3 tabelas de snapshot (`ChatMessage`/`Post`/
  `Comment`) — zero coluna de mascote nelas, porque mascote nunca chega
  nessas superfícies. `cosmetics.service.ts#resolveLoadoutSlot` já era
  genérico por `kind` desde a fatia 1 (só usado pra FRAME/TITLE até
  aqui) — estender `updateLoadout` pra FONT/MASCOT foi só adicionar mais
  duas chamadas, zero mudança na função em si. `CosmeticCloset.tsx`
  trocou o `slotKeyFor` binário (`FRAME`→`frameId` senão `titleId`) por
  um `SLOT_KEY: Record<CosmeticKind, keyof CosmeticLoadout | undefined>`
  **completo** (não `Partial`) — força o compilador a avisar se um 7º
  `CosmeticKind` for adicionado sem passar por aqui; `BANNER`/`EFFECT`
  ficam `undefined` (inalcançáveis pela UI hoje, `KIND_TABS` não os
  lista, mas o tipo continua exaustivo). Preview de fonte no armário
  mostra a string literal `"AET"` estilizada com `item.className` (não o
  `item.name`) — mesma convenção já usada no preview de borda (`"AE"`
  fixo); preview de mascote é um mini-avatar `"AE"` com o emoji
  sobreposto no canto (mesmo offset `-bottom-2 -left-3` do avatar grande
  real), replicando 1:1 o grid do armário cosmético do mock
  (`pixel-palette-pal-07/src/routes/profile.tsx`). **Seed**: 3 fontes +
  5 mascotes portados do mock — excluídos o mascote "Dragãozinho Brasa"
  (`unlock: "Vença um torneio Major"`, mesmo critério de exclusão de
  itens lendário já usado na fatia 1) e o "Sem mascote" do mock (não é
  item de catálogo comprável, é só o estado `null` de
  `equippedMascotId`, mesma semântica de moldura/título desequipados).
  **Gotcha real batido nesta fatia**: `var(--ember)` do snippet original
  do Lovable (`drop-shadow-[0_0_6px_var(--ember)]`) não existe no
  `theme.css` real do projeto — os tokens do `@theme` viram
  `--color-ember`, não `--ember` (Tailwind v4 prefixa automaticamente);
  copiar o snippet literal teria produzido um drop-shadow silenciosamente
  sem cor (var indefinida), sem erro nenhum. Corrigido pra
  `var(--color-ember)` nos dois lugares que desenham o overlay de
  mascote (`ProfilePage.tsx`/`PublicProfilePage.tsx`).
  **Testado fim a fim via `claude-in-chrome` + `curl`**: compra de fonte
  paga (Terminal AET, monoespaçada) e mascote (Bot de Fronteira, 🤖)
  como admin — saldo debitado corretamente, nome do card de perfil
  mudando de fonte visualmente, emoji do mascote sobreposto no avatar
  com a animação aplicada; loadout do `user` setado direto via `psql`
  (fonte + mascote) pra confirmar perfil público de terceiro mostrando
  os dois; mensagem de chat e post de comunidade enviados via `curl`
  como `user` (token assinado localmente com `JWT_SECRET`, mesmo truque
  já documentado na fatia 2) confirmando `senderFontClassName`/
  `authorFontClassName` no payload E aplicados no DOM (`className` do
  `<span>` do nome, verificado via `javascript_tool`); `curl` direto em
  `/ranking` e `/matches/tournaments/:id/bracket` confirmando `font`/
  `equippedFont` presentes e **nenhuma chave de mascote na resposta**
  (não só `null` — estruturalmente ausente, prova de que a exclusão de
  escopo foi aplicada em todas as camadas, não só na UI). `tsc -b`/
  `eslint` limpos nos dois workspaces. Dados de teste (mensagem/post/
  compras/pontos de teste/loadout do `user`) revertidos via `psql`
  direto ao final — banco de volta ao baseline.
- **`ProfilePage.tsx` reorganizada pra bater com `pixel-palette-pal-07`
  fielmente**: o design portado na fatia do Armário Cosmético (ver bullets
  acima) tinha ficado só na aba "Personalizar"; a aba "Visão geral" ainda
  usava a montagem antiga (lista simples, sem o card de perfil nem o
  layout de duas colunas do mock). Reorganizado: **card de perfil**
  (avatar+moldura grande, nome em `font-display italic text-3xl md:text-5xl`,
  chips de título+nível abaixo do nome, jogo favorito/personagem/tema
  alinhados à direita — substitui a lista `kind: nome` do mock, que lista
  os 6 cosméticos equipados; como só frame+title existem, os 3 campos reais
  do perfil ocupam esse espaço em vez de inventar dado); **layout de duas
  colunas** abaixo (só na aba "Visão geral"): coluna principal
  (`lg:col-span-2`) com progresso de XP + históricos de torneio/partida,
  coluna lateral (`aside`) com Loadout (painel novo — borda/título
  equipados + botão "Trocar" que muda pra aba Personalizar), Conquistas,
  Seguindo, Seguidores. `PageHeader` ganhou o **badge de pontos** que o
  mock tem nas actions (`useMyWallet`, mesmo hook já usado em `AppLayout`/
  `CosmeticCloset`) — tinha ficado de fora da primeira versão da
  reorganização. Campo "cidade" do mock **não tem equivalente real**
  (perfil do AET Hub não guarda cidade, só CEP de cadastro) — deixado de
  fora conscientemente, não inventado.
- **Gotcha real: `truncate` corta visualmente a última letra de texto em
  itálico**: a primeira versão do card de perfil usava `truncate`
  (`overflow-hidden` + `text-overflow: ellipsis`) no nome, pra proteger
  contra nomes muito longos — o mock não tem essa classe. Resultado: a
  itálica sintética do `font-display italic` (Anton) faz o glifo da
  última letra vaiar um pouco além da largura calculada da string (ex.
  "T" de "Admin AET"), e o `overflow-hidden` corta exatamente essa borda
  — bug só visível olhando a tela renderizada, não em lint/tsc. Fix:
  remover `truncate` (mesmo comportamento do mock — nome muito longo
  quebra/estoura o layout, não é tratado, aceitável por fidelidade ao
  design de referência).
- **`LevelProgressBar.tsx` restilizado pra bater com o card "Progresso" do
  mock**: XP atual em destaque (`font-display text-3xl italic`, era
  `font-mono text-[10px]`), label "Progresso" acima (era "Nível X"),
  "Próximo: LVL X" em `text-ember` alinhado à direita do cabeçalho (era
  `text-silver-muted` abaixo da barra). O número do nível em si não
  aparece mais neste componente — já é mostrado no chip do card de perfil
  e no `accent` do `PageHeader`, mesmo padrão de não-duplicação do mock.
  Componente é compartilhado com `PublicProfilePage.tsx`, então o fix
  vale pras duas telas.
- **Botões dedicados pra iniciar/encerrar torneio** (ver bullet
  correspondente em "Padrões do backend"): "Gerar chaves e iniciar"
  (`AdminTournamentsPage.tsx`, `useStartTournament` novo em
  `useAdminTournamentMutations.ts`, chama `POST /tournaments/:id/start`)
  aparece só quando `status === CHECKIN_OPEN`, ao lado das ações rápidas
  de status; "Encerrar torneio" (`BracketPage.tsx`, `useCompleteTournament`
  novo) aparece só quando `status === IN_PROGRESS` **e** a chave já tem
  campeão (`columns.champion?.registration`), ao lado do banner de
  campeão — usa `tournamentJustCompleted` (já existia em
  `useBracketSocket`, sem uso até agora) pra mostrar um banner de sucesso
  sem precisar de refetch adicional. `QUICK_STATUS_ACTIONS`
  (`tournament-status-actions.ts`) ganhou só um comentário atualizado
  explicando por que essas duas transições não estão mais na lista de
  troca rápida — o mapeamento em si não mudou (`CHECKIN_OPEN ->
  IN_PROGRESS` nunca esteve nele). Testado fim a fim via script Node
  ad-hoc (`fetch`, não fica no repo) + `claude-in-chrome`: torneio de
  teste `CHECKIN_OPEN` com 2 players confirmados/checked-in, `PUT` com
  `status: 'IN_PROGRESS'`/`'COMPLETED'` confirmados 400 via API, botão
  "Gerar chaves e iniciar" gerando a chave de verdade (bracket com 1
  partida visível), registro de resultado, banner de campeão, "Encerrar
  torneio" confirmado via API deixando o torneio `COMPLETED`. Dados de
  teste (`tfixp1`/`tfixp2` + os 2 torneios `Torneio Fix Start Complete A`)
  removidos via `psql` direto.
- **`PublicProfilePage.tsx` reorganizada pra bater com o mesmo layout de
  `ProfilePage.tsx`** (card de perfil + duas colunas), adaptada aos campos
  que `app_public_profile_snapshot`/`getPublicProfile` de fato expõem pra
  um terceiro: sem `avatarUrl`/`bio` (sempre iniciais, sem descrição no
  `PageHeader`), sem histórico de torneios/partidas (não existe endpoint
  de histórico pra outro usuário, só `GET /users/me/history`, RLS-self) e
  sem as listas de "Seguindo"/"Seguidores" da coluna lateral (a API só
  devolve `followersCount`/`followingCount` — contagem, não lista, pra não
  vazar quem terceiros seguem). Esses dois contadores viraram um painel de
  estatística (`grid grid-cols-2`) na sidebar, no lugar das duas seções de
  lista que `ProfilePage` tem. Coluna principal fica só com o box de XP
  (`LevelProgressBar`) — mais enxuta que a de `ProfilePage`, reflexo
  direto do dado disponível, não um corte deliberado de conteúdo. Loadout
  na sidebar é idêntico ao de `ProfilePage`, só sem o botão "Trocar" (não
  é o armário do próprio usuário). Botão Seguir/Seguindo continua no
  mesmo slot de `actions` do `PageHeader` que `ProfilePage` usa pra
  Personalizar/Editar perfil — mesmo "slot de ação principal da página".
  **Gotcha herdado, não novo**: o contador "Seguidores" exibido no painel
  de estatística não atualiza sozinho depois de seguir/deixar de seguir
  na mesma visita (`useFollowMutation`/`useUnfollowMutation` só invalidam
  a query `following` do próprio ator, nunca o `usePublicProfile` do
  alvo — comentário already existente em `useFollows.ts` explica que é
  proposital, já que meu follow nunca muda a lista de seguidores de
  ALGUÉM, só a minha própria lista de quem eu sigo); só reflete após
  reload. Comportamento idêntico ao da versão anterior da tela, só
  mudou de lugar visualmente.
- **Candidatas pra próxima etapa** (nenhuma decisão tomada ainda): fatia
  futura do Armário Cosmético (Banner + Efeitos, ver bullet acima — Fonte
  + Mascote já implementados na fatia 3). RF-08 (recuperação de senha por
  e-mail) e RF-10 (excluir conta/exportar dados, LGPD) seguem como
  próximas fatias funcionais candidatas da Fase 1, ainda sem decisão de
  qual vem primeiro.

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

**`src-lovable/pixel-palette-pal-07/` é uma subpasta com regra própria,
mais estrita que a regra geral acima**: é um export do Lovable que o
usuário atualiza via `git pull` sempre que refina o design lá — não é uma
cópia estática de uma sessão só, como o resto de `src-lovable/`. Aqui o
**design em si é a fonte de verdade**, não só estrutura/dado: o usuário
confirmou explicitamente (fatia do Armário Cosmético, `/perfil`) que o
layout desta subpasta deve ser **portado fielmente**, sem redesenho —
"nunca copiar 1:1 sem checar contrapartida na API" continua valendo pro
que a tela *faz* (rotas/campos/ações reais), mas não pro que ela
*parece*. Essa regra vale pra qualquer tela desta subpasta, inclusive
atualizações trazidas por um `git pull` futuro: sempre reconferir
`src-lovable/pixel-palette-pal-07/src/routes/*` (e `src/lib/mock.ts`)
antes de tocar na tela `apps/web` correspondente, mesmo que já tenha sido
implementada antes — o conteúdo pode ter mudado desde a última vez.

O roadmap do deck (Level 1 MVP → Level 4 Integração) cita explicitamente
**PIX** como o método de pagamento planejado para inscrição paga — hoje o
produto não processa pagamento real (`entryFeeCents`/`potPercentage` são
só informativos até essa integração existir) — e também torneios em
equipe/dupla e integração com VOD/streaming como itens de fase futura,
nenhum dos dois modelados no schema atual.
