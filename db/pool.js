const { Pool } = require('pg');

// O Render (e a maioria dos provedores de Postgres gratuitos) exige SSL,
// mas com certificado que o driver não reconhece por padrão — por isso
// desligamos a verificação estrita do certificado.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

module.exports = pool;
