// server/models/Flavor.js
const db = require('../config/db');

class Flavor {
  // Buscar todos os sabores
  static async findAll(category = null) {
    try {
      let query = `
        SELECT f.*, c.name as category_name 
        FROM flavors f 
        LEFT JOIN flavor_categories c ON f.category_id = c.id
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
      console.error('Erro ao buscar sabores:', error);
      throw error;
    }
  }

  // Buscar um sabor pelo ID
  static async findById(id) {
    try {
      const query = `
        SELECT f.*, c.name as category_name 
        FROM flavors f 
        LEFT JOIN flavor_categories c ON f.category_id = c.id
        WHERE f.id = $1
      `;
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Erro ao buscar sabor com ID ${id}:`, error);
      throw error;
    }
  }

  // Criar um novo sabor
  static async create(flavorData) {
    const { name, ingredients, category_id, is_available = true } = flavorData;
    
    try {
      const query = `
        INSERT INTO flavors 
        (name, ingredients, category_id, is_available) 
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [name, ingredients, category_id, is_available];
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Erro ao criar sabor:', error);
      throw error;
    }
  }

  // Atualizar um sabor
  static async update(id, flavorData) {
    const { name, ingredients, category_id, is_available } = flavorData;
    
    try {
      const query = `
        UPDATE flavors 
        SET name = $1, ingredients = $2, category_id = $3, 
            is_available = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;
      const values = [name, ingredients, category_id, is_available, id];
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error(`Erro ao atualizar sabor com ID ${id}:`, error);
      throw error;
    }
  }

  // Excluir um sabor
  static async delete(id) {
    try {
      const query = 'DELETE FROM flavors WHERE id = $1 RETURNING *';
      const { rows } = await db.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error(`Erro ao excluir sabor com ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = Flavor;