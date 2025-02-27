// server/routes/flavors.js
const express = require("express");
const router = express.Router();
const flavorController = require("../controllers/flavorController");
const { authenticateJWT, isAdmin } = require("../middleware/auth");

// Rotas públicas
router.get("/", flavorController.getAllFlavors);
router.get("/:id", flavorController.getFlavorById);

// Rotas protegidas (somente admin)
router.post("/", authenticateJWT, isAdmin, flavorController.createFlavor);
router.put("/:id", authenticateJWT, isAdmin, flavorController.updateFlavor);
router.delete("/:id", authenticateJWT, isAdmin, flavorController.deleteFlavor);
router.patch(
  "/:id/toggle",
  authenticateJWT,
  isAdmin,
  flavorController.toggleFlavorAvailability
);

module.exports = router;
