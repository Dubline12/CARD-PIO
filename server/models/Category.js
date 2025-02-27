// server/models/Category.js
const db = require("../config/db");

class Category {
  // Buscar todas as categorias
  static async findAll() {
    try {
      const query = "SELECT * FROM categories ORDER BY name";
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      throw error;
    }
  }

  // Buscar categoria por ID
  static async findById(id) {
    try {
      const query = "SELECT * FROM categories WHERE id = $1";
      const { rows } = await db.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Erro ao buscar categoria com ID ${id}:`, error);
      throw error;
    }
  }

  // Buscar categoria por slug
  static async findBySlug(slug) {
    try {
      const query = "SELECT * FROM categories WHERE slug = $1";
      const { rows } = await db.query(query, [slug]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Erro ao buscar categoria com slug ${slug}:`, error);
      throw error;
    }
  }

  // Criar nova categoria
  static async create(categoryData) {
    try {
      const { name, slug } = categoryData;

      // Validar dado
      if (!name || !slug) {
        throw new Error("Nome e slug são obrigatórios");
      }

      // Verificar se slug já existe
      const existingCategory = await this.findBySlug(slug);
      if (existingCategory) {
        throw new Error("Já existe uma categoria com este slug");
      }

      const query = `
        INSERT INTO categories (name, slug)
        VALUES ($1, $2)
        RETURNING *
      `;

      const { rows } = await db.query(query, [name, slug]);
      return rows[0];
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      throw error;
    }
  }

  // Atualizar categoria
  static async update(id, categoryData) {
    try {
      const { name, slug } = categoryData;

      // Validar dados
      if (!name && !slug) {
        throw new Error(
          "É necessário fornecer pelo menos um campo para atualização"
        );
      }

      // Verificar se categoria existe
      const existingCategory = await this.findById(id);
      if (!existingCategory) {
        throw new Error("Categoria não encontrada");
      }

      // Verificar se o novo slug já existe (se fornecido)
      if (slug && slug !== existingCategory.slug) {
        const slugCheck = await this.findBySlug(slug);
        if (slugCheck) {
          throw new Error("Já existe uma categoria com este slug");
        }
      }

      // Construir query
      let query = "UPDATE categories SET ";
      const updates = [];
      const values = [];

      if (name) {
        values.push(name);
        updates.push(`name = $${values.length}`);
      }

      if (slug) {
        values.push(slug);
        updates.push(`slug = $${values.length}`);
      }

      // Adicionar timestamp
      updates.push("updated_at = NOW()");

      query += updates.join(", ");
      values.push(id);
      query += ` WHERE id = $${values.length} RETURNING *`;

      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error(`Erro ao atualizar categoria com ID ${id}:`, error);
      throw error;
    }
  }

  // Excluir categoria
  static async delete(id) {
    try {
      // Verificar se categoria existe
      const existingCategory = await this.findById(id);
      if (!existingCategory) {
        throw new Error("Categoria não encontrada");
      }

      // Verificar se existem produtos usando esta categoria
      const productsCheck = await db.query(
        "SELECT COUNT(*) FROM products WHERE category_id = $1",
        [id]
      );
      if (parseInt(productsCheck.rows[0].count) > 0) {
        throw new Error(
          "Não é possível excluir uma categoria que possui produtos associados"
        );
      }

      const query = "DELETE FROM categories WHERE id = $1 RETURNING *";
      const { rows } = await db.query(query, [id]);
      return rows[0];
    } catch (error) {
      console.error(`Erro ao excluir categoria com ID ${id}:`, error);
      throw error;
    }
  }

  // Buscar todas as categorias de sabores
  static async findAllFlavorCategories() {
    try {
      const query = "SELECT * FROM flavor_categories ORDER BY name";
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error("Erro ao buscar categorias de sabores:", error);
      throw error;
    }
  }

  // Outras operações para categorias de sabores (similares às acima)
  static async createFlavorCategory(categoryData) {
    try {
      const { name, slug } = categoryData;

      // Validar dados
      if (!name || !slug) {
        throw new Error("Nome e slug são obrigatórios");
      }

      // Verificar se slug já existe
      const { rows: existingRows } = await db.query(
        "SELECT * FROM flavor_categories WHERE slug = $1",
        [slug]
      );

      if (existingRows.length > 0) {
        throw new Error("Já existe uma categoria de sabor com este slug");
      }

      const query = `
        INSERT INTO flavor_categories (name, slug)
        VALUES ($1, $2)
        RETURNING *
      `;

      const { rows } = await db.query(query, [name, slug]);
      return rows[0];
    } catch (error) {
      console.error("Erro ao criar categoria de sabor:", error);
      throw error;
    }
  }
}

module.exports = Category;
