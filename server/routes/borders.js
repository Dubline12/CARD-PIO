// server/routes/borders.js
const express = require("express");
const router = express.Router();
const borderController = require("../controllers/borderController");
const { authenticateJWT, isAdmin } = require("../middleware/auth");

// Rotas públicas
router.get("/", borderController.getAllBorders);
router.get("/:id", borderController.getBorderById);

// Rotas protegidas (somente admin)
router.post("/", authenticateJWT, isAdmin, borderController.createBorder);
router.put("/:id", authenticateJWT, isAdmin, borderController.updateBorder);
router.delete("/:id", authenticateJWT, isAdmin, borderController.deleteBorder);
router.patch(
  "/:id/toggle",
  authenticateJWT,
  isAdmin,
  borderController.toggleBorderStatus
);

module.exports = router;
