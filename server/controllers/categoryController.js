// server/controllers/categoryController.js
const Category = require("../models/Category");

// Controlador para gerenciar categorias
const categoryController = {
  // Obter todas as categorias
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.findAll();
      res.status(200).json(categories);
    } catch (error) {
      console.error("Erro ao obter categorias:", error);
      res
        .status(500)
        .json({ message: "Erro ao obter categorias", error: error.message });
    }
  },

  // Obter uma categoria pelo ID
  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      res.status(200).json(category);
    } catch (error) {
      console.error(`Erro ao obter categoria com ID ${req.params.id}:`, error);
      res
        .status(500)
        .json({ message: "Erro ao obter categoria", error: error.message });
    }
  },

  // Criar uma nova categoria
  createCategory: async (req, res) => {
    try {
      const newCategory = await Category.create(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Erro ao criar categoria:", error);

      if (error.message.includes("já existe")) {
        return res.status(400).json({ message: error.message });
      }

      res
        .status(500)
        .json({ message: "Erro ao criar categoria", error: error.message });
    }
  },

  // Atualizar uma categoria
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedCategory = await Category.update(id, req.body);

      if (!updatedCategory) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error(
        `Erro ao atualizar categoria com ID ${req.params.id}:`,
        error
      );

      if (
        error.message.includes("já existe") ||
        error.message.includes("não encontrada")
      ) {
        return res.status(400).json({ message: error.message });
      }

      res
        .status(500)
        .json({ message: "Erro ao atualizar categoria", error: error.message });
    }
  },

  // Excluir uma categoria
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCategory = await Category.delete(id);

      if (!deletedCategory) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      res
        .status(200)
        .json({
          message: "Categoria excluída com sucesso",
          category: deletedCategory,
        });
    } catch (error) {
      console.error(
        `Erro ao excluir categoria com ID ${req.params.id}:`,
        error
      );

      if (
        error.message.includes("não encontrada") ||
        error.message.includes("não é possível excluir")
      ) {
        return res.status(400).json({ message: error.message });
      }

      res
        .status(500)
        .json({ message: "Erro ao excluir categoria", error: error.message });
    }
  },

  // CATEGORIAS DE SABORES

  // Obter todas as categorias de sabores
  getAllFlavorCategories: async (req, res) => {
    try {
      const categories = await Category.findAllFlavorCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error("Erro ao obter categorias de sabores:", error);
      res
        .status(500)
        .json({
          message: "Erro ao obter categorias de sabores",
          error: error.message,
        });
    }
  },

  // Criar uma nova categoria de sabor
  createFlavorCategory: async (req, res) => {
    try {
      const newCategory = await Category.createFlavorCategory(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Erro ao criar categoria de sabor:", error);

      if (error.message.includes("já existe")) {
        return res.status(400).json({ message: error.message });
      }

      res
        .status(500)
        .json({
          message: "Erro ao criar categoria de sabor",
          error: error.message,
        });
    }
  },
};

module.exports = categoryController;
