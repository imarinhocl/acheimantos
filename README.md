# Acheimantos

Vitrine de camisetas com redirecionamento para links de afiliado (Mercado Livre / Shopee).

## 1. Rodar localmente (Mac + VSCode)

Pré-requisito: [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).
Precisa também de um Postgres — o mais simples é criar um banco gratuito no Render (passo 3) e usar a URL dele mesmo localmente, sem instalar Postgres no Mac.

```bash
# dentro da pasta do projeto
npm install
cp .env.example .env
```

Abra o `.env` e preencha:
- `DATABASE_URL`: a URL do banco (veja passo 3)
- `SESSION_SECRET`: qualquer texto aleatório longo
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: o login que você vai usar no painel

Depois, crie as tabelas (só precisa rodar uma vez):

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

> Se não tiver o `psql` instalado, dá pra rodar esse mesmo SQL colando o conteúdo de `db/schema.sql` direto no "Shell" do banco, na página dele no painel do Render.

Crie o usuário admin:

```bash
npm run seed:admin
```

Suba o servidor:

```bash
npm run dev
```

Abra http://localhost:3000 para o site público e http://localhost:3000/admin para o painel.

## 2. Estrutura do projeto

```
server.js              → ponto de entrada
routes/api.js          → API pública (busca de produtos, reportes)
routes/admin.js        → login e CRUD do painel
middleware/auth.js      → protege as rotas /admin
db/schema.sql           → estrutura das tabelas
db/pool.js              → conexão com o Postgres
views/                  → páginas do painel (EJS)
public/                 → site público (HTML/CSS/JS puro)
scripts/create-admin.js → cria/atualiza o usuário do painel
```

## 3. Deploy no Render (barato/gratuito)

1. Suba este projeto para um repositório no GitHub.
2. No [Render](https://render.com), crie um **PostgreSQL** (plano gratuito) — copie a "Internal Database URL" ou "External Database URL" gerada.
3. Ainda no Render, crie um **Web Service** apontando pro seu repositório:
   - Build command: `npm install`
   - Start command: `npm start`
4. Nas variáveis de ambiente do Web Service, adicione:
   - `DATABASE_URL` → a URL do banco criado no passo 2
   - `SESSION_SECRET` → um texto aleatório longo
   - `NODE_ENV` → `production`
5. Depois do primeiro deploy, rode as tabelas (`db/schema.sql`) usando o "Shell" do banco no painel do Render, e crie o admin rodando `npm run seed:admin` pelo "Shell" do próprio Web Service (com `ADMIN_USERNAME`/`ADMIN_PASSWORD` configurados nas variáveis de ambiente).
6. Em "Settings" do Web Service, aponte seu domínio `acheimantos.com.br` (comprado no Registro.br) como domínio customizado, e siga as instruções do Render para apontar o DNS (normalmente um registro CNAME ou A, feito lá no Registro.br).

**Sobre o plano gratuito do Render:** o Web Service gratuito "dorme" depois de um tempo sem acesso, e a primeira visita depois disso demora alguns segundos pra acordar — para um projeto sem fins de grande retorno, geralmente compensa. O Postgres gratuito do Render expira depois de 30 dias; se o projeto for pra frente, migrar pro plano pago do banco (bem barato) resolve isso.

## 4. Publicando um novo anúncio

Entre em `/admin` com seu usuário e senha, preencha o formulário "Novo anúncio" com:
- nome da camisa e do time
- a plataforma (Mercado Livre ou Shopee)
- o link de afiliado
- a URL de uma imagem do produto (pode ser a própria imagem do anúncio do Mercado Livre/Shopee, clicando com o botão direito nela → "copiar endereço da imagem")

O anúncio aparece na hora no site público.
