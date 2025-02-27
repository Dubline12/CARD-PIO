-- server/config/schema.sql

-- Tabela de Categorias
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos (Pizzas e Bebidas)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(255),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  max_flavors INTEGER, -- NULL para produtos que não são pizzas
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias de Sabores
CREATE TABLE flavor_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sabores
CREATE TABLE flavors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  ingredients TEXT,
  category_id INTEGER REFERENCES flavor_categories(id) ON DELETE SET NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Bordas
CREATE TABLE borders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pedidos
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL UNIQUE, -- ID externo amigável (ex: PO-202405-123)
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  delivery_method VARCHAR(20) NOT NULL, -- 'delivery', 'pickup', 'dineIn'
  payment_method VARCHAR(20) NOT NULL, -- 'pix', 'credit', 'debit', 'cash'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'preparing', 'delivering', 'completed', 'cancelled'
  address TEXT,
  address_number VARCHAR(20),
  neighborhood VARCHAR(100),
  complement TEXT,
  reference TEXT,
  table_number VARCHAR(10),
  change_for DECIMAL(10, 2),
  observations TEXT,
  total_price DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Pedido
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL, -- Preço do item no momento da compra
  total_price DECIMAL(10, 2) NOT NULL, -- Preço total do item (preço * quantidade)
  border_id INTEGER REFERENCES borders(id) ON DELETE RESTRICT,
  border_price DECIMAL(10, 2), -- Preço da borda no momento da compra
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relação entre Itens do Pedido e Sabores (para pizzas)
CREATE TABLE order_item_flavors (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  flavor_id INTEGER NOT NULL REFERENCES flavors(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin', 'user'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dados iniciais para categorias
INSERT INTO categories (name, slug) VALUES
('Pizzas', 'pizzas'),
('Bebidas', 'drinks');

-- Dados iniciais para categorias de sabores
INSERT INTO flavor_categories (name, slug) VALUES
('Tradicional', 'tradicional'),
('Especial', 'especial'),
('Doce', 'doce');

-- Dados iniciais para bordas
INSERT INTO borders (name, price) VALUES
('Catupiry', 5.00),
('Cheddar', 5.00);

-- Índices para melhorar performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_flavors_category ON flavors(category_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_item_flavors_item ON order_item_flavors(order_item_id);