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

## Documentação de produto

O PRD completo está em `docs/PRD.md` (requisitos funcionais/não-funcionais,
modelo de dados conceitual, fluxos principais, roadmap por fases). O
`README.md` na raiz cobre como rodar o projeto localmente.
