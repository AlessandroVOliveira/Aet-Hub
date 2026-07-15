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
- **Compartilhado** (`packages/shared`): tipos e utilitários usados por
  frontend e backend
- Monorepo gerenciado com **npm workspaces**

## Estrutura do repositório

```
apps/
  web/      # frontend React
  api/      # backend Node/Express + schema Prisma
packages/
  shared/   # tipos compartilhados entre web e api
docs/       # PRD e demais documentos de produto
```

## Pré-requisitos

- Node.js 20+
- PostgreSQL 15+ rodando localmente ou acessível via `DATABASE_URL`

## Como rodar o projeto

1. Instale as dependências na raiz (o npm workspaces resolve todos os
   pacotes de `apps/*` e `packages/*`):

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente e preencha com valores reais:

   ```bash
   cp .env.example .env
   ```

3. Gere o client do Prisma e aplique as migrations (necessário assim que
   o schema em `apps/api/prisma/schema.prisma` tiver modelos definidos):

   ```bash
   npm run prisma:generate --workspace apps/api
   npm run prisma:migrate --workspace apps/api
   ```

4. Suba o backend e o frontend em terminais separados:

   ```bash
   npm run dev:api
   npm run dev:web
   ```

   - API disponível em `http://localhost:3333` (rota de health check em
     `/health`)
   - Frontend disponível em `http://localhost:5173`

## Scripts disponíveis (raiz)

| Comando | Descrição |
|---|---|
| `npm run dev:web` | Sobe o frontend em modo desenvolvimento |
| `npm run dev:api` | Sobe o backend em modo desenvolvimento |
| `npm run build` | Builda todos os workspaces que tiverem script `build` |
| `npm run lint` | Roda o ESLint em todo o repositório |
| `npm run format` | Formata o repositório com Prettier |
| `npm run format:check` | Verifica formatação sem alterar arquivos |

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
