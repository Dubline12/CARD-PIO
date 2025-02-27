// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// Importar rotas
const productRoutes = require("./server/routes/products");
const orderRoutes = require("./server/routes/orders");
const flavorRoutes = require("./server/routes/flavors");
const categoryRoutes = require("./server/routes/categories");
const borderRoutes = require("./server/routes/borders");
const authRoutes = require("./server/routes/auth");
const settingsRoutes = require("./server/routes/settings");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rotas da API
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/flavors", flavorRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/borders", borderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);

// Rota de atalho para bairros
app.get("/api/neighborhoods", (req, res) => {
  res.redirect("/api/settings/neighborhoods");
});

// Rotas adicionais para o painel administrativo
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// Rotas de página para o frontend
app.get("/p/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "print.html"));
});

// Rota catch-all para servir o frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🍕 Frontend: http://localhost:${PORT}`);
});
