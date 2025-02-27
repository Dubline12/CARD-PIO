// server/controllers/productController.js
const Product = require("../models/Product");

// Controlador para gerenciar produtos
const productController = {
  // Obter todos os produtos
  getAllProducts: async (req, res) => {
    try {
      const { category } = req.query;
      const products = await Product.findAll(category);
      res.status(200).json(products);
    } catch (error) {
      console.error("Erro ao obter produtos:", error);
      res
        .status(500)
        .json({ message: "Erro ao obter produtos", error: error.message });
    }
  },

  // Obter um produto pelo ID
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error(`Erro ao obter produto com ID ${req.params.id}:`, error);
      res
        .status(500)
        .json({ message: "Erro ao obter produto", error: error.message });
    }
  },

  // Criar um novo produto
  createProduct: async (req, res) => {
    try {
      const newProduct = await Product.create(req.body);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      res
        .status(500)
        .json({ message: "Erro ao criar produto", error: error.message });
    }
  },

  // Atualizar um produto
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updatedProduct = await Product.update(id, req.body);

      if (!updatedProduct) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error(
        `Erro ao atualizar produto com ID ${req.params.id}:`,
        error
      );
      res
        .status(500)
        .json({ message: "Erro ao atualizar produto", error: error.message });
    }
  },

  // Excluir um produto
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedProduct = await Product.delete(id);

      if (!deletedProduct) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res
        .status(200)
        .json({
          message: "Produto excluído com sucesso",
          product: deletedProduct,
        });
    } catch (error) {
      console.error(`Erro ao excluir produto com ID ${req.params.id}:`, error);
      res
        .status(500)
        .json({ message: "Erro ao excluir produto", error: error.message });
    }
  },
};

module.exports = productController;
