const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/products?search=flamengo
router.get('/products', async (req, res) => {
  const search = (req.query.search || '').trim();

  try {
    let result;
    if (search) {
      result = await pool.query(
        `SELECT id, name, team, platform, affiliate_url, image_url, price
         FROM products
         WHERE active = true
           AND (name ILIKE $1 OR team ILIKE $1)
         ORDER BY created_at DESC
         LIMIT 60`,
        [`%${search}%`]
      );
    } else {
      result = await pool.query(
        `SELECT id, name, team, platform, affiliate_url, image_url, price
         FROM products
         WHERE active = true
         ORDER BY created_at DESC
         LIMIT 60`
      );
    }
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
