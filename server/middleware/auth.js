// server/middleware/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware para autenticar token JWT
const authenticateJWT = (req, res, next) => {
  // Verificar o cabeçalho de autorização
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Token de autenticação não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Armazenar dados do usuário no request
    next();
  } catch (error) {
    console.error("Erro de autenticação:", error);
    return res.status(403).json({ message: "Token inválido ou expirado" });
  }
};

// Middleware para verificar se o usuário é administrador
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({
        message: "Acesso negado: permissão de administrador necessária",
      });
  }
  next();
};

module.exports = {
  authenticateJWT,
  isAdmin,
};
