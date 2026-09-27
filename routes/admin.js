const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

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
      pool.query('SELECT * FROM products ORDER BY created_at DESC'),
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
  const { name, team, platform, affiliate_url, image_url, price } = req.body;

  if (!name || !platform || !affiliate_url || !image_url) {
    return res.redirect('/admin');
  }

  try {
    await pool.query(
      `INSERT INTO products (name, team, platform, affiliate_url, image_url, price)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, team || null, platform, affiliate_url, image_url, price || null]
    );
    res.redirect('/admin');
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.redirect('/admin');
  }
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
