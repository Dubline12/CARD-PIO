// server/config/db.js
const { Pool } = require("pg");
require("dotenv").config();

// Configuração da conexão com o NeonDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessário para conexões NeonDB
  },
});

// Teste de conexão
pool
  .connect()
  .then(() => console.log("📦 Conectado ao NeonDB com sucesso!"))
  .catch((err) => console.error("❌ Erro ao conectar ao NeonDB:", err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: async () => {
    const client = await pool.connect();
    return {
      query: (text, params) => client.query(text, params),
      release: () => client.release(),
    };
  },
};
