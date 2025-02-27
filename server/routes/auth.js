// server/routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateJWT, isAdmin } = require("../middleware/auth");

// Rotas públicas
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);

// Rotas protegidas
router.get("/me", authenticateJWT, authController.getCurrentUser);
router.post("/logout", authenticateJWT, authController.logout);

// Rotas de administrador
router.get("/users", authenticateJWT, isAdmin, authController.getAllUsers);
router.post("/users", authenticateJWT, isAdmin, authController.createUser);
router.put("/users/:id", authenticateJWT, isAdmin, authController.updateUser);
router.delete(
  "/users/:id",
  authenticateJWT,
  isAdmin,
  authController.deleteUser
);

module.exports = router;
