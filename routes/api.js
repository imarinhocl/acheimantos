const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

const VALID_CATEGORIES = ['brasileirao', 'europa', 'selecoes', 'outros'];

// GET /api/products?search=flamengo&category=brasileirao
router.get('/products', async (req, res) => {
  const search = (req.query.search || '').trim();
  const category = VALID_CATEGORIES.includes(req.query.category) ? req.query.category : null;

  try {
    const result = await pool.query(
      `SELECT
         p.id, p.name, p.team, p.category, p.image_url, p.price,
         COALESCE(
           json_agg(
             json_build_object('id', pl.id, 'platform', pl.platform)
             ORDER BY pl.platform
           ) FILTER (WHERE pl.id IS NOT NULL),
           '[]'
         ) AS links
       FROM products p
       LEFT JOIN product_links pl ON pl.product_id = p.id
       WHERE p.active = true
         AND ($1::text IS NULL OR p.category = $1)
         AND ($2::text IS NULL OR p.name ILIKE $2 OR p.team ILIKE $2)
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT 60`,
      [category, search ? `%${search}%` : null]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// POST /api/reports  { product_id?, product_name?, message }
router.post('/reports', async (req, res) => {
  const { product_id, product_name, message } = req.body;

  if (!product_name && !product_id) {
    return res.status(400).json({ error: 'Informe qual produto (ou o nome dele) apresentou problema.' });
  }

  try {
    await pool.query(
      `INSERT INTO reports (product_id, product_name_snapshot, message)
       VALUES ($1, $2, $3)`,
      [product_id || null, product_name || null, message || null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao salvar reporte:', err);
    res.status(500).json({ error: 'Erro ao registrar o reporte.' });
  }
});

module.exports = router;
