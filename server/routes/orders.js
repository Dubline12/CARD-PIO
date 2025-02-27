// server/routes/orders.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticateJWT, isAdmin } = require("../middleware/auth");

// Rota pública - para criar novos pedidos
router.post("/", orderController.createOrder);

// Rotas protegidas - apenas administradores
router.get("/", authenticateJWT, isAdmin, orderController.getAllOrders);
router.get("/stats", authenticateJWT, isAdmin, orderController.getOrderStats);
router.get("/:id", authenticateJWT, isAdmin, orderController.getOrderById);
router.patch(
  "/:id/status",
  authenticateJWT,
  isAdmin,
  orderController.updateOrderStatus
);

module.exports = router;
