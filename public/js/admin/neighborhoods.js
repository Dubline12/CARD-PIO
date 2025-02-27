// public/js/admin/neighborhoods.js

// Módulo para gerenciamento de bairros no painel administrativo
const NeighborhoodsModule = {
  // Estado local
  state: {
    neighborhoods: [],
    isLoading: false,
    deliveryFee: 5.0,
  },

  // Inicializar o módulo
  init() {
    // Se não estiver autenticado, não prosseguir
    if (!window.adminAuth || !window.adminAuth.isAuthenticated()) return;

    // Carregar dados de bairros
    this.loadNeighborhoods();

    // Inicializar eventos
    this.setupEventListeners();
  },

  // Configurar listeners de eventos
  setupEventListeners() {
    // Botão de adicionar bairro
    const addButton = document.getElementById("add-neighborhood-btn");
    if (addButton) {
      addButton.addEventListener("click", () => this.showNeighborhoodForm());
    }

    // Botão de atualizar taxa de entrega
    const updateFeeButton = document.getElementById("update-delivery-fee-btn");
    if (updateFeeButton) {
      updateFeeButton.addEventListener("click", () => this.updateDeliveryFee());
    }
  },

  // Carregar lista de bairros
  async loadNeighborhoods() {
    try {
      this.state.isLoading = true;
      this.updateLoadingState(true);

      // Carregar bairros da API
      const neighborhoods = await window.adminApp.fetchWithAuth(
        "/api/settings/neighborhoods"
      );
      this.state.neighborhoods = neighborhoods || [];

      // Carregar configurações para obter taxa de entrega
      const settings = await window.adminApp.fetchWithAuth("/api/settings");
      if (settings && settings.delivery_fee) {
        this.state.deliveryFee = parseFloat(settings.delivery_fee);
      }

      // Renderizar lista de bairros
      this.renderNeighborhoodsList();

      // Atualizar input de taxa de entrega
      const feeInput = document.getElementById("delivery-fee-input");
      if (feeInput) {
        feeInput.value = this.state.deliveryFee.toFixed(2);
      }

      this.updateLoadingState(false);
      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao carregar bairros:", error);
      this.updateLoadingState(false);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao carregar bairros", "error");
    }
  },

  // Renderizar lista de bairros
  renderNeighborhoodsList() {
    const container = document.getElementById("neighborhoods-list");
    if (!container) return;

    if (this.state.neighborhoods.length === 0) {
      container.innerHTML = `
          <div class="text-center text-gray-500 py-4">
            Nenhum bairro cadastrado
          </div>
        `;
      return;
    }

    // Ordenar bairros alfabeticamente
    const sortedNeighborhoods = [...this.state.neighborhoods].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Criar grid de bairros
    const neighborhoodItems = `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          ${sortedNeighborhoods
            .map(
              (neighborhood) => `
            <div class="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
              <span class="text-gray-800">${neighborhood.name}</span>
              <button class="delete-neighborhood-btn text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                      data-id="${neighborhood.id || ""}">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      `;

    container.innerHTML = neighborhoodItems;

    // Adicionar listeners aos botões de exclusão
    container.querySelectorAll(".delete-neighborhood-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const neighborhoodId = btn.dataset.id;
        const neighborhood = this.state.neighborhoods.find(
          (n) => n.id === neighborhoodId
        );

        if (neighborhood) {
          this.confirmDeleteNeighborhood(neighborhood);
        }
      });
    });
  },

  // Mostrar formulário para adicionar bairro
  showNeighborhoodForm() {
    // Criar modal de formulário
    const modalOverlay = document.createElement("div");
    modalOverlay.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-white p-6 rounded-lg shadow-xl max-w-md w-full";

    modalContent.innerHTML = `
        <h3 class="text-xl font-bold mb-4">Adicionar Bairro</h3>
        <form id="neighborhood-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Bairro</label>
            <input type="text" name="name" required
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" id="cancel-neighborhood-btn"
                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
              Adicionar
            </button>
          </div>
        </form>
      `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Configurar eventos do formulário
    const form = modalContent.querySelector("#neighborhood-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.addNeighborhood(form);
    });

    const cancelBtn = modalContent.querySelector("#cancel-neighborhood-btn");
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

  // Adicionar novo bairro
  async addNeighborhood(form) {
    try {
      const formData = new FormData(form);
      const name = formData.get("name");

      if (!name) {
        window.adminApp.showNotification(
          "Nome do bairro é obrigatório",
          "error"
        );
        return;
      }

      this.state.isLoading = true;

      // Verificar se o bairro já existe
      if (
        this.state.neighborhoods.some(
          (n) => n.name.toLowerCase() === name.toLowerCase()
        )
      ) {
        window.adminApp.showNotification(
          "Este bairro já está cadastrado",
          "error"
        );
        this.state.isLoading = false;
        return;
      }

      // Aqui você implementaria a chamada à API para adicionar o bairro
      /*
        const newNeighborhood = await window.adminApp.fetchWithAuth('/api/settings/neighborhoods', {
          method: 'POST',
          body: JSON.stringify({ name })
        });
        */

      // Simular adição do bairro
      const newNeighborhood = {
        id: Date.now().toString(), // ID temporário
        name: name,
      };

      this.state.neighborhoods.push(newNeighborhood);

      // Atualizar UI
      this.renderNeighborhoodsList();

      // Fechar modal
      const modalOverlay = document.querySelector(
        ".fixed.inset-0.bg-black.bg-opacity-50"
      );
      if (modalOverlay) {
        modalOverlay.remove();
      }

      window.adminApp.showNotification(
        "Bairro adicionado com sucesso",
        "success"
      );
      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao adicionar bairro:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao adicionar bairro", "error");
    }
  },

  // Confirmar exclusão de bairro
  confirmDeleteNeighborhood(neighborhood) {
    window.adminApp.showConfirmModal(
      "Excluir Bairro",
      `Tem certeza que deseja excluir o bairro "${neighborhood.name}"?`,
      () => this.deleteNeighborhood(neighborhood)
    );
  },

  // Excluir bairro
  async deleteNeighborhood(neighborhood) {
    try {
      this.state.isLoading = true;

      // Aqui você implementaria a chamada à API para excluir o bairro
      /*
        await window.adminApp.fetchWithAuth(`/api/settings/neighborhoods/${neighborhood.id}`, {
          method: 'DELETE'
        });
        */

      // Simular exclusão
      this.state.neighborhoods = this.state.neighborhoods.filter(
        (n) => n.id !== neighborhood.id
      );

      // Atualizar UI
      this.renderNeighborhoodsList();

      window.adminApp.showNotification(
        "Bairro excluído com sucesso",
        "success"
      );
      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao excluir bairro:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao excluir bairro", "error");
    }
  },

  // Atualizar taxa de entrega
  async updateDeliveryFee() {
    try {
      const feeInput = document.getElementById("delivery-fee-input");
      if (!feeInput) return;

      const fee = parseFloat(feeInput.value);
      if (isNaN(fee) || fee < 0) {
        window.adminApp.showNotification("Valor de taxa inválido", "error");
        return;
      }

      this.state.isLoading = true;

      // Aqui você implementaria a chamada à API para atualizar a taxa
      /*
        const settings = await window.adminApp.fetchWithAuth('/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ delivery_fee: fee })
        });
        */

      // Simular atualização
      this.state.deliveryFee = fee;

      window.adminApp.showNotification(
        "Taxa de entrega atualizada com sucesso",
        "success"
      );
      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao atualizar taxa de entrega:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification(
        "Erro ao atualizar taxa de entrega",
        "error"
      );
    }
  },

  // Atualizar estado de carregamento
  updateLoadingState(isLoading) {
    const container = document.getElementById("neighborhoods-container");
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
};

// Exportar o módulo para o escopo global
window.NeighborhoodsModule = NeighborhoodsModule;
