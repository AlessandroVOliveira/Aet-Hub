# AET Hub

Hub de jogadores para os torneios organizados pela **AET — Alegrete Esports
Tournament**. Centraliza cadastro de players, pontuação, informações de
campeonatos, checkin nos eventos e chaveamento das disputas.

Documentação de produto completa em [`docs/PRD.md`](./docs/PRD.md).
Regras de contribuição e contexto para trabalho assistido por IA em
[`CLAUDE.md`](./CLAUDE.md).

## Stack

- **Frontend** (`apps/web`): React + Vite + TypeScript
- **Backend** (`apps/api`): Node.js + Express + TypeScript
- **Banco de dados**: PostgreSQL, acessado via Prisma ORM
- **Compartilhado** (`packages/shared`): reservado para tipos e
  utilitários compartilhados entre frontend e backend — hoje é só
  scaffolding vazio, sem uso real ainda (populado quando houver um
  segundo consumidor concreto para o mesmo tipo)
- Monorepo gerenciado com **npm workspaces**

## Estrutura do repositório

```
apps/
  web/      # frontend React
  api/      # backend Node/Express + schema Prisma
packages/
  shared/   # scaffolding vazio, reservado pra tipos compartilhados (sem uso ainda)
docs/       # PRD e demais documentos de produto
```

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose (para o Postgres local) — ou uma instância
  PostgreSQL 16+ própria, acessível via `DATABASE_URL`

## Como rodar o projeto

1. Instale as dependências na raiz (o npm workspaces resolve todos os
   pacotes de `apps/*` e `packages/*`):

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente e preencha com valores reais
   (senhas fortes para `POSTGRES_SUPERUSER_PASSWORD`, `AET_APP_DB_PASSWORD`,
   `AET_AUTH_DB_PASSWORD` e um `JWT_SECRET` aleatório):

   ```bash
   cp .env.example .env
   ```

   `FREENEWSAPI_API_KEY` também é **obrigatória** — a API valida todas as
   variáveis de ambiente na subida e recusa iniciar sem uma chave real
   (não é só para testar o feed de notícias, é para o processo inteiro
   rodar). Cadastre-se gratuitamente em
   [freenewsapi.io](https://freenewsapi.io) e cole a chave gerada.

3. Suba o Postgres local e crie as roles de runtime (RLS exige três roles
   separadas — ver `CLAUDE.md`):

   ```bash
   npm run db:up --workspace apps/api
   npm run db:roles --workspace apps/api
   ```

4. Gere o client do Prisma e aplique as migrations (cria as tabelas e as
   policies de Row Level Security). Os comandos `prisma generate`/
   `prisma migrate` são chamados pelo Prisma CLI diretamente, que só
   carrega um `.env` do diretório do schema ou do diretório atual — não
   do `.env` da raiz do monorepo — por isso é preciso injetá-lo
   explicitamente com `dotenv-cli` (baixado sob demanda pelo `npx`, sem
   precisar instalar nada):

   ```bash
   npx dotenv-cli -e .env -- npm run prisma:generate --workspace apps/api
   npx dotenv-cli -e .env -- npm run prisma:migrate --workspace apps/api
   ```

   Se em algum momento você rodar `prisma migrate reset`, rode
   `npm run db:roles --workspace apps/api` de novo em seguida — o reset
   recria o schema do banco e apaga os grants de nível de schema.

5. Popule o catálogo básico (jogos e conquistas) e crie uma conta admin de
   teste — o cadastro público sempre cria contas `PLAYER`, então este é o
   único jeito de conseguir uma conta `ADMIN` sem editar o banco na mão:

   ```bash
   npm run db:seed --workspace apps/api
   ```

   Por padrão cria o admin `admin`/`admin123` (sobrescrevível via
   `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD`/`ADMIN_SEED_EMAIL` no
   `.env`, ver `.env.example`). Sem este passo, a criação de torneio
   quebra (não há nenhum jogo cadastrado) e não existe forma de logar
   como admin.

6. Suba o backend e o frontend em terminais separados:

   ```bash
   npm run dev:api
   npm run dev:web
   ```

   - API disponível em `http://localhost:3333` (rota de health check em
     `/health`)
   - Frontend disponível em `http://localhost:5173`

## Scripts disponíveis (raiz)

| Comando                | Descrição                                             |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev:web`      | Sobe o frontend em modo desenvolvimento               |
| `npm run dev:api`      | Sobe o backend em modo desenvolvimento                |
| `npm run build`        | Builda todos os workspaces que tiverem script `build` |
| `npm run lint`         | Roda o ESLint em todo o repositório                   |
| `npm run format`       | Formata o repositório com Prettier                    |
| `npm run format:check` | Verifica formatação sem alterar arquivos              |

## Scripts do backend (apps/api)

| Comando                                       | Descrição                                        |
| --------------------------------------------- | ------------------------------------------------ |
| `npm run db:up --workspace apps/api`          | Sobe o Postgres local via Docker Compose         |
| `npm run db:down --workspace apps/api`        | Derruba o Postgres local                         |
| `npm run db:roles --workspace apps/api`       | Cria/atualiza as roles de runtime do banco (RLS) |
| `npm run prisma:migrate --workspace apps/api` | Roda as migrations do Prisma                     |
| `npm run db:seed --workspace apps/api`        | Popula jogos/conquistas e cria o admin de teste  |

## Variáveis de ambiente

Ver [`.env.example`](./.env.example) para a lista completa. Nunca commitar
o arquivo `.env` com valores reais — apenas o `.env.example` (sem
segredos) deve ficar versionado.

## Segurança

Este projeto lida com dados pessoais de usuários (incluindo CEP) e
transações de pontos/loja. As diretrizes de segurança obrigatórias (RLS,
prevenção de XSS/SQL injection, hashing de senha, tratamento de segredos)
estão documentadas em [`CLAUDE.md`](./CLAUDE.md) e devem ser seguidas em
qualquer contribuição.

## Contribuindo

- Mensagens de commit em português do Brasil, no imperativo, explicando o
  porquê da mudança.
- Siga a configuração de lint/format do repositório antes de abrir um PR.
- Consulte o [PRD](./docs/PRD.md) para entender requisitos e prioridades
  antes de propor mudanças de escopo.
