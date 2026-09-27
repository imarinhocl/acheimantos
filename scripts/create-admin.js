require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('Defina ADMIN_USERNAME e ADMIN_PASSWORD no seu .env antes de rodar este script.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO admin_users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, passwordHash]
  );

  console.log(`Usuário admin "${username}" criado/atualizado com sucesso.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Erro ao criar admin:', err);
  process.exit(1);
});
