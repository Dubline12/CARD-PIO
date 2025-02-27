// server/routes/products.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateJWT, isAdmin } = require("../middleware/auth");

// Rotas públicas - acessíveis sem autenticação
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// Rotas protegidas - apenas administradores
router.post("/", authenticateJWT, isAdmin, productController.createProduct);
router.put("/:id", authenticateJWT, isAdmin, productController.updateProduct);
router.delete(
  "/:id",
  authenticateJWT,
  isAdmin,
  productController.deleteProduct
);

module.exports = router;
