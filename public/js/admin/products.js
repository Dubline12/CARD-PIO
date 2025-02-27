// public/js/admin/products.js

// Módulo para gerenciamento de produtos no painel administrativo
const ProductsModule = {
    // Estado local
    state: {
      products: [],
      categories: [],
      filteredProducts: [],
      currentFilter: 'all',
      isLoading: false,
      currentProduct: null,
      isEditMode: false
    },
  
    // Inicializar o módulo
    init() {
      // Se não estiver autenticado, não prosseguir
      if (!window.adminAuth || !window.adminAuth.isAuthenticated()) return;
  
      // Inicializar elementos da UI
      this.initUI();
      
      // Carregar dados
      this.loadData();
    },
  
    // Inicializar elementos da UI
    initUI() {
      // Configurar abas de categoria
      const categoryTabs = document.querySelectorAll('.nav-tab[data-category]');
      categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.filterProducts(tab.dataset.category);
          
          // Atualizar estado das abas
          categoryTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      });
      
      // Configurar botão de adicionar produto
      const addButton = document.getElementById('add-product-btn');
      if (addButton) {
        addButton.addEventListener('click', () => {
          this.showProductForm();
        });
      }
    },
  
    // Carregar dados de produtos e categorias
    async loadData() {
      try {
        this.state.isLoading = true;
        this.updateLoadingState(true);
        
        // Carregar categorias
        await this.loadCategories();
        
        // Carregar produtos
        await this.loadProducts();
        
        // Filtrar produtos
        this.filterProducts(this.state.currentFilter);
        
        this.updateLoadingState(false);
        this.state.isLoading = false;
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        this.updateLoadingState(false);
        this.state.isLoading = false;
        window.adminApp.showNotification('Erro ao carregar produtos', 'error');
      }
    },
  
    // Carregar categorias
    async loadCategories() {
      try {
        const categories = await window.adminApp.fetchWithAuth('/api/categories');
        this.state.categories = categories || [];
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        this.state.categories = [];
        throw error;
      }
    },
  
    // Carregar produtos
    async loadProducts() {
      try {
        const products = await window.adminApp.fetchWithAuth('/api/products');
        this.state.products = products || [];
        this.state.filteredProducts = [...this.state.products];
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        this.state.products = [];
        this.state.filteredProducts = [];
        throw error;
      }
    },
  
    // Filtrar produtos por categoria
    filterProducts(categorySlug) {
      this.state.currentFilter = categorySlug;
      
      if (categorySlug === 'all') {
        this.state.filteredProducts = [...this.state.products];
      } else {
        this.state.filteredProducts = this.state.products.filter(product => {
          const category = this.state.categories.find(c => c.id === product.category_id);
          return category && category.slug === categorySlug;
        });
      }
      
      this.renderProductsList();
    },
  
    // Renderizar lista de produtos
    renderProductsList() {
      const container = document.getElementById('products-list');
      if (!container) return;
      
      if (this.state.filteredProducts.length === 0) {
        container.innerHTML = `
          <div class="text-center text-gray-500 py-10">
            Nenhum produto encontrado nesta categoria
          </div>
        `;
        return;
      }
      
      const productItems = this.state.filteredProducts.map(product => {
        const category = this.state.categories.find(c => c.id === product.category_id);
        
        return `
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="flex p-4">
              <div class="w-24 h-24 flex-shrink-0">
                <img src="${product.image || '/Assets/placeholder.png'}" alt="${product.name}" 
                     class="w-full h-full object-cover rounded-lg">
              </div>
              <div class="ml-4 flex-1">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-bold text-gray-800">${product.name}</h3>
                    <p class="text-sm text-gray-600">${product.description || ''}</p>
                    <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      ${category ? category.name : 'Sem categoria'}
                    </span>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-gray-800">${this.formatCurrency(product.price)}</p>
                    <span class="text-xs ${product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 py-1 rounded-full">
                      ${product.is_available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                </div>
                <div class="mt-4 flex justify-end space-x-2">
                  <button class="edit-product-btn px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
                          data-id="${product.id}">
                    <i class="fas fa-edit mr-1"></i> Editar
                  </button>
                  <button class="toggle-product-btn px-3 py-1 
                                 ${product.is_available ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} 
                                 rounded-lg text-sm transition-colors"
                          data-id="${product.id}"
                          data-available="${product.is_available}">
                    <i class="fas ${product.is_available ? 'fa-times' : 'fa-check'} mr-1"></i> 
                    ${product.is_available ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      container.innerHTML = productItems;
      
      // Adicionar listeners de evento aos botões
      container.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const productId = btn.dataset.id;
          const product = this.state.products.find(p => p.id.toString() === productId);
          if (product) {
            this.showProductForm(product);
          }
        });
      });
      
      container.querySelectorAll('.toggle-product-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const productId = btn.dataset.id;
          const isAvailable = btn.dataset.available === 'true';
          this.toggleProductAvailability(productId, !isAvailable);
        });
      });
    },
  
    // Mostrar formulário de produto
    showProductForm(product = null) {
      // Aqui você implementaria a lógica para mostrar o formulário de produto
      // Por enquanto, vamos apenas mostrar uma mensagem no console
      
      this.state.currentProduct = product;
      this.state.isEditMode = !!product;
      
      console.log(product ? `Editar produto: ${product.name}` : 'Adicionar novo produto');
      
      if (product) {
        window.adminApp.showNotification('Funcionalidade de edição de produto será implementada em breve', 'info');
      } else {
        window.adminApp.showNotification('Funcionalidade de adição de produto será implementada em breve', 'info');
      }
    },
  
    // Alternar disponibilidade do produto
    async toggleProductAvailability(productId, makeAvailable) {
      try {
        this.state.isLoading = true;
        
        console.log(`${makeAvailable ? 'Ativando' : 'Desativando'} produto ID ${productId}`);
        
        // Aqui você implementaria a chamada à API para atualizar o produto
        /*
        const updatedProduct = await window.adminApp.fetchWithAuth(`/api/products/${productId}/toggle`, {
          method: 'PATCH',
          body: JSON.stringify({ is_available: makeAvailable })
        });
        */
        
        // Por enquanto, vamos apenas simular a atualização
        const productIndex = this.state.products.findIndex(p => p.id.toString() === productId.toString());
        if (productIndex !== -1) {
          this.state.products[productIndex].is_available = makeAvailable;
          
          // Atualizar produtos filtrados
          const filteredIndex = this.state.filteredProducts.findIndex(p => p.id.toString() === productId.toString());
          if (filteredIndex !== -1) {
            this.state.filteredProducts[filteredIndex].is_available = makeAvailable;
          }
          
          this.renderProductsList();
          
          window.adminApp.showNotification(
            `Produto ${makeAvailable ? 'ativado' : 'desativado'} com sucesso`,
            'success'
          );
        }
        
        this.state.isLoading = false;
      } catch (error) {
        console.error('Erro ao alternar disponibilidade do produto:', error);
        this.state.isLoading = false;
        window.adminApp.showNotification('Erro ao atualizar produto', 'error');
      }
    },
  
    // Atualizar estado de carregamento
    updateLoadingState(isLoading) {
      const container = document.getElementById('products-section');
      if (container) {
        if (isLoading) {
          container.classList.add('opacity-50');
          container.style.pointerEvents = 'none';
        } else {
          container.classList.remove('opacity-50');
          container.style.pointerEvents = 'auto';
        }
      }
    },
  
    // Formatar valor como moeda
    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
  };
  
  // Exportar o módulo para o escopo global
  window.ProductsModule = ProductsModule;