require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Tabelas criadas/atualizadas com sucesso.');
  await pool.end();
}

main().catch((err) => {
  console.error('Erro ao rodar schema.sql:', err);
  process.exit(1);
});