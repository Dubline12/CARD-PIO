-- server/config/seed.sql

-- Inserção de Produtos (Pizzas)
INSERT INTO products (name, description, price, image, category_id, max_flavors, is_available) VALUES
('Pizza Pequena', 'Até 1 sabor • 4 fatias', 30.00, '/Assets/10.webp', 1, 1, TRUE),
('Pizza Média', 'Até 2 sabores • 6 fatias', 35.00, '/Assets/6.webp', 1, 2, TRUE),
('Pizza Grande', 'Até 3 sabores • 8 fatias', 45.00, '/Assets/7.webp', 1, 3, TRUE),
('Pizza Família', 'Até 4 sabores • 12 fatias', 55.00, '/Assets/8.webp', 1, 4, TRUE);

-- Inserção de Produtos (Bebidas)
INSERT INTO products (name, description, price, image, category_id, is_available) VALUES
('Coca-Cola Lata', '350ml • Gelada', 5.00, '/Assets/refri-1.png', 2, TRUE),
('Guaraná Jesus Lata', '350ml • Gelada', 5.00, '/Assets/16.png', 2, TRUE),
('Guaraná Antarctica', '350ml • Gelada', 5.00, '/Assets/refri-2.png', 2, TRUE),
('Guaraná Antarctica 1L', '1L • Gelada', 10.00, '/Assets/11.png', 2, TRUE),
('Coca-Cola Pet 1L', '1L • Gelada', 10.00, '/Assets/13.png', 2, TRUE),
('Coca-Cola Zero 1L', '1L • Gelada', 10.00, '/Assets/12.png', 2, TRUE),
('Coca-Cola 2L', '2L • Gelada', 12.00, '/Assets/14.png', 2, TRUE),
('Guaraná Antarctica 2L', '2L • Gelada', 12.00, '/Assets/17.png', 2, TRUE),
('Guaraná Jesus 2L', '2L • Gelada', 12.00, '/Assets/15.png', 2, TRUE);

-- Inserção de Sabores
INSERT INTO flavors (name, ingredients, category_id, is_available) VALUES
('Mussarela', 'Queijo mussarela, tomate, orégano', 1, TRUE),
('Calabresa', 'Calabresa, cebola, queijo', 1, TRUE),
('Portuguesa', 'Presunto, queijo, ovo, cebola, azeitona', 1, TRUE),
('Frango com Catupiry', 'Frango desfiado, catupiry, milho', 2, TRUE),
('Quatro Queijos', 'Mussarela, provolone, parmesão, gorgonzola', 2, TRUE),
('Margherita', 'Mussarela, tomate, manjericão', 1, TRUE),
('Pepperoni', 'Pepperoni, queijo, orégano', 2, TRUE),
('Bacon', 'Bacon, queijo, cebola', 2, TRUE),
('Chocolate', 'Chocolate ao leite, granulado', 3, TRUE),
('Brigadeiro', 'Chocolate, granulado, leite condensado', 3, TRUE);

-- Criação de um usuário administrador (senha: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Administrador', 'admin@pizzariaoliveira.com', '$2b$10$X/8E1xSrfUjLGE5hRPfE5.5GBGrVQOvIaPFzFyBfUMgFEv4utUVJa', 'admin');