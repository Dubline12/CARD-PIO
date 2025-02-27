# Pizzaria Oliveira - Sistema Completo com NeonDB

Um sistema de gestão e e-commerce completo para a Pizzaria Oliveira, permitindo gerenciar produtos, pedidos e sabores com integração ao banco de dados NeonDB.

## 📋 Funcionalidades

### Cliente

- Cardápio digital responsivo
- Seleção de sabores personalizados
- Carrinho de compras
- Sistema de pedidos com entrega, retirada ou consumo local
- Múltiplas opções de pagamento
- Integração com WhatsApp para envio de pedidos

### Administração

- Painel de controle com estatísticas de vendas
- Gerenciamento de produtos, sabores e bordas
- Acompanhamento de pedidos em tempo real
- Customização de preços e disponibilidade
- Configurações do sistema

## 🚀 Tecnologias

- **Frontend:** HTML, CSS, JavaScript e Tailwind CSS
- **Backend:** Node.js e Express
- **Banco de Dados:** PostgreSQL (NeonDB)
- **Autenticação:** JWT (JSON Web Tokens)

## 🔧 Configuração do Ambiente

### Pré-requisitos

- Node.js (v14+)
- npm ou yarn
- Conta no NeonDB (banco de dados PostgreSQL)

### Instalação

1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/pizzaria-oliveira.git
cd pizzaria-oliveira
```

2. Instale as dependências

```bash
npm install
```

3. Configure as variáveis de ambiente

- Renomeie o arquivo `.env.example` para `.env`
- Preencha as variáveis de ambiente com suas credenciais do NeonDB

4. Configure o banco de dados

```bash
npm run setup-db
```

5. Inicie o servidor

```bash
npm start
```

## 📱 Uso do Sistema

### Cliente

- Acesse a aplicação pelo navegador: `http://localhost:3000`
- Navegue pelo cardápio
- Personalize pizzas com sabores
- Adicione produtos ao carrinho
- Finalize o pedido com suas informações
- Receba confirmação via WhatsApp

### Administrador

- Acesse o painel administrativo: `http://localhost:3000/admin`
- Faça login com as credenciais de administrador
  - Email: `admin@pizzariaoliveira.com`
  - Senha: `admin123`
- Gerencie produtos, sabores e bordas
- Acompanhe e atualize o status dos pedidos
- Visualize estatísticas de vendas
- Configure os parâmetros do sistema

## 📊 Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- **categories**: Categorias de produtos (pizzas, bebidas, etc)
- **products**: Produtos disponíveis para venda
- **flavor_categories**: Categorias de sabores (tradicional, especial, doce)
- **flavors**: Sabores disponíveis para as pizzas
- **borders**: Opções de bordas para as pizzas
- **orders**: Pedidos realizados pelos clientes
- **order_items**: Itens dos pedidos
- **order_item_flavors**: Sabores selecionados para cada item
- **users**: Usuários do painel administrativo

## 🔒 Segurança

- Autenticação JWT para acesso ao painel administrativo
- Senhas armazenadas com hash bcrypt
- Validação de dados em todas as operações
- Proteção contra SQL Injection

## 📝 Personalização

O sistema foi desenvolvido para ser facilmente personalizável:

- Edite o arquivo `public/css/style.css` para ajustar a aparência
- Modifique os valores no arquivo `.env` para alterar configurações globais
- Atualize o logo e imagens na pasta `public/Assets`

## 📄 Licença

Este projeto está licenciado sob a licença ISC - veja o arquivo LICENSE para detalhes.

## 👥 Autores

- **Anderson Felipe** - _Desenvolvimento Inicial_

## 🙏 Agradecimentos

- Equipe da Pizzaria Oliveira por fornecer requisitos e feedback
- Comunidade NeonDB por disponibilizar recursos e documentação
