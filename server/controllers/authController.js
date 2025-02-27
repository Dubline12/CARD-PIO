// server/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

// Controlador para autenticação e gerenciamento de usuários
const authController = {
  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validar dados
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email e senha são obrigatórios" });
      }

      // Buscar usuário
      const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      const user = rows[0];

      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Remover senha do objeto de resposta
      delete user.password;

      res.status(200).json({
        message: "Login bem-sucedido",
        user,
        token,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res
        .status(500)
        .json({ message: "Erro no processo de login", error: error.message });
    }
  },

  // Obter usuário atual baseado no token
  getCurrentUser: async (req, res) => {
    try {
      const userId = req.user.id;

      const { rows } = await db.query(
        "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1",
        [userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.status(200).json(rows[0]);
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error);
      res
        .status(500)
        .json({
          message: "Erro ao obter dados do usuário",
          error: error.message,
        });
    }
  },

  // Renovar token
  refreshToken: async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token é obrigatório" });
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuário
      const { rows } = await db.query(
        "SELECT id, name, email, role FROM users WHERE id = $1",
        [decoded.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const user = rows[0];

      // Gerar novo token
      const newToken = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(200).json({
        message: "Token renovado com sucesso",
        user,
        token: newToken,
      });
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      res
        .status(401)
        .json({ message: "Token inválido ou expirado", error: error.message });
    }
  },

  // Logout (invalidação do token deve ser feita no cliente)
  logout: async (req, res) => {
    res.status(200).json({ message: "Logout bem-sucedido" });
  },

  // Obter todos os usuários (somente admin)
  getAllUsers: async (req, res) => {
    try {
      const { rows } = await db.query(
        "SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id"
      );

      res.status(200).json(rows);
    } catch (error) {
      console.error("Erro ao obter usuários:", error);
      res
        .status(500)
        .json({
          message: "Erro ao obter lista de usuários",
          error: error.message,
        });
    }
  },

  // Criar novo usuário (somente admin)
  createUser: async (req, res) => {
    try {
      const { name, email, password, role = "user" } = req.body;

      // Validar dados
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: "Nome, email e senha são obrigatórios" });
      }

      // Verificar se email já existe
      const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      if (rows.length > 0) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Inserir usuário
      const result = await db.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
        [name, email, hashedPassword, role]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res
        .status(500)
        .json({ message: "Erro ao criar usuário", error: error.message });
    }
  },

  // Atualizar usuário (somente admin)
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, role } = req.body;

      // Verificar se usuário existe
      const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Preparar dados para atualização
      let hashedPassword = null;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Construir consulta dinamicamente
      let query = "UPDATE users SET ";
      const params = [];
      const updates = [];

      if (name) {
        params.push(name);
        updates.push(`name = $${params.length}`);
      }

      if (email) {
        params.push(email);
        updates.push(`email = $${params.length}`);
      }

      if (hashedPassword) {
        params.push(hashedPassword);
        updates.push(`password = $${params.length}`);
      }

      if (role) {
        params.push(role);
        updates.push(`role = $${params.length}`);
      }

      // Adicionar timestamp de atualização
      updates.push("updated_at = NOW()");

      // Montar consulta completa
      query += updates.join(", ");
      params.push(id);
      query += ` WHERE id = $${params.length} RETURNING id, name, email, role, updated_at`;

      // Executar atualização
      const result = await db.query(query, params);

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res
        .status(500)
        .json({ message: "Erro ao atualizar usuário", error: error.message });
    }
  },

  // Excluir usuário (somente admin)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Impedir exclusão do próprio usuário
      if (req.user.id === parseInt(id)) {
        return res
          .status(400)
          .json({ message: "Não é possível excluir o próprio usuário" });
      }

      // Verificar se usuário existe
      const checkResult = await db.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Excluir usuário
      await db.query("DELETE FROM users WHERE id = $1", [id]);

      res.status(200).json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res
        .status(500)
        .json({ message: "Erro ao excluir usuário", error: error.message });
    }
  },
};

module.exports = authController;
