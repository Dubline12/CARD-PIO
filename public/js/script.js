// public/js/script.js

// Cache de navegação
const NavigationCache = {
  data: new Map(),

  set(key, data) {
    this.data.set(key, {
      data: data,
      timestamp: Date.now(),
    });
  },

  get(key) {
    const cached = this.data.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minutos
      return cached.data;
    }
    return null;
  },

  clear() {
    this.data.clear();
  },
};

// Função de transição de página otimizada
function navigateToPage(url, data = null) {
  // Salvar dados do estado atual
  if (window.state) {
    NavigationCache.set("currentState", window.state);
  }

  // Animação de saída
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.2s ease";

  setTimeout(() => {
    if (data) {
      const params = new URLSearchParams(data);
      window.location.href = `${url}?${params.toString()}`;
    } else {
      window.location.href = url;
    }
  }, 200);
}

// Otimizar carregamento da página
document.addEventListener("DOMContentLoaded", () => {
  // Restaurar opacidade
  document.body.style.opacity = "1";

  // Restaurar estado se existir
  const cachedState = NavigationCache.get("currentState");
  if (cachedState) {
    window.state = { ...cachedState };
  }
});

// Função global de alerta
if (typeof window.showAlert === "undefined") {
  window.showAlert = function (title, message, type = "success") {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50";
    alertDiv.innerHTML = `
            <h3 class="font-bold text-lg">${title}</h3>
            <p class="text-sm">${message}</p>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  };
}

// Constantes e Configurações
const MENU_CATEGORIES = {
  PIZZAS: "pizzas",
  DRINKS: "drinks",
};

// Estado da aplicação
const state = {
  activeTab: MENU_CATEGORIES.PIZZAS,
  cart: [],
  deliveryMethod: null,
  selectedBorder: null,
  isModalOpen: false,
  loading: false,
  products: {
    pizzas: [],
    drinks: [],
  },
  flavors: [],
  borders: [],
};

// Funções utilitárias
function formatPrice(price) {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function showAlert(title, message, type = "success") {
  const alertDiv = document.createElement("div");
  alertDiv.className = "whatsapp-alert";

  const icons = {
    success: '<i class="fas fa-check text-white"></i>',
    error: '<i class="fas fa-times text-white"></i>',
    warning: '<i class="fas fa-exclamation text-white"></i>',
  };

  const colors = {
    success: "#25D366",
    error: "#DC3545",
    warning: "#FFC107",
  };

  alertDiv.innerHTML = `
        <div class="whatsapp-alert-header" style="background: ${colors[type]}">
            <div class="whatsapp-alert-icon">
                ${icons[type]}
            </div>
            <span>${title}</span>
        </div>
        <div class="whatsapp-alert-body">
            ${message}
        </div>
    `;

  document
    .querySelectorAll(".whatsapp-alert")
    .forEach((alert) => alert.remove());
  document.body.appendChild(alertDiv);

  requestAnimationFrame(() => {
    alertDiv.style.transform = "translateX(0)";
    alertDiv.style.opacity = "1";
  });

  setTimeout(() => {
    alertDiv.style.transform = "translateX(100%)";
    alertDiv.style.opacity = "0";
    setTimeout(() => alertDiv.remove(), 300);
  }, 3000);
}

function updateStoreStatus() {
  const statusContainer = document.getElementById("status-container");
  const statusIndicator = document.getElementById("status-indicator");
  const statusText = document.getElementById("status-text");

  if (!statusContainer || !statusIndicator || !statusText) return;

  const now = new Date();
  const hour = now.getHours();
  const isOpen = hour >= 18 && hour < 24;

  statusContainer.className = `flex items-center justify-center gap-2 px-4 py-1 mt-1 rounded-xl text-lg shadow-md ${
    isOpen ? "bg-lime-400" : "bg-orange-600"
  }`;
  statusIndicator.className = `w-2 h-2 rounded-full animate-ping ${
    isOpen ? "bg-green-800" : "bg-orange-800"
  }`;
  statusText.textContent = isOpen ? "Aberto 🍕" : "Fechado ⏰";
}

// Adicionar loader na página
function showLoader() {
  state.loading = true;

  const existingLoader = document.getElementById("page-loader");
  if (existingLoader) {
    existingLoader.classList.remove("hidden");
    return;
  }

  const loader = document.createElement("div");
  loader.id = "page-loader";
  loader.className =
    "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50";
  loader.innerHTML = `
        <div class="bg-white p-5 rounded-lg flex flex-col items-center">
            <div class="w-12 h-12 border-4 border-t-green-500 border-gray-200 rounded-full animate-spin mb-3"></div>
            <p class="text-gray-700">Carregando...</p>
        </div>
    `;

  document.body.appendChild(loader);
}

function hideLoader() {
  state.loading = false;
  const loader = document.getElementById("page-loader");
  if (loader) {
    loader.classList.add("hidden");
  }
}

// Gerenciador do Menu
class MenuManager {
  constructor(cartManagerInstance) {
    this.menuContainer = document.getElementById("menu-container");
    this.pizzasTab = document.getElementById("pizzas-tab");
    this.drinksTab = document.getElementById("drinks-tab");
    this.cartManager = cartManagerInstance;

    this.loadProductsFromAPI();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.pizzasTab) {
      this.pizzasTab.addEventListener("click", () =>
        this.switchTab(MENU_CATEGORIES.PIZZAS)
      );
    }

    if (this.drinksTab) {
      this.drinksTab.addEventListener("click", () =>
        this.switchTab(MENU_CATEGORIES.DRINKS)
      );
    }
  }

  async loadProductsFromAPI() {
    if (!this.menuContainer) return;

    try {
      showLoader();

      // Verificar se há uma aba salva
      const savedTab = localStorage.getItem("activeTab");
      if (savedTab) {
        state.activeTab = savedTab;
        localStorage.removeItem("activeTab");
      }

      // Carregar todos os produtos
      const pizzas = await window.apiService.getProducts("pizzas");
      const drinks = await window.apiService.getProducts("drinks");

      // Atualizar o estado
      state.products.pizzas = pizzas;
      state.products.drinks = drinks;

      // Carregar sabores e bordas para referência
      state.flavors = await window.apiService.getFlavors();
      state.borders = await window.apiService.getBorders();

      // Atualizar a UI
      this.updateMenuContent();
      this.updateTabsUI(state.activeTab);

      hideLoader();
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      showAlert(
        "Erro",
        "Não foi possível carregar os produtos. Tente novamente.",
        "error"
      );
      hideLoader();
    }
  }

  switchTab(category) {
    if (!this.menuContainer) return;

    state.activeTab = category;
    this.updateTabsUI(category);
    this.updateMenuContent();
  }

  updateTabsUI(activeCategory) {
    if (!this.pizzasTab || !this.drinksTab) return;

    // Remove todas as classes primeiro
    [this.pizzasTab, this.drinksTab].forEach((tab) => {
      tab.classList.remove(
        "border-green-500",
        "text-green-500",
        "border-transparent",
        "text-gray-500",
        "active"
      );
      tab.classList.add("border-transparent", "text-gray-500");
    });

    // Adiciona as classes ao tab ativo
    const activeTab =
      activeCategory === MENU_CATEGORIES.PIZZAS
        ? this.pizzasTab
        : this.drinksTab;
    activeTab.classList.remove("border-transparent", "text-gray-500");
    activeTab.classList.add("border-green-500", "text-green-500", "active");
  }

  updateMenuContent() {
    if (!this.menuContainer) return;

    const items =
      state.activeTab === MENU_CATEGORIES.PIZZAS
        ? state.products.pizzas
        : state.products.drinks;

    // Animação de saída
    this.menuContainer.style.transition = "all 0.2s ease-in-out";
    this.menuContainer.style.transform = "translateX(-20px)";
    this.menuContainer.style.opacity = "0";

    setTimeout(() => {
      this.menuContainer.innerHTML = "";

      if (items.length === 0) {
        this.menuContainer.innerHTML = `
                    <div class="bg-white rounded-xl shadow-sm p-6 text-center">
                        <p class="text-gray-500">Nenhum item encontrado</p>
                    </div>
                `;
      } else {
        items.forEach((item) => {
          const itemElement = this.createMenuItem(item);
          this.menuContainer.appendChild(itemElement);
        });
      }

      // Animação de entrada
      requestAnimationFrame(() => {
        this.menuContainer.style.transform = "translateX(0)";
        this.menuContainer.style.opacity = "1";
      });
    }, 200);
  }

  createMenuItem(item) {
    const div = document.createElement("div");
    div.className =
      "bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300";

    div.innerHTML = `
            <div class="flex flex-row">
                <img src="${item.image}" alt="${item.name}" 
                     class="w-28 h-28 sm:w-40 sm:h-40 object-cover"
                     loading="lazy"
                     decoding="async"
                     onerror="this.src='./Assets/placeholder.png'">
                <div class="flex-1 p-4 flex flex-col">
                    <h3 class="font-bold text-base sm:text-lg mb-1">${
                      item.name
                    }</h3>
                    <p class="text-gray-600 text-xs sm:text-sm mb-2">${
                      item.description
                    }</p>
                    <div class="mt-auto flex flex-row items-center justify-between gap-2">
                        <span class="font-bold text-base sm:text-lg">${formatPrice(
                          item.price
                        )}</span>
                        ${
                          item.max_flavors
                            ? `
                            <button class="flavor-button bg-green-500 text-white px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-2" 
                                    data-id="${item.id}"
                                    data-max-flavors="${item.max_flavors}"
                                    data-price="${item.price}"
                                    data-name="${item.name}">
                                <i class="fas fa-pizza-slice w-3 h-3 sm:w-4 sm:h-4"></i>
                                Escolher
                            </button>
                        `
                            : `
                            <button class="add-to-cart-btn bg-green-500 text-white px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-2" 
                                    data-id="${item.id}">
                                ${
                                  item.category_name === "Bebidas"
                                    ? '<i class="fas fa-plus"></i> Ver Mais'
                                    : '<i class="fas fa-cart-plus"></i> Adicionar'
                                }
                            </button>
                        `
                        }
                    </div>
                </div>
            </div>
        `;

    // Event Listeners
    const flavorButton = div.querySelector(".flavor-button");
    if (flavorButton) {
      flavorButton.addEventListener("click", (e) => {
        e.preventDefault();
        const { id, maxFlavors, name, price } = flavorButton.dataset;
        window.location.href = `sabores.html?id=${id}&maxFlavors=${maxFlavors}&name=${encodeURIComponent(
          name
        )}&price=${price}`;
      });
    }

    const addToCartBtn = div.querySelector(".add-to-cart-btn");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = addToCartBtn.dataset.id;
        const product = this.getProductById(productId);

        if (product.category_name === "Bebidas") {
          const params = new URLSearchParams({
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            image: encodeURIComponent(product.image),
          });
          window.location.href = `bebida.html?${params.toString()}`;
        } else {
          if (this.cartManager) {
            this.cartManager.addItem({
              ...product,
              quantity: 1,
            });
          }
        }
      });
    }

    return div;
  }

  getProductById(id) {
    // Procurar em ambas as categorias
    const allProducts = [...state.products.pizzas, ...state.products.drinks];
    return allProducts.find(
      (product) => product.id.toString() === id.toString()
    );
  }
}

// Gerenciador do Carrinho
class CartManager {
  constructor() {
    this.cartModal = document.getElementById("cart-modal");
    this.cartItems = document.getElementById("cart-items");
    this.cartTotal = document.getElementById("cart-total");
    this.cartCount = document.getElementById("cart-count");

    this.setupEventListeners();
    this.loadCart();
    this.updateCartUI();
  }

  setupEventListeners() {
    const openCartBtn = document.getElementById("open-cart");
    if (openCartBtn) {
      openCartBtn.addEventListener("click", () => this.openCart());
    }

    const closeCartBtn = document.getElementById("close-cart");
    if (closeCartBtn) {
      closeCartBtn.addEventListener("click", () => this.closeCart());
    }

    const checkoutButton = document.getElementById("checkout-button");
    if (checkoutButton) {
      checkoutButton.addEventListener("click", () => this.handleCheckout());
    }

    document.querySelectorAll(".delivery-method").forEach((button) => {
      button.addEventListener("click", () =>
        this.handleDeliveryMethodSelect(button)
      );
    });
  }

  handleDeliveryMethodSelect(button) {
    state.deliveryMethod = button.dataset.method;

    document.querySelectorAll(".delivery-method").forEach((btn) => {
      btn.classList.remove("bg-green-500", "text-white");
      btn.classList.add("bg-gray-100");
    });

    button.classList.remove("bg-gray-100");
    button.classList.add("bg-green-500", "text-white");
  }

  openCart() {
    if (!this.cartModal) return;

    state.isModalOpen = true;
    this.cartModal.classList.remove("hidden");
    this.cartModal.style.opacity = "0";

    const modalContent = this.cartModal.querySelector(".absolute");
    if (modalContent) {
      modalContent.style.transform = "translateX(100%)";

      requestAnimationFrame(() => {
        this.cartModal.style.opacity = "1";
        modalContent.style.transform = "translateX(0)";
        modalContent.style.transition = "transform 0.2s ease-out";
      });
    }
  }

  closeCart() {
    if (!this.cartModal) return;

    const modalContent = this.cartModal.querySelector(".absolute");
    if (modalContent) {
      modalContent.style.transform = "translateX(100%)";
      this.cartModal.style.opacity = "0";

      setTimeout(() => {
        this.cartModal.classList.add("hidden");
        modalContent.style.transform = "";
        state.isModalOpen = false;
      }, 200);
    }
  }

  handleCheckout() {
    if (state.cart.length === 0) {
      showAlert("⚠️ Atenção", "Seu carrinho está vazio!", "error");
      return;
    }

    if (!state.deliveryMethod) {
      showAlert(
        "⚠️ Atenção",
        "Selecione como deseja receber seu pedido",
        "error"
      );
      return;
    }

    this.closeCart();
    DeliveryModals.showModal(state.deliveryMethod);
  }

  addItem(item) {
    let newItem = { ...item, quantity: 1 };

    if (item.selectedFlavors && state.selectedBorder) {
      const border = state.borders.find(
        (b) => b.id.toString() === state.selectedBorder.toString()
      );
      if (border) {
        newItem.border = border;
      }
    }

    const existingItemIndex = state.cart.findIndex(
      (i) =>
        i.id === item.id &&
        JSON.stringify(i.selectedFlavors) ===
          JSON.stringify(item.selectedFlavors) &&
        JSON.stringify(i.border) === JSON.stringify(newItem.border)
    );

    if (existingItemIndex !== -1) {
      state.cart[existingItemIndex].quantity++;
    } else {
      state.cart.push(newItem);
    }

    this.updateCartUI();
    this.saveCart();
    showAlert(
      "✅ Carrinho Atualizado",
      `${item.name} foi adicionado ao carrinho`,
      "success"
    );
  }

  updateCartUI() {
    if (this.cartCount) {
      const totalItems = state.cart.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      this.cartCount.textContent = totalItems;
    }

    if (this.cartItems) {
      if (state.cart.length === 0) {
        this.cartItems.innerHTML = `
                  <div class="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 min-h-[200px]">
                        <i class="fas fa-shopping-bag w-16 h-16 mb-4 flex items-center justify-center"></i>
                        <p class="text-lg text-center">Seu carrinho está vazio</p>
                    </div>
                `;
      } else {
        this.cartItems.innerHTML = state.cart
          .map((item) => this.getCartItemHTML(item))
          .join("");
      }
    }

    if (this.cartTotal) {
      const total = state.cart.reduce((sum, item) => {
        let itemTotal = item.price * item.quantity;
        if (item.border) {
          itemTotal += item.border.price * item.quantity;
        }
        return sum + itemTotal;
      }, 0);

      this.cartTotal.textContent = formatPrice(total);
    }

    this.addQuantityListeners();
  }

  getCartItemHTML(item) {
    return `
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold">${item.name}</h3>
                        <div class="flex items-center gap-2">
                            <button class="quantity-btn w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full" 
                                    data-item-id="${item.id}" 
                                    data-delta="-1">
                                <i class="fas fa-minus w-4 h-4"></i>
                            </button>
                            <span class="font-medium min-w-[2rem] text-center">${
                              item.quantity
                            }</span>
                            <button class="quantity-btn w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full" 
                                    data-item-id="${item.id}" 
                                    data-delta="1">
                                <i class="fas fa-plus w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    ${
                      item.selectedFlavors
                        ? `<p class="text-sm text-gray-600">Sabores: ${item.selectedFlavors.join(
                            ", "
                          )}</p>`
                        : ""
                    }
                    ${
                      item.border
                        ? `<p class="text-sm text-gray-600">Borda: ${
                            item.border.name
                          } (+${formatPrice(item.border.price)})</p>`
                        : ""
                    }
                    <p class="text-gray-600 text-sm mt-2">${formatPrice(
                      (item.price + (item.border?.price || 0)) * item.quantity
                    )}</p>
                </div>
            </div>
        `;
  }

  addQuantityListeners() {
    document.querySelectorAll(".quantity-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        const delta = parseInt(btn.dataset.delta);
        this.updateItemQuantity(itemId, delta);
      });
    });
  }

  updateItemQuantity(itemId, delta) {
    const itemIndex = state.cart.findIndex(
      (i) => i.id.toString() === itemId.toString()
    );
    if (itemIndex !== -1) {
      state.cart[itemIndex].quantity += delta;

      if (state.cart[itemIndex].quantity <= 0) {
        state.cart.splice(itemIndex, 1);
      }

      this.updateCartUI();
      this.saveCart();
    }
  }

  saveCart() {
    localStorage.setItem("cart", JSON.stringify(state.cart));
  }

  loadCart() {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      state.cart = JSON.parse(savedCart);
    }

    const savedFlavors = localStorage.getItem("selectedFlavors");
    if (savedFlavors) {
      try {
        const pizzaData = JSON.parse(savedFlavors);
        if (pizzaData && pizzaData.flavors && pizzaData.flavors.length > 0) {
          this.addItem({
            id: pizzaData.id,
            name: pizzaData.name,
            price: parseFloat(pizzaData.price),
            selectedFlavors: pizzaData.flavors,
            border: pizzaData.border,
            quantity: 1,
          });
          localStorage.removeItem("selectedFlavors");
        }
      } catch (error) {
        console.error("Erro ao processar sabores salvos:", error);
      }
    }
  }
}

// Inicialização da aplicação
function initializeApplication() {
  try {
    window.cartManager = new CartManager();
    window.menuManager = new MenuManager(window.cartManager);

    updateStoreStatus();
    setInterval(updateStoreStatus, 60000);
  } catch (error) {
    console.error("Erro ao inicializar:", error);
    showAlert(
      "⚠️ Erro no Sistema",
      "Não foi possível iniciar a aplicação. Tente novamente.",
      "error"
    );
  }
}

// Inicia a aplicação
document.addEventListener("DOMContentLoaded", initializeApplication);
