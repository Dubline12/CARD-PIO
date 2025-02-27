// server/models/Product.js
const db = require("../config/db");

class Product {
  // Buscar todos os produtos
  static async findAll(category = null) {
    try {
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
      `;

      if (category) {
        query += ` WHERE c.slug = $1`;
        const { rows } = await db.query(query, [category]);
        return rows;
      } else {
        const { rows } = await db.query(query);
        return rows;
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      throw error;
    }
  }

  // Buscar um produto pelo ID
  static async findById(id) {
    try {
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
      `;
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Erro ao buscar produto com ID ${id}:`, error);
      throw error;
    }
  }

  // Criar um novo produto
  static async create(productData) {
    const {
      name,
      description,
      price,
      image,
      category_id,
      max_flavors = null,
    } = productData;

    try {
      const query = `
        INSERT INTO products 
        (name, description, price, image, category_id, max_flavors) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [
        name,
        description,
        price,
        image,
        category_id,
        max_flavors,
      ];
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      throw error;
    }
  }

  // Atualizar um produto
  static async update(id, productData) {
    const { name, description, price, image, category_id, max_flavors } =
      productData;

    try {
      const query = `
        UPDATE products 
        SET name = $1, description = $2, price = $3, image = $4, 
            category_id = $5, max_flavors = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;
      const values = [
        name,
        description,
        price,
        image,
        category_id,
        max_flavors,
        id,
      ];
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error(`Erro ao atualizar produto com ID ${id}:`, error);
      throw error;
    }
  }

  // Excluir um produto
  static async delete(id) {
    try {
      const query = "DELETE FROM products WHERE id = $1 RETURNING *";
      const { rows } = await db.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error(`Erro ao excluir produto com ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = Product;
