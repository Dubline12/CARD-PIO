// server/controllers/flavorController.js
const Flavor = require("../models/Flavor");

// Controlador para gerenciar sabores
const flavorController = {
  // Obter todos os sabores
  getAllFlavors: async (req, res) => {
    try {
      const { category } = req.query;
      const flavors = await Flavor.findAll(category);
      res.status(200).json(flavors);
    } catch (error) {
      console.error("Erro ao obter sabores:", error);
      res
        .status(500)
        .json({ message: "Erro ao obter sabores", error: error.message });
    }
  },

  // Obter um sabor pelo ID
  getFlavorById: async (req, res) => {
    try {
      const { id } = req.params;
      const flavor = await Flavor.findById(id);

      if (!flavor) {
        return res.status(404).json({ message: "Sabor não encontrado" });
      }

      res.status(200).json(flavor);
    } catch (error) {
      console.error(`Erro ao obter sabor com ID ${req.params.id}:`, error);
      res
        .status(500)
        .json({ message: "Erro ao obter sabor", error: error.message });
    }
  },

  // Criar um novo sabor
  createFlavor: async (req, res) => {
    try {
      const newFlavor = await Flavor.create(req.body);
      res.status(201).json(newFlavor);
    } catch (error) {
      console.error("Erro ao criar sabor:", error);
      res
        .status(500)
        .json({ message: "Erro ao criar sabor", error: error.message });
    }
  },

  // Atualizar um sabor
  updateFlavor: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedFlavor = await Flavor.update(id, req.body);

      if (!updatedFlavor) {
        return res.status(404).json({ message: "Sabor não encontrado" });
      }

      res.status(200).json(updatedFlavor);
    } catch (error) {
      console.error(`Erro ao atualizar sabor com ID ${req.params.id}:`, error);
      res
        .status(500)
        .json({ message: "Erro ao atualizar sabor", error: error.message });
    }
  },

  // Excluir um sabor
  deleteFlavor: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedFlavor = await Flavor.delete(id);

      if (!deletedFlavor) {
        return res.status(404).json({ message: "Sabor não encontrado" });
      }

      res
        .status(200)
        .json({ message: "Sabor excluído com sucesso", flavor: deletedFlavor });
    } catch (error) {
      console.error(`Erro ao excluir sabor com ID ${req.params.id}:`, error);
      res
        .status(500)
        .json({ message: "Erro ao excluir sabor", error: error.message });
    }
  },

  // Alternar disponibilidade do sabor
  toggleFlavorAvailability: async (req, res) => {
    try {
      const { id } = req.params;

      // Obter sabor atual
      const flavor = await Flavor.findById(id);

      if (!flavor) {
        return res.status(404).json({ message: "Sabor não encontrado" });
      }

      // Alternar disponibilidade
      const updatedFlavor = await Flavor.update(id, {
        is_available: !flavor.is_available,
      });

      res.status(200).json(updatedFlavor);
    } catch (error) {
      console.error(
        `Erro ao alternar disponibilidade do sabor com ID ${req.params.id}:`,
        error
      );
      res
        .status(500)
        .json({
          message: "Erro ao alternar disponibilidade do sabor",
          error: error.message,
        });
    }
  },
};

module.exports = flavorController;
