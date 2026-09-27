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
  platform TEXT NOT NULL CHECK (platform IN ('mercadolivre', 'shopee')),
  affiliate_url TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price NUMERIC(10,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);
CREATE INDEX IF NOT EXISTS idx_products_search ON products (name, team);

-- Tabela de relatos de "link caiu" / problemas em anúncios
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT,
  message TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
