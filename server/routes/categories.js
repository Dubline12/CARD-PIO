// server/routes/categories.js
const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticateJWT, isAdmin } = require("../middleware/auth");

// Rotas públicas
router.get("/", categoryController.getAllCategories);
router.get("/flavors", categoryController.getAllFlavorCategories);
router.get("/:id", categoryController.getCategoryById);

// Rotas protegidas (somente admin)
router.post("/", authenticateJWT, isAdmin, categoryController.createCategory);
router.put("/:id", authenticateJWT, isAdmin, categoryController.updateCategory);
router.delete(
  "/:id",
  authenticateJWT,
  isAdmin,
  categoryController.deleteCategory
);

// Rotas para categorias de sabores
router.post(
  "/flavors",
  authenticateJWT,
  isAdmin,
  categoryController.createFlavorCategory
);

module.exports = router;
