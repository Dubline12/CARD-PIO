// server/models/Border.js
const db = require("../config/db");

class Border {
  // Buscar todas as bordas
  static async findAll() {
    try {
      const query = "SELECT * FROM borders ORDER BY name";
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Erro ao buscar bordas:", error);
      throw error;
    }
  }

  // Buscar apenas bordas disponíveis
  static async findAvailable() {
    try {
      const query =
        "SELECT * FROM borders WHERE is_available = TRUE ORDER BY name";
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Erro ao buscar bordas disponíveis:", error);
      throw error;
    }
  }

  // Buscar borda por ID
  static async findById(id) {
    try {
      const query = "SELECT * FROM borders WHERE id = $1";
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Erro ao buscar borda com ID ${id}:`, error);
      throw error;
    }
  }

  // Criar nova borda
  static async create(borderData) {
    try {
      const { name, price, is_available = true } = borderData;

      // Validar dados
      if (!name || price === undefined) {
        throw new Error("Nome e preço são obrigatórios");
      }

      const query = `
        INSERT INTO borders (name, price, is_available)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const { rows } = await db.query(query, [name, price, is_available]);
      return rows[0];
    } catch (error) {
      console.error("Erro ao criar borda:", error);
      throw error;
    }
  }

  // Atualizar borda
  static async update(id, borderData) {
    try {
      const { name, price, is_available } = borderData;

      // Validar dados
      if (!name && price === undefined && is_available === undefined) {
        throw new Error(
          "É necessário fornecer pelo menos um campo para atualização"
        );
      }

      // Verificar se borda existe
      const existingBorder = await this.findById(id);
      if (!existingBorder) {
        throw new Error("Borda não encontrada");
      }

      // Construir query
      let query = "UPDATE borders SET ";
      const updates = [];
      const values = [];

      if (name) {
        values.push(name);
        updates.push(`name = $${values.length}`);
      }

      if (price !== undefined) {
        values.push(price);
        updates.push(`price = $${values.length}`);
      }

      if (is_available !== undefined) {
        values.push(is_available);
        updates.push(`is_available = $${values.length}`);
      }

      // Adicionar timestamp
      updates.push("updated_at = NOW()");

      query += updates.join(", ");
      values.push(id);
      query += ` WHERE id = $${values.length} RETURNING *`;

      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error(`Erro ao atualizar borda com ID ${id}:`, error);
      throw error;
    }
  }

  // Excluir borda
  static async delete(id) {
    try {
      // Verificar se borda existe
      const existingBorder = await this.findById(id);
      if (!existingBorder) {
        throw new Error("Borda não encontrada");
      }

      // Verificar se a borda está em uso em algum pedido
      const ordersCheck = await db.query(
        "SELECT COUNT(*) FROM order_items WHERE border_id = $1",
        [id]
      );
      if (parseInt(ordersCheck.rows[0].count) > 0) {
        throw new Error(
          "Não é possível excluir uma borda que está em uso em pedidos"
        );
      }

      const query = "DELETE FROM borders WHERE id = $1 RETURNING *";
      const { rows } = await db.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error(`Erro ao excluir borda com ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = Border;
