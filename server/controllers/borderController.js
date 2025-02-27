// server/controllers/borderController.js
const Border = require("../models/Border");

// Controlador para gerenciar bordas
const borderController = {
  // Obter todas as bordas
  getAllBorders: async (req, res) => {
    try {
      const { available } = req.query;
      let borders;

      if (available === "true") {
        borders = await Border.findAvailable();
      } else {
        borders = await Border.findAll();
      }

      res.status(200).json(borders);
    } catch (error) {
      console.error("Erro ao obter bordas:", error);
      res
        .status(500)
        .json({ message: "Erro ao obter bordas", error: error.message });
    }
  },

  // Obter uma borda pelo ID
  getBorderById: async (req, res) => {
    try {
      const { id } = req.params;
      const border = await Border.findById(id);

      if (!border) {
        return res.status(404).json({ message: "Borda não encontrada" });
      }

      res.status(200).json(border);
    } catch (error) {
      console.error(`Erro ao obter borda com ID ${req.params.id}:`, error);
      res
        .status(500)
        .json({ message: "Erro ao obter borda", error: error.message });
    }
  },

  // Criar uma nova borda
  createBorder: async (req, res) => {
    try {
      const newBorder = await Border.create(req.body);
      res.status(201).json(newBorder);
    } catch (error) {
      console.error("Erro ao criar borda:", error);

      if (error.message.includes("obrigatórios")) {
        return res.status(400).json({ message: error.message });
      }

      res
        .status(500)
        .json({ message: "Erro ao criar borda", error: error.message });
    }
  },

  // Atualizar uma borda
  updateBorder: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedBorder = await Border.update(id, req.body);

      if (!updatedBorder) {
        return res.status(404).json({ message: "Borda não encontrada" });
      }

      res.status(200).json(updatedBorder);
    } catch (error) {
      console.error(`Erro ao atualizar borda com ID ${req.params.id}:`, error);

      if (error.message.includes("não encontrada")) {
        return res.status(404).json({ message: error.message });
      }

      res
        .status(500)
        .json({ message: "Erro ao atualizar borda", error: error.message });
    }
  },

  // Excluir uma borda
  deleteBorder: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedBorder = await Border.delete(id);

      if (!deletedBorder) {
        return res.status(404).json({ message: "Borda não encontrada" });
      }

      res
        .status(200)
        .json({ message: "Borda excluída com sucesso", border: deletedBorder });
    } catch (error) {
      console.error(`Erro ao excluir borda com ID ${req.params.id}:`, error);

      if (error.message.includes("não encontrada")) {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("em uso")) {
        return res.status(400).json({ message: error.message });
      }

      res
        .status(500)
        .json({ message: "Erro ao excluir borda", error: error.message });
    }
  },

  // Alternar status (disponível/indisponível)
  toggleBorderStatus: async (req, res) => {
    try {
      const { id } = req.params;

      // Obter borda atual
      const border = await Border.findById(id);

      if (!border) {
        return res.status(404).json({ message: "Borda não encontrada" });
      }

      // Alternar status
      const updatedBorder = await Border.update(id, {
        is_available: !border.is_available,
      });

      res.status(200).json(updatedBorder);
    } catch (error) {
      console.error(
        `Erro ao alternar status da borda com ID ${req.params.id}:`,
        error
      );
      res
        .status(500)
        .json({
          message: "Erro ao alternar status da borda",
          error: error.message,
        });
    }
  },
};

module.exports = borderController;
