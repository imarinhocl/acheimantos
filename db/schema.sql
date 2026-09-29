-- Tabela de usuários do painel admin
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de produtos (camisetas anunciadas)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT,
  platform TEXT CHECK (platform IN ('mercadolivre', 'shopee')),
  affiliate_url TEXT,
  image_url TEXT NOT NULL,
  price NUMERIC(10,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);
CREATE INDEX IF NOT EXISTS idx_products_search ON products (name, team);

-- Categoria da camisa (Brasileirão, ligas europeias, seleções, outros)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- A partir de agora um produto pode ter mais de um link (Mercado Livre e/ou Shopee),
-- então platform/affiliate_url do produto ficam livres (não obrigatórios) e os links
-- de verdade passam a morar em product_links.
ALTER TABLE products ALTER COLUMN platform DROP NOT NULL;
ALTER TABLE products ALTER COLUMN affiliate_url DROP NOT NULL;

CREATE TABLE IF NOT EXISTS product_links (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('mercadolivre', 'shopee')),
  affiliate_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, platform)
);

-- Migração única: copia os links antigos (coluna platform/affiliate_url do produto,
-- de antes de existir product_links) pra tabela nova. Não faz nada se já foi migrado.
INSERT INTO product_links (product_id, platform, affiliate_url)
SELECT id, platform, affiliate_url FROM products
WHERE platform IS NOT NULL AND affiliate_url IS NOT NULL
ON CONFLICT (product_id, platform) DO NOTHING;

-- Tabela de relatos de "link caiu" / problemas em anúncios
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT,
  message TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
