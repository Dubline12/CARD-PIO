// delivery-modals.js
const DeliveryModals = {
  // Lista de bairros disponíveis - será carregada dinamicamente do banco de dados
  availableNeighborhoods: [],

  // Métodos de pagamento - será carregado das configurações do sistema
  paymentMethods: [
    { value: "pix", label: "PIX" },
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "cash", label: "Dinheiro" },
  ],

  // Taxa de entrega - será carregada das configurações do sistema
  deliveryFee: 5.0,

  // Inicializar módulo
  init() {
    // Carregar dados do servidor
    this.loadData();

    // Configurar eventos de tecla
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.querySelector(".fixed.inset-0");
        if (modal) {
          this.closeModal(false);
        }
      }
    });
  },

  // Carregar dados necessários para os modais
  async loadData() {
    try {
      // Carregar bairros disponíveis
      const neighborhoodsResponse = await fetch("/api/neighborhoods");
      if (neighborhoodsResponse.ok) {
        const data = await neighborhoodsResponse.json();
        this.availableNeighborhoods = data.map((n) => n.name);
      }

      // Carregar configurações do sistema
      const configResponse = await fetch("/api/settings");
      if (configResponse.ok) {
        const config = await configResponse.json();
        if (config.delivery_fee) {
          this.deliveryFee = parseFloat(config.delivery_fee);
        }

        if (config.payment_methods && Array.isArray(config.payment_methods)) {
          this.paymentMethods = config.payment_methods;
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados para o modal:", error);
      // Se falhar, mantém os dados padrão
    }
  },

  // Métodos de normalização e validação
  normalizeNeighborhoodName(name) {
    return name.trim().replace(/\s+/g, " ");
  },

  isValidNeighborhood(name) {
    const normalizedName = this.normalizeNeighborhoodName(name);
    return this.availableNeighborhoods.some(
      (n) => this.normalizeNeighborhoodName(n) === normalizedName
    );
  },

  // Método para formatar telefone
  formatPhone(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 2) {
      value = "(" + value.substring(0, 2) + ") " + value.substring(2);
    }
    if (value.length > 9) {
      value = value.substring(0, 10) + "-" + value.substring(10);
    }

    input.value = value;
  },

  // Método para mostrar o modal
  showModal(method) {
    const modalOverlay = document.createElement("div");
    modalOverlay.className =
      "fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50";

    // Fecha qualquer modal existente
    this.closeModal();

    // Escolhe o template correto
    let template;
    switch (method) {
      case "delivery":
        template = this.getDeliveryTemplate();
        break;
      case "pickup":
        template = this.getPickupTemplate();
        break;
      case "dineIn":
        template = this.getDineInTemplate();
        break;
      default:
        console.error("Método de entrega inválido");
        return;
    }

    // Cria e adiciona o modal
    const modalWrapper = document.createElement("div");
    modalWrapper.innerHTML = template;
    const modalElement = modalWrapper.firstElementChild;
    document.body.appendChild(modalElement);

    // Carrega dados salvos para entrega
    if (method === "delivery") {
      const savedData = localStorage.getItem("deliveryData");
      if (savedData) {
        const data = JSON.parse(savedData);
        const form = document.getElementById("deliveryForm");
        if (form) {
          Object.keys(data).forEach((key) => {
            const input = form.elements[key];
            if (input) {
              input.value = data[key];
            }
          });
        }
      }
    }

    // Configura os event listeners
    this.setupEventListeners(method, modalElement);

    // Animação de fade in
    requestAnimationFrame(() => {
      modalElement.style.opacity = "0";
      requestAnimationFrame(() => {
        modalElement.style.transition = "opacity 0.3s ease-out";
        modalElement.style.opacity = "1";
      });
    });
  },

  // Método para fechar o modal
  closeModal(shouldReload = false) {
    const modal = document.querySelector(".fixed.inset-0");
    if (modal) {
      modal.style.opacity = "0";
      setTimeout(() => {
        modal.remove();
        if (
          shouldReload &&
          modal.querySelector(".close-modal") &&
          document.querySelector("#cart-modal")
        ) {
          window.location.reload();
        }
      }, 300);
    }
  },

  // Manipulação de submissão do formulário
  async handleSubmit(e, method) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!this.validateForm(data, method)) {
      return;
    }

    // Exibir indicador de carregamento
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Processando...';
    }

    try {
      // Calcula o total com taxa de entrega, se aplicável
      const currentTotal = state.cart.reduce((sum, item) => {
        let itemTotal = item.price * item.quantity;
        if (item.border) {
          itemTotal += item.border.price * item.quantity;
        }
        return sum + itemTotal;
      }, 0);

      if (method === "delivery") {
        data.totalWithDelivery = currentTotal + this.deliveryFee;
        data.deliveryFee = this.deliveryFee;
      } else {
        data.totalWithDelivery = currentTotal;
        data.deliveryFee = 0;
      }

      // Salva dados de entrega, se solicitado
      if (method === "delivery" && data.saveData) {
        delete data.saveData;
        localStorage.setItem("deliveryData", JSON.stringify(data));
      }

      // Prepara dados do pedido
      const orderData = {
        ...data,
        items: state.cart,
        deliveryMethod: method,
        orderId: OrderHandler.generateOrderId(), // Gera ID único
        timestamp: new Date().toISOString(), // Adiciona timestamp
      };

      // Enviar pedido para o servidor
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao processar pedido");
      }

      const responseData = await response.json();

      // Fecha modal atual
      this.closeModal(false);

      // Mostra página de confirmação
      setTimeout(() => {
        try {
          if (
            typeof WhatsAppModule !== "undefined" &&
            WhatsAppModule.createOrderConfirmationPage
          ) {
            // Usar dados da resposta para ter o ID do banco de dados
            WhatsAppModule.createOrderConfirmationPage({
              ...orderData,
              id: responseData.id, // ID do pedido no banco de dados
            });
            WhatsAppModule.sendOrder(orderData);
          } else {
            console.error("WhatsApp module not found or method missing");
            window.showAlert(
              "Erro",
              "Não foi possível processar seu pedido",
              "error"
            );
          }
        } catch (error) {
          console.error("Erro ao processar pedido:", error);
          window.showAlert(
            "Erro",
            "Ocorreu um erro inesperado ao processar o pedido",
            "error"
          );
        }
      }, 100);
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      window.showAlert(
        "Erro",
        error.message || "Ocorreu um erro ao processar o pedido",
        "error"
      );

      // Restaurar botão de envio
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  },

  // Configuração de event listeners
  setupEventListeners(method, modalElement) {
    const closeButton = modalElement.querySelector(".close-modal");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.closeModal(false));
    }

    modalElement.addEventListener("click", (e) => {
      if (e.target === modalElement) {
        this.closeModal(false);
      }
    });

    const form = modalElement.querySelector("form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleSubmit(e, method));
    }

    // Autocomplete de bairro
    const neighborhoodInput = modalElement.querySelector(
      'input[name="neighborhood"]'
    );
    const suggestionsDiv = modalElement.querySelector(
      ".neighborhood-suggestions"
    );

    if (neighborhoodInput && suggestionsDiv) {
      neighborhoodInput.addEventListener("input", (e) => {
        const value = e.target.value.toLowerCase();
        const suggestions = this.availableNeighborhoods.filter((n) =>
          n.toLowerCase().includes(value)
        );

        if (value && suggestions.length > 0) {
          suggestionsDiv.innerHTML = suggestions
            .map(
              (n) =>
                `<div class="suggestion p-2 hover:bg-gray-100 cursor-pointer">${n}</div>`
            )
            .join("");
          suggestionsDiv.classList.remove("hidden");
        } else {
          suggestionsDiv.classList.add("hidden");
        }
      });

      suggestionsDiv.addEventListener("click", (e) => {
        if (e.target.classList.contains("suggestion")) {
          neighborhoodInput.value = e.target.textContent;
          suggestionsDiv.classList.add("hidden");
        }
      });

      document.addEventListener("click", (e) => {
        if (
          !neighborhoodInput.contains(e.target) &&
          !suggestionsDiv.contains(e.target)
        ) {
          suggestionsDiv.classList.add("hidden");
        }
      });
    }

    // Máscara de telefone
    const phoneInput = modalElement.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener("input", () => this.formatPhone(phoneInput));
    }

    // Controle de container de troco
    const paymentSelect = modalElement.querySelector(
      'select[name="paymentMethod"]'
    );
    if (paymentSelect) {
      paymentSelect.addEventListener("change", (e) => {
        const changeContainer = modalElement.querySelector("#changeContainer");
        if (changeContainer) {
          changeContainer.style.display =
            e.target.value === "cash" ? "block" : "none";
        }
      });
    }
  },

  // Validação do formulário
  validateForm(data, method) {
    const requiredFields = {
      delivery: [
        "name",
        "phone",
        "neighborhood",
        "address",
        "number",
        "paymentMethod",
      ],
      pickup: ["name", "phone", "paymentMethod"],
      dineIn: ["name", "tableNumber", "paymentMethod"],
    };

    const fields = requiredFields[method];
    for (const field of fields) {
      if (!data[field]) {
        window.showAlert(
          "Erro",
          `Por favor, preencha o campo ${this.getFieldLabel(field)}`,
          "error"
        );
        return false;
      }
    }

    if (method === "delivery") {
      const neighborhood = data.neighborhood.trim();
      if (!this.isValidNeighborhood(neighborhood)) {
        window.showAlert(
          "Erro",
          "Por favor, selecione um bairro válido da lista",
          "error"
        );
        return false;
      }
    }

    if (data.paymentMethod === "cash" && !data.changeFor) {
      window.showAlert("Erro", "Por favor, insira o valor para troco", "error");
      return false;
    }

    if (data.phone && data.phone.replace(/\D/g, "").length < 11) {
      window.showAlert(
        "Erro",
        "Por favor, insira um número de telefone válido",
        "error"
      );
      return false;
    }

    if (data.paymentMethod === "cash" && data.changeFor) {
      const changeValue = parseFloat(data.changeFor);
      const orderTotal = state.cart.reduce((sum, item) => {
        let itemTotal = item.price * item.quantity;
        if (item.border) {
          itemTotal += item.border.price * item.quantity;
        }
        return sum + itemTotal;
      }, 0);

      if (method === "delivery") {
        orderTotal += this.deliveryFee;
      }

      if (changeValue <= orderTotal) {
        window.showAlert(
          "Erro",
          "O valor para troco deve ser maior que o valor do pedido",
          "error"
        );
        return false;
      }
    }

    return true;
  },

  // Método para obter label de campo
  getFieldLabel(field) {
    const labels = {
      name: "Nome",
      phone: "Telefone",
      neighborhood: "Bairro",
      address: "Endereço",
      number: "Número",
      tableNumber: "Número da Mesa",
      paymentMethod: "Forma de Pagamento",
    };
    return labels[field] || field;
  },

  // Template para modal de entrega
  getDeliveryTemplate() {
    return `
            <div class="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50">
                <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-auto">
                    <div class="p-6 h-full flex flex-col">
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h2 class="text-2xl font-bold">Entrega</h2>
                                <p class="text-sm text-green-500 font-medium">Taxa de entrega: ${this.deliveryFee.toLocaleString(
                                  "pt-BR",
                                  { style: "currency", currency: "BRL" }
                                )}</p>
                            </div>
                            <button class="close-modal p-2 hover:bg-gray-100 rounded-full">
                                <i class="fas fa-times w-6 h-6"></i>
                            </button>
                        </div>
                        
                        <form id="deliveryForm" class="flex-1 overflow-y-auto">
                            <div class="space-y-4">
                                <!-- Nome -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                    <input type="text" name="name" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Telefone -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <input type="tel" name="phone" required
                                        placeholder="(99) 99999-9999"
                                        maxlength="15"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Bairro -->
                                <div class="relative">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                                    <input type="text" name="neighborhood" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                    <div class="neighborhood-suggestions absolute w-full bg-white border rounded-lg mt-1 shadow-lg hidden max-h-48 overflow-y-auto z-10">
                                    </div>
                                </div>

                                <!-- Endereço -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                    <input type="text" name="address" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Número e Complemento -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Número</label>
                                        <input type="text" name="number" required
                                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                                        <input type="text" name="complement"
                                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                    </div>
                                </div>

                                <!-- Ponto de Referência -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência</label>
                                    <input type="text" name="reference"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Forma de Pagamento -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                                    <select name="paymentMethod" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                        <option value="">Selecione...</option>
                                        ${this.paymentMethods
                                          .map(
                                            (method) =>
                                              `<option value="${method.value}">${method.label}</option>`
                                          )
                                          .join("")}
                                    </select>
                                </div>

                                <!-- Troco -->
                                <div id="changeContainer" class="hidden">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Troco para</label>
                                    <input type="number" name="changeFor" step="0.01" min="0"
                                        placeholder="Digite o valor para troco"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Observações -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                    <textarea name="observations" rows="3"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"></textarea>
                                </div>

                                <!-- Salvar dados -->
                                <div class="flex items-center gap-2">
                                    <input type="checkbox" id="saveData" name="saveData"
                                        class="w-4 h-4 text-green-500 focus:ring-green-500 border-gray-300 rounded">
                                    <label for="saveData" class="text-sm text-gray-600">
                                        Salvar dados para próximas compras
                                    </label>
                                </div>
                            </div>

                            <div class="sticky bottom-0 bg-white pt-4 mt-4 border-t">
                                <button type="submit" 
                                        class="w-full bg-green-500 text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300">
                                    Confirmar Pedido
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
  },

  // Template para modal de retirada
  getPickupTemplate() {
    return `
            <div class="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50">
                <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
                    <div class="p-6 h-full flex flex-col">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-2xl font-bold">Retirada</h2>
                            <button class="close-modal p-2 hover:bg-gray-100 rounded-full">
                                <i class="fas fa-times w-6 h-6"></i>
                            </button>
                        </div>
                        
                        <form id="pickupForm" class="flex-1 overflow-y-auto">
                            <div class="space-y-4">
                                <!-- Nome -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                    <input type="text" name="name" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Telefone -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <input type="tel" name="phone" required
                                        placeholder="(99) 99999-9999"
                                        maxlength="15"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Forma de Pagamento -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                                    <select name="paymentMethod" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                        <option value="">Selecione...</option>
                                        ${this.paymentMethods
                                          .map(
                                            (method) =>
                                              `<option value="${method.value}">${method.label}</option>`
                                          )
                                          .join("")}
                                    </select>
                                </div>

                                <!-- Troco -->
                                <div id="changeContainer" class="hidden">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Troco para</label>
                                    <input type="number" name="changeFor" step="0.01" min="0" placeholder="Digite o valor para troco"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Observações -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                    <textarea name="observations" rows="3"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"></textarea>
                                </div>
                            </div>

                            <div class="sticky bottom-0 bg-white pt-4 mt-4 border-t">
                                <button type="submit"
                                    class="w-full bg-green-500 text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300">
                                    FINALIZAR PEDIDO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
  },

  // Template para modal de mesa (dine-in)
  getDineInTemplate() {
    return `
            <div class="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50">
                <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
                    <div class="p-6 h-full flex flex-col">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-2xl font-bold">Mesa</h2>
                            <button class="close-modal p-2 hover:bg-gray-100 rounded-full">
                                <i class="fas fa-times w-6 h-6"></i>
                            </button>
                        </div>
    
                        <form id="dineInForm" class="flex-1 overflow-y-auto">
                            <div class="space-y-4">
                                <!-- Nome -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                    <input type="text" name="name" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Mesa -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Número da Mesa</label>
                                    <input type="number" name="tableNumber" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Forma de Pagamento -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                                    <select name="paymentMethod" required
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                        <option value="">Selecione...</option>
                                        ${this.paymentMethods
                                          .map(
                                            (method) =>
                                              `<option value="${method.value}">${method.label}</option>`
                                          )
                                          .join("")}
                                    </select>
                                </div>

                                <!-- Troco -->
                                <div id="changeContainer" class="hidden">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Troco para</label>
                                    <input type="number" name="changeFor" step="0.01" min="0"
                                        placeholder="Digite o valor para troco"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                </div>

                                <!-- Observações -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                    <textarea name="observations" rows="3"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"></textarea>
                                </div>
                            </div>

                            <div class="sticky bottom-0 bg-white pt-4 mt-4 border-t">
                                <button type="submit"
                                    class="w-full bg-green-500 text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300">
                                    FINALIZAR PEDIDO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
  },
};

// Inicialização do módulo
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar o módulo
  DeliveryModals.init();

  // Configurar integração com o carrinho
  if (window.cartManager) {
    window.cartManager.handleCheckout = function () {
      if (state.cart.length === 0) {
        window.showAlert("Erro", "Seu carrinho está vazio!", "error");
        return;
      }

      if (!state.deliveryMethod) {
        window.showAlert(
          "Erro",
          "Selecione como deseja receber seu pedido",
          "error"
        );
        return;
      }

      this.closeCart();
      DeliveryModals.showModal(state.deliveryMethod);
    };
  }
});

// Exportar o módulo
window.DeliveryModals = DeliveryModals;
