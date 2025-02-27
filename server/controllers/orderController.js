// server/controllers/orderController.js
const Order = require("../models/Order");

// Controlador para gerenciar pedidos
const orderController = {
  // Obter todos os pedidos
  getAllOrders: async (req, res) => {
    try {
      const { status, startDate, endDate } = req.query;
      const orders = await Order.findAll(status, startDate, endDate);
      res.status(200).json(orders);
    } catch (error) {
      console.error("Erro ao obter pedidos:", error);
      res
        .status(500)
        .json({ message: "Erro ao obter pedidos", error: error.message });
    }
  },

  // Obter um pedido pelo ID
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      res.status(200).json(order);
    } catch (error) {
      console.error(`Erro ao obter pedido com ID ${req.params.id}:`, error);
      res
        .status(500)
        .json({ message: "Erro ao obter pedido", error: error.message });
    }
  },

  // Criar um novo pedido
  createOrder: async (req, res) => {
    try {
      const orderData = req.body;

      // Gerar ID único para o pedido se não fornecido
      if (!orderData.order_id) {
        orderData.order_id = `PO-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;
      }

      const newOrder = await Order.create(orderData);
      res.status(201).json(newOrder);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      res
        .status(500)
        .json({ message: "Erro ao criar pedido", error: error.message });
    }
  },

  // Atualizar status de um pedido
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status é obrigatório" });
      }

      const updatedOrder = await Order.updateStatus(id, status);

      if (!updatedOrder) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      console.error(
        `Erro ao atualizar status do pedido com ID ${req.params.id}:`,
        error
      );
      res
        .status(500)
        .json({
          message: "Erro ao atualizar status do pedido",
          error: error.message,
        });
    }
  },

  // Obter estatísticas de pedidos
  getOrderStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await Order.getStats(startDate, endDate);
      res.status(200).json(stats);
    } catch (error) {
      console.error("Erro ao obter estatísticas de pedidos:", error);
      res
        .status(500)
        .json({ message: "Erro ao obter estatísticas", error: error.message });
    }
  },
};

module.exports = orderController;
