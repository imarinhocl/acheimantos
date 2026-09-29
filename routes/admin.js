const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const PLATFORMS = ['mercadolivre', 'shopee'];
const VALID_CATEGORIES = ['brasileirao', 'europa', 'selecoes', 'outros'];

// Grava/atualiza/remove os links de um produto a partir dos campos do formulário
// (mercadolivre_url, shopee_url — qualquer um dos dois pode vir vazio).
async function saveLinks(productId, body) {
  for (const platform of PLATFORMS) {
    const url = (body[`${platform}_url`] || '').trim();

    if (url) {
      await pool.query(
        `INSERT INTO product_links (product_id, platform, affiliate_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, platform) DO UPDATE SET affiliate_url = EXCLUDED.affiliate_url`,
        [productId, platform, url]
      );
    } else {
      await pool.query(
        'DELETE FROM product_links WHERE product_id = $1 AND platform = $2',
        [productId, platform]
      );
    }
  }
}

router.get('/login', (req, res) => {
  if (req.session && req.session.adminUsername) {
    return res.redirect('/admin');
  }
  res.render('admin-login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).render('admin-login', { error: 'Usuário ou senha inválidos.' });
    }

    req.session.adminUsername = user.username;
    res.redirect('/admin');
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).render('admin-login', { error: 'Erro ao processar login. Tente novamente.' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const [products, reports] = await Promise.all([
      pool.query(
        `SELECT
           p.*,
           COALESCE(SUM(pl.clicks), 0)::int AS total_clicks,
           COALESCE(
             json_agg(
               json_build_object('platform', pl.platform, 'clicks', pl.clicks)
               ORDER BY pl.platform
             ) FILTER (WHERE pl.id IS NOT NULL),
             '[]'
           ) AS links
         FROM products p
         LEFT JOIN product_links pl ON pl.product_id = p.id
         GROUP BY p.id
         ORDER BY p.created_at DESC`
      ),
      pool.query('SELECT * FROM reports WHERE resolved = false ORDER BY created_at DESC')
    ]);

    res.render('admin-dashboard', {
      username: req.session.adminUsername,
      products: products.rows,
      reports: reports.rows,
      error: null
    });
  } catch (err) {
    console.error('Erro ao carregar painel:', err);
    res.status(500).send('Erro ao carregar painel.');
  }
});

router.post('/products', requireAuth, async (req, res) => {
  const { name, team, category, image_url, price, mercadolivre_url, shopee_url } = req.body;

  if (!name || !image_url || !(mercadolivre_url || shopee_url)) {
    return res.redirect('/admin');
  }

  const safeCategory = VALID_CATEGORIES.includes(category) ? category : null;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, team, category, image_url, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, team || null, safeCategory, image_url, price || null]
    );
    await saveLinks(result.rows[0].id, req.body);
    res.redirect('/admin');
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.redirect('/admin');
  }
});

router.get('/products/:id/edit', requireAuth, async (req, res) => {
  try {
    const [productResult, linksResult] = await Promise.all([
      pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]),
      pool.query('SELECT platform, affiliate_url FROM product_links WHERE product_id = $1', [req.params.id])
    ]);

    if (!productResult.rows[0]) return res.redirect('/admin');

    const links = {};
    linksResult.rows.forEach((l) => { links[l.platform] = l.affiliate_url; });

    res.render('admin-edit', { product: productResult.rows[0], links });
  } catch (err) {
    console.error('Erro ao carregar anúncio:', err);
    res.redirect('/admin');
  }
});

router.post('/products/:id/edit', requireAuth, async (req, res) => {
  const { name, team, category, image_url, price, mercadolivre_url, shopee_url } = req.body;

  if (!name || !image_url || !(mercadolivre_url || shopee_url)) {
    return res.redirect(`/admin/products/${req.params.id}/edit`);
  }

  const safeCategory = VALID_CATEGORIES.includes(category) ? category : null;

  try {
    await pool.query(
      `UPDATE products
       SET name = $1, team = $2, category = $3, image_url = $4, price = $5
       WHERE id = $6`,
      [name, team || null, safeCategory, image_url, price || null, req.params.id]
    );
    await saveLinks(req.params.id, req.body);
  } catch (err) {
    console.error('Erro ao editar anúncio:', err);
  }
  res.redirect('/admin');
});

router.post('/products/:id/toggle', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE products SET active = NOT active WHERE id = $1',
      [req.params.id]
    );
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
  }
  res.redirect('/admin');
});

router.post('/products/:id/delete', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
  }
  res.redirect('/admin');
});

router.post('/reports/:id/resolve', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE reports SET resolved = true WHERE id = $1', [req.params.id]);
  } catch (err) {
    console.error('Erro ao resolver reporte:', err);
  }
  res.redirect('/admin');
});

module.exports = router;
