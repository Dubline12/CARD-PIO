// server/config/setup-db.js
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log("🔄 Iniciando configuração do banco de dados...");

    // Ler arquivos SQL
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf8"
    );
    const seedSQL = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");

    // Executar criação do esquema
    console.log("🔄 Criando esquema do banco de dados...");
    await client.query(schemaSQL);
    console.log("✅ Esquema criado com sucesso!");

    // Executar população de dados iniciais
    console.log("🔄 Inserindo dados iniciais...");
    await client.query(seedSQL);
    console.log("✅ Dados iniciais inseridos com sucesso!");

    console.log("✅ Configuração do banco de dados concluída!");
  } catch (error) {
    console.error("❌ Erro ao configurar banco de dados:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar configuração
setupDatabase()
  .then(() => {
    console.log("🚀 Banco de dados pronto para uso!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Falha na configuração do banco de dados:", err);
    process.exit(1);
  });
