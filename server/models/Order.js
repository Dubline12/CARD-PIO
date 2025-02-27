// server/models/Order.js
const db = require("../config/db");

class Order {
  // Buscar todos os pedidos com filtros opcionais
  static async findAll(status = null, startDate = null, endDate = null) {
    try {
      let query = `
        SELECT o.*, 
               COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
      `;

      const conditions = [];
      const params = [];

      if (status && status !== "all") {
        params.push(status);
        conditions.push(`o.status = $${params.length}`);
      }

      if (startDate) {
        params.push(startDate);
        conditions.push(`o.created_at >= $${params.length}`);
      }

      if (endDate) {
        params.push(endDate);
        conditions.push(`o.created_at <= $${params.length}`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY o.id ORDER BY o.created_at DESC";

      const { rows } = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      throw error;
    }
  }

  // Buscar um pedido pelo ID com seus itens
  static async findById(id) {
    try {
      // Obter pedido
      const orderQuery = `
        SELECT * FROM orders WHERE id = $1
      `;
      const orderResult = await db.query(orderQuery, [id]);

      if (orderResult.rows.length === 0) {
        return null;
      }

      const order = orderResult.rows[0];

      // Obter itens do pedido
      const itemsQuery = `
        SELECT 
          oi.*, 
          p.name as product_name,
          p.description as product_description,
          p.image as product_image,
          b.name as border_name
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN borders b ON oi.border_id = b.id
        WHERE oi.order_id = $1
      `;
      const itemsResult = await db.query(itemsQuery, [order.id]);

      // Obter sabores para cada item (se for pizza)
      const items = [];
      for (const item of itemsResult.rows) {
        const flavorsQuery = `
          SELECT f.name, f.ingredients 
          FROM order_item_flavors oif
          JOIN flavors f ON oif.flavor_id = f.id
          WHERE oif.order_item_id = $1
        `;
        const flavorsResult = await db.query(flavorsQuery, [item.id]);

        items.push({
          ...item,
          flavors: flavorsResult.rows,
        });
      }

      return {
        ...order,
        items,
      };
    } catch (error) {
      console.error(`Erro ao buscar pedido com ID ${id}:`, error);
      throw error;
    }
  }

  // Criar um novo pedido
  static async create(orderData) {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      const {
        order_id,
        customer_name,
        customer_phone,
        delivery_method,
        payment_method,
        address,
        address_number,
        neighborhood,
        complement,
        reference,
        table_number,
        change_for,
        observations,
        total_price,
        delivery_fee = 0,
        items,
      } = orderData;

      // Inserir pedido
      const orderQuery = `
        INSERT INTO orders (
          order_id, customer_name, customer_phone, delivery_method, payment_method,
          address, address_number, neighborhood, complement, reference,
          table_number, change_for, observations, total_price, delivery_fee
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const orderValues = [
        order_id,
        customer_name,
        customer_phone,
        delivery_method,
        payment_method,
        address,
        address_number,
        neighborhood,
        complement,
        reference,
        table_number,
        change_for,
        observations,
        total_price,
        delivery_fee,
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const newOrder = orderResult.rows[0];

      // Inserir itens do pedido
      if (items && items.length > 0) {
        for (const item of items) {
          // Inserir item
          const itemQuery = `
            INSERT INTO order_items (
              order_id, product_id, quantity, price, total_price, border_id, border_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `;

          const borderInfo = item.border
            ? { id: item.border.id, price: item.border.price }
            : { id: null, price: null };

          const itemValues = [
            newOrder.id,
            item.id,
            item.quantity,
            item.price,
            item.price * item.quantity +
              (borderInfo.price ? borderInfo.price * item.quantity : 0),
            borderInfo.id,
            borderInfo.price,
          ];

          const itemResult = await client.query(itemQuery, itemValues);
          const newItemId = itemResult.rows[0].id;

          // Inserir sabores (se existirem)
          if (item.selectedFlavors && item.selectedFlavors.length > 0) {
            for (const flavorName of item.selectedFlavors) {
              // Buscar ID do sabor pelo nome
              const flavorQuery = `
                SELECT id FROM flavors WHERE name = $1
              `;
              const flavorResult = await client.query(flavorQuery, [
                flavorName,
              ]);

              if (flavorResult.rows.length > 0) {
                const flavorId = flavorResult.rows[0].id;

                // Inserir relação item-sabor
                const flavorItemQuery = `
                  INSERT INTO order_item_flavors (order_item_id, flavor_id)
                  VALUES ($1, $2)
                `;
                await client.query(flavorItemQuery, [newItemId, flavorId]);
              }
            }
          }
        }
      }

      await client.query("COMMIT");
      return newOrder;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Erro ao criar pedido:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Atualizar status de um pedido
  static async updateStatus(id, status) {
    try {
      const validStatuses = [
        "pending",
        "preparing",
        "delivering",
        "completed",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        throw new Error("Status inválido");
      }

      const query = `
        UPDATE orders 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const { rows } = await db.query(query, [status, id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido com ID ${id}:`, error);
      throw error;
    }
  }

  // Obter estatísticas de pedidos
  static async getStats(startDate = null, endDate = null) {
    try {
      // Construir condições de data
      let dateCondition = "";
      const params = [];

      if (startDate) {
        params.push(startDate);
        dateCondition += ` AND o.created_at >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        dateCondition += ` AND o.created_at <= $${params.length}`;
      }

      // Total de vendas
      const totalQuery = `
        SELECT 
          COUNT(*) as order_count,
          SUM(total_price) as revenue
        FROM orders o
        WHERE status != 'cancelled'${dateCondition}
      `;
      const totalResult = await db.query(totalQuery, params);

      // Vendas por dia (últimos 7 dias)
      const dailyQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as order_count,
          SUM(total_price) as revenue
        FROM orders
        WHERE status != 'cancelled'
          AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      const dailyResult = await db.query(dailyQuery);

      // Produtos mais vendidos
      const topProductsQuery = `
        SELECT 
          p.id,
          p.name,
          SUM(oi.quantity) as quantity_sold,
          COUNT(DISTINCT oi.order_id) as order_count
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled'${dateCondition}
        GROUP BY p.id, p.name
        ORDER BY quantity_sold DESC
        LIMIT 5
      `;
      const topProductsResult = await db.query(topProductsQuery, params);

      // Métodos de entrega
      const deliveryMethodsQuery = `
        SELECT 
          delivery_method,
          COUNT(*) as count
        FROM orders
        WHERE status != 'cancelled'${dateCondition}
        GROUP BY delivery_method
      `;
      const deliveryMethodsResult = await db.query(
        deliveryMethodsQuery,
        params
      );

      // Métodos de pagamento
      const paymentMethodsQuery = `
        SELECT 
          payment_method,
          COUNT(*) as count
        FROM orders
        WHERE status != 'cancelled'${dateCondition}
        GROUP BY payment_method
      `;
      const paymentMethodsResult = await db.query(paymentMethodsQuery, params);

      // Status dos pedidos
      const statusQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM orders
        ${dateCondition ? `WHERE 1=1${dateCondition}` : ""}
        GROUP BY status
      `;
      const statusResult = await db.query(statusQuery, params);

      return {
        summary: totalResult.rows[0],
        dailySales: dailyResult.rows,
        topProducts: topProductsResult.rows,
        deliveryMethods: deliveryMethodsResult.rows,
        paymentMethods: paymentMethodsResult.rows,
        orderStatus: statusResult.rows,
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas de pedidos:", error);
      throw error;
    }
  }
}

module.exports = Order;
