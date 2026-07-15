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

## Documentação de produto

O PRD completo está em `docs/PRD.md` (requisitos funcionais/não-funcionais,
modelo de dados conceitual, fluxos principais, roadmap por fases). O
`README.md` na raiz cobre como rodar o projeto localmente.
