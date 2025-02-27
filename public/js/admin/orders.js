// public/js/admin/orders.js

// Módulo para gerenciamento de pedidos no painel administrativo
const OrdersModule = {
  // Estado local
  state: {
    orders: [],
    filteredOrders: [],
    filters: {
      status: "all",
      startDate: "",
      endDate: "",
    },
    isLoading: false,
    currentOrderId: null,
  },

  // Inicializar o módulo
  init() {
    // Se não estiver autenticado, não prosseguir
    if (!window.adminAuth || !window.adminAuth.isAuthenticated()) return;

    // Inicializar elementos da UI
    this.initUI();

    // Definir filtros iniciais de data (últimos 7 dias)
    this.initDateFilters();

    // Carregar dados
    this.loadOrders();
  },

  // Inicializar elementos da UI
  initUI() {
    // Filtro de status
    const statusFilter = document.getElementById("filter-status");
    if (statusFilter) {
      statusFilter.addEventListener("change", () => {
        this.state.filters.status = statusFilter.value;
        this.applyFilters();
      });
    }

    // Filtros de data
    const startDateFilter = document.getElementById("filter-start-date");
    const endDateFilter = document.getElementById("filter-end-date");

    if (startDateFilter) {
      startDateFilter.addEventListener("change", () => {
        this.state.filters.startDate = startDateFilter.value;
        this.applyFilters();
      });
    }

    if (endDateFilter) {
      endDateFilter.addEventListener("change", () => {
        this.state.filters.endDate = endDateFilter.value;
        this.applyFilters();
      });
    }

    // Botão de atualizar
    const refreshBtn = document.getElementById("refresh-orders");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.loadOrders();
      });
    }

    // Botão de exportar
    const exportBtn = document.getElementById("export-orders");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportOrders();
      });
    }
  },

  // Inicializar filtros de data
  initDateFilters() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Formatar datas para YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    this.state.filters.startDate = formatDate(sevenDaysAgo);
    this.state.filters.endDate = formatDate(today);

    // Atualizar inputs de data
    const startDateFilter = document.getElementById("filter-start-date");
    const endDateFilter = document.getElementById("filter-end-date");

    if (startDateFilter) {
      startDateFilter.value = this.state.filters.startDate;
    }

    if (endDateFilter) {
      endDateFilter.value = this.state.filters.endDate;
    }
  },

  // Carregar pedidos
  async loadOrders() {
    try {
      this.state.isLoading = true;
      this.updateLoadingState(true);

      // Construir URL com filtros
      let url = "/api/orders";
      const params = new URLSearchParams();

      if (this.state.filters.status && this.state.filters.status !== "all") {
        params.append("status", this.state.filters.status);
      }

      if (this.state.filters.startDate) {
        params.append("startDate", this.state.filters.startDate);
      }

      if (this.state.filters.endDate) {
        params.append("endDate", this.state.filters.endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Fazer requisição para API
      const orders = await window.adminApp.fetchWithAuth(url);

      this.state.orders = orders || [];
      this.applyFilters();

      this.updateLoadingState(false);
      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      this.updateLoadingState(false);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao carregar pedidos", "error");
    }
  },

  // Aplicar filtros aos pedidos
  applyFilters() {
    // Como já estamos filtrando na API, aqui precisamos apenas aplicar filtros adicionais se necessário
    this.state.filteredOrders = [...this.state.orders];
    this.renderOrdersList();
  },

  // Renderizar lista de pedidos
  renderOrdersList() {
    const container = document.getElementById("orders-list");
    if (!container) return;

    if (this.state.filteredOrders.length === 0) {
      container.innerHTML = `
          <div class="text-center text-gray-500 py-10">
            Nenhum pedido encontrado com os filtros selecionados
          </div>
        `;
      return;
    }

    const orderItems = this.state.filteredOrders
      .map((order) => {
        // Formatar data
        const date = new Date(order.created_at);
        const formattedDate = new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);

        // Status do pedido
        const statusLabels = {
          pending: "Pendente",
          preparing: "Preparando",
          delivering: "Em Entrega",
          completed: "Concluído",
          cancelled: "Cancelado",
        };

        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          preparing: "bg-blue-100 text-blue-800",
          delivering: "bg-purple-100 text-purple-800",
          completed: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };

        const statusLabel = statusLabels[order.status] || "Desconhecido";
        const statusColor =
          statusColors[order.status] || "bg-gray-100 text-gray-800";

        // Método de entrega
        const deliveryMethods = {
          delivery: "Entrega",
          pickup: "Retirada",
          dineIn: "Na Mesa",
        };

        const deliveryMethod =
          deliveryMethods[order.delivery_method] || order.delivery_method;

        return `
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="p-4">
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-gray-800">#${order.order_id}</h3>
                    <span class="text-xs ${statusColor} px-2 py-1 rounded-full">
                      ${statusLabel}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">${formattedDate}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-gray-800">${this.formatCurrency(
                    order.total_price
                  )}</p>
                  <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    ${deliveryMethod}
                  </span>
                </div>
              </div>
              
              <div class="mt-2">
                <p class="text-sm font-medium text-gray-700">
                  Cliente: <span class="text-gray-600">${
                    order.customer_name
                  }</span>
                </p>
                <p class="text-sm text-gray-600">
                  ${order.item_count} ${
          parseInt(order.item_count) === 1 ? "item" : "itens"
        }
                </p>
              </div>
              
              <div class="mt-4 flex justify-between items-center">
                <button class="view-order-btn px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
                        data-id="${order.id}">
                  <i class="fas fa-eye mr-1"></i> Ver Detalhes
                </button>
                
                ${
                  order.status !== "completed" && order.status !== "cancelled"
                    ? `
                  <div class="flex gap-1">
                    <button class="update-status-btn px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg text-sm transition-colors"
                            data-id="${order.id}"
                            data-status="${this.getNextStatus(order.status)}">
                      <i class="fas fa-arrow-right mr-1"></i> ${
                        statusLabels[this.getNextStatus(order.status)]
                      }
                    </button>
                    ${
                      order.status !== "cancelled"
                        ? `
                      <button class="cancel-order-btn px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                              data-id="${order.id}">
                        <i class="fas fa-times mr-1"></i> Cancelar
                      </button>
                    `
                        : ""
                    }
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    container.innerHTML = orderItems;

    // Adicionar event listeners aos botões
    container.querySelectorAll(".view-order-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const orderId = btn.dataset.id;
        this.viewOrderDetails(orderId);
      });
    });

    container.querySelectorAll(".update-status-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const orderId = btn.dataset.id;
        const nextStatus = btn.dataset.status;
        this.updateOrderStatus(orderId, nextStatus);
      });
    });

    container.querySelectorAll(".cancel-order-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const orderId = btn.dataset.id;
        this.confirmCancelOrder(orderId);
      });
    });
  },

  // Ver detalhes do pedido
  async viewOrderDetails(orderId) {
    try {
      this.state.isLoading = true;
      this.state.currentOrderId = orderId;

      // Obter detalhes do pedido
      const order = await window.adminApp.fetchWithAuth(
        `/api/orders/${orderId}`
      );

      // Criar modal de detalhes
      const modalOverlay = document.createElement("div");
      modalOverlay.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

      const modalContent = document.createElement("div");
      modalContent.className =
        "bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto";

      // Formatar data
      const date = new Date(order.created_at);
      const formattedDate = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);

      // Status do pedido
      const statusLabels = {
        pending: "Pendente",
        preparing: "Preparando",
        delivering: "Em Entrega",
        completed: "Concluído",
        cancelled: "Cancelado",
      };

      const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        preparing: "bg-blue-100 text-blue-800",
        delivering: "bg-purple-100 text-purple-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      };

      // Método de entrega
      const deliveryMethods = {
        delivery: "Entrega",
        pickup: "Retirada",
        dineIn: "Na Mesa",
      };

      // Método de pagamento
      const paymentMethods = {
        pix: "PIX",
        credit: "Cartão de Crédito",
        debit: "Cartão de Débito",
        cash: "Dinheiro",
      };

      modalContent.innerHTML = `
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-xl font-bold">Pedido #${order.order_id}</h3>
              <p class="text-sm text-gray-600">${formattedDate}</p>
            </div>
            <div>
              <span class="px-3 py-1 ${
                statusColors[order.status]
              } rounded-full text-sm">
                ${statusLabels[order.status]}
              </span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Informações do Cliente -->
            <div>
              <h4 class="font-bold text-gray-800 mb-2">Informações do Cliente</h4>
              <p><span class="font-medium">Nome:</span> ${
                order.customer_name
              }</p>
              <p><span class="font-medium">Telefone:</span> ${
                order.customer_phone || "-"
              }</p>
            </div>
            
            <!-- Informações de Entrega -->
            <div>
              <h4 class="font-bold text-gray-800 mb-2">Informações de ${
                deliveryMethods[order.delivery_method]
              }</h4>
              ${
                order.delivery_method === "delivery"
                  ? `
                <p><span class="font-medium">Endereço:</span> ${
                  order.address
                }, ${order.address_number}</p>
                <p><span class="font-medium">Bairro:</span> ${
                  order.neighborhood
                }</p>
                ${
                  order.complement
                    ? `<p><span class="font-medium">Complemento:</span> ${order.complement}</p>`
                    : ""
                }
                ${
                  order.reference
                    ? `<p><span class="font-medium">Referência:</span> ${order.reference}</p>`
                    : ""
                }
                <p><span class="font-medium">Taxa de Entrega:</span> ${this.formatCurrency(
                  order.delivery_fee || 0
                )}</p>
              `
                  : order.delivery_method === "dineIn"
                  ? `
                <p><span class="font-medium">Mesa:</span> ${order.table_number}</p>
              `
                  : `
                <p>Retirada no local</p>
              `
              }
            </div>
          </div>
          
          <!-- Itens do Pedido -->
          <div class="mb-6">
            <h4 class="font-bold text-gray-800 mb-2">Itens do Pedido</h4>
            <div class="space-y-3">
              ${order.items
                .map(
                  (item) => `
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-start mb-1">
                    <div>
                      <span class="font-medium">${item.quantity}x ${
                    item.product_name
                  }</span>
                      ${
                        item.flavors && item.flavors.length > 0
                          ? `
                        <p class="text-sm text-gray-600">
                          Sabores: ${item.flavors.map((f) => f.name).join(", ")}
                        </p>
                      `
                          : ""
                      }
                      ${
                        item.border_name
                          ? `
                        <p class="text-sm text-gray-600">
                          Borda: ${item.border_name}
                        </p>
                      `
                          : ""
                      }
                    </div>
                    <span class="font-medium">${this.formatCurrency(
                      item.total_price
                    )}</span>
                  </div>
                  ${
                    item.product_description
                      ? `
                    <p class="text-xs text-gray-500">${item.product_description}</p>
                  `
                      : ""
                  }
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          
          <!-- Pagamento -->
          <div class="mb-6">
            <h4 class="font-bold text-gray-800 mb-2">Pagamento</h4>
            <p><span class="font-medium">Método:</span> ${
              paymentMethods[order.payment_method] || order.payment_method
            }</p>
            ${
              order.payment_method === "cash" && order.change_for
                ? `
              <p><span class="font-medium">Troco para:</span> ${this.formatCurrency(
                order.change_for
              )}</p>
            `
                : ""
            }
            <p class="mt-2 text-xl font-bold">Total: ${this.formatCurrency(
              order.total_price
            )}</p>
          </div>
          
          ${
            order.observations
              ? `
            <!-- Observações -->
            <div class="mb-6">
              <h4 class="font-bold text-gray-800 mb-2">Observações</h4>
              <p class="text-gray-700">${order.observations}</p>
            </div>
          `
              : ""
          }
          
          <!-- Ações -->
          <div class="flex justify-end border-t pt-4">
            ${
              order.status !== "completed" && order.status !== "cancelled"
                ? `
              <div class="flex space-x-2">
                <button id="update-status-modal-btn" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Atualizar Status
                </button>
                ${
                  order.status !== "cancelled"
                    ? `
                  <button id="cancel-order-modal-btn" 
                          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Cancelar Pedido
                  </button>
                `
                    : ""
                }
              </div>
            `
                : ""
            }
            <button id="close-modal-btn" 
                    class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors ml-2">
              Fechar
            </button>
          </div>
        `;

      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);

      // Configurar event listeners
      const closeModalBtn = modalContent.querySelector("#close-modal-btn");
      closeModalBtn.addEventListener("click", () => {
        modalOverlay.remove();
      });

      // Event listener para atualizar status
      const updateStatusBtn = modalContent.querySelector(
        "#update-status-modal-btn"
      );
      if (updateStatusBtn) {
        updateStatusBtn.addEventListener("click", () => {
          modalOverlay.remove();
          this.showStatusUpdateForm(orderId, order.status);
        });
      }

      // Event listener para cancelar pedido
      const cancelOrderBtn = modalContent.querySelector(
        "#cancel-order-modal-btn"
      );
      if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener("click", () => {
          modalOverlay.remove();
          this.confirmCancelOrder(orderId);
        });
      }

      // Fechar ao clicar fora
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.remove();
        }
      });

      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao obter detalhes do pedido:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification(
        "Erro ao carregar detalhes do pedido",
        "error"
      );
    }
  },

  // Mostrar formulário de atualização de status
  showStatusUpdateForm(orderId, currentStatus) {
    // Definir próximos status possíveis
    const statusOptions = {
      pending: ["preparing", "delivering", "completed", "cancelled"],
      preparing: ["delivering", "completed", "cancelled"],
      delivering: ["completed", "cancelled"],
    };

    const options = statusOptions[currentStatus] || [];

    // Status labels
    const statusLabels = {
      preparing: "Preparando",
      delivering: "Em Entrega",
      completed: "Concluído",
      cancelled: "Cancelado",
    };

    // Criar modal
    const modalOverlay = document.createElement("div");
    modalOverlay.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-white p-6 rounded-lg shadow-xl max-w-md w-full";

    modalContent.innerHTML = `
        <h3 class="text-xl font-bold mb-4">Atualizar Status do Pedido</h3>
        <form id="update-status-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Novo Status</label>
            <select name="status" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              ${options
                .map(
                  (status) => `
                <option value="${status}">${statusLabels[status]}</option>
              `
                )
                .join("")}
            </select>
          </div>
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" id="cancel-update-btn"
                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
              Atualizar
            </button>
          </div>
        </form>
      `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Configurar eventos do formulário
    const form = modalContent.querySelector("#update-status-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const newStatus = formData.get("status");
      this.updateOrderStatus(orderId, newStatus);
      modalOverlay.remove();
    });

    const cancelBtn = modalContent.querySelector("#cancel-update-btn");
    cancelBtn.addEventListener("click", () => {
      modalOverlay.remove();
    });

    // Fechar ao clicar fora
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });
  },

  // Confirmar cancelamento de pedido
  confirmCancelOrder(orderId) {
    window.adminApp.showConfirmModal(
      "Cancelar Pedido",
      "Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.",
      () => {
        this.updateOrderStatus(orderId, "cancelled");
      }
    );
  },

  // Atualizar status do pedido
  async updateOrderStatus(orderId, newStatus) {
    try {
      this.state.isLoading = true;

      console.log(`Atualizando pedido ${orderId} para status: ${newStatus}`);

      // Aqui você implementaria a chamada à API para atualizar o status
      /*
        const updatedOrder = await window.adminApp.fetchWithAuth(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
        */

      // Por enquanto, vamos apenas simular a atualização
      const orderIndex = this.state.orders.findIndex(
        (o) => o.id.toString() === orderId.toString()
      );
      if (orderIndex !== -1) {
        this.state.orders[orderIndex].status = newStatus;

        // Atualizar ordens filtradas
        const filteredIndex = this.state.filteredOrders.findIndex(
          (o) => o.id.toString() === orderId.toString()
        );
        if (filteredIndex !== -1) {
          this.state.filteredOrders[filteredIndex].status = newStatus;
        }

        this.renderOrdersList();

        const statusLabels = {
          pending: "Pendente",
          preparing: "Preparando",
          delivering: "Em Entrega",
          completed: "Concluído",
          cancelled: "Cancelado",
        };

        window.adminApp.showNotification(
          `Pedido atualizado para ${statusLabels[newStatus]}`,
          "success"
        );
      }

      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification(
        "Erro ao atualizar status do pedido",
        "error"
      );
    }
  },

  // Exportar pedidos
  exportOrders() {
    try {
      // Por enquanto, vamos apenas mostrar uma mensagem
      window.adminApp.showNotification(
        "Exportação de pedidos será implementada em breve",
        "info"
      );

      // Aqui você implementaria a lógica de exportação,
      // gerando um arquivo CSV ou Excel com os dados dos pedidos filtrados
    } catch (error) {
      console.error("Erro ao exportar pedidos:", error);
      window.adminApp.showNotification("Erro ao exportar pedidos", "error");
    }
  },

  // Obter próximo status baseado no status atual
  getNextStatus(currentStatus) {
    const statusFlow = {
      pending: "preparing",
      preparing: "delivering",
      delivering: "completed",
    };

    return statusFlow[currentStatus] || "completed";
  },

  // Atualizar estado de carregamento
  updateLoadingState(isLoading) {
    const container = document.getElementById("orders-section");
    if (container) {
      if (isLoading) {
        container.classList.add("opacity-50");
        container.style.pointerEvents = "none";
      } else {
        container.classList.remove("opacity-50");
        container.style.pointerEvents = "auto";
      }
    }
  },

  // Formatar valor como moeda
  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  },
};

// Exportar o módulo para o escopo global
window.OrdersModule = OrdersModule;
