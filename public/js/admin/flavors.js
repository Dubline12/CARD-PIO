// public/js/admin/flavors.js

// Módulo para gerenciamento de sabores no painel administrativo
const FlavorsModule = {
  // Estado local
  state: {
    flavors: [],
    categories: [],
    filteredFlavors: [],
    currentFilter: "all",
    isLoading: false,
    currentFlavor: null,
    isEditMode: false,
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
    const categoryTabs = document.querySelectorAll(
      ".nav-tab[data-flavor-category]"
    );
    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.filterFlavors(tab.dataset.flavorCategory);

        // Atualizar estado das abas
        categoryTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
      });
    });

    // Configurar botão de adicionar sabor
    const addButton = document.getElementById("add-flavor-btn");
    if (addButton) {
      addButton.addEventListener("click", () => {
        this.showFlavorForm();
      });
    }
  },

  // Carregar dados de sabores e categorias
  async loadData() {
    try {
      this.state.isLoading = true;
      this.updateLoadingState(true);

      // Carregar categorias de sabores
      await this.loadCategories();

      // Carregar sabores
      await this.loadFlavors();

      // Filtrar sabores
      this.filterFlavors(this.state.currentFilter);

      this.updateLoadingState(false);
      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      this.updateLoadingState(false);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao carregar sabores", "error");
    }
  },

  // Carregar categorias de sabores
  async loadCategories() {
    try {
      const categories = await window.adminApp.fetchWithAuth(
        "/api/categories/flavors"
      );
      this.state.categories = categories || [];
    } catch (error) {
      console.error("Erro ao carregar categorias de sabores:", error);
      this.state.categories = [];
      throw error;
    }
  },

  // Carregar sabores
  async loadFlavors() {
    try {
      const flavors = await window.adminApp.fetchWithAuth("/api/flavors");
      this.state.flavors = flavors || [];
      this.state.filteredFlavors = [...this.state.flavors];
    } catch (error) {
      console.error("Erro ao carregar sabores:", error);
      this.state.flavors = [];
      this.state.filteredFlavors = [];
      throw error;
    }
  },

  // Filtrar sabores por categoria
  filterFlavors(categorySlug) {
    this.state.currentFilter = categorySlug;

    if (categorySlug === "all") {
      this.state.filteredFlavors = [...this.state.flavors];
    } else {
      this.state.filteredFlavors = this.state.flavors.filter((flavor) => {
        const category = this.state.categories.find(
          (c) => c.id === flavor.category_id
        );
        return category && category.slug === categorySlug;
      });
    }

    this.renderFlavorsList();
  },

  // Renderizar lista de sabores
  renderFlavorsList() {
    const container = document.getElementById("flavors-list");
    if (!container) return;

    if (this.state.filteredFlavors.length === 0) {
      container.innerHTML = `
          <div class="text-center text-gray-500 py-10">
            Nenhum sabor encontrado nesta categoria
          </div>
        `;
      return;
    }

    const flavorItems = this.state.filteredFlavors
      .map((flavor) => {
        const category = this.state.categories.find(
          (c) => c.id === flavor.category_id
        );

        return `
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="p-4">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-bold text-gray-800">${flavor.name}</h3>
                  <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    ${category ? category.name : "Sem categoria"}
                  </span>
                </div>
                <span class="text-xs ${
                  flavor.is_available
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                } px-2 py-1 rounded-full">
                  ${flavor.is_available ? "Disponível" : "Indisponível"}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-3">${
                flavor.ingredients || ""
              }</p>
              <div class="flex justify-end space-x-2">
                <button class="edit-flavor-btn px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
                        data-id="${flavor.id}">
                  <i class="fas fa-edit mr-1"></i> Editar
                </button>
                <button class="toggle-flavor-btn px-3 py-1 
                               ${
                                 flavor.is_available
                                   ? "text-red-600 hover:bg-red-50"
                                   : "text-green-600 hover:bg-green-50"
                               } 
                               rounded-lg text-sm transition-colors"
                        data-id="${flavor.id}"
                        data-available="${flavor.is_available}">
                  <i class="fas ${
                    flavor.is_available ? "fa-times" : "fa-check"
                  } mr-1"></i> 
                  ${flavor.is_available ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    container.innerHTML = flavorItems;

    // Adicionar listeners de evento aos botões
    container.querySelectorAll(".edit-flavor-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const flavorId = btn.dataset.id;
        const flavor = this.state.flavors.find(
          (f) => f.id.toString() === flavorId
        );
        if (flavor) {
          this.showFlavorForm(flavor);
        }
      });
    });

    container.querySelectorAll(".toggle-flavor-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const flavorId = btn.dataset.id;
        const isAvailable = btn.dataset.available === "true";
        this.toggleFlavorAvailability(flavorId, !isAvailable);
      });
    });
  },

  // Mostrar formulário de sabor
  showFlavorForm(flavor = null) {
    this.state.currentFlavor = flavor;
    this.state.isEditMode = !!flavor;

    // Criar modal de formulário
    const modalOverlay = document.createElement("div");
    modalOverlay.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-white p-6 rounded-lg shadow-xl max-w-md w-full";

    modalContent.innerHTML = `
        <h3 class="text-xl font-bold mb-4">${
          flavor ? "Editar Sabor" : "Novo Sabor"
        }</h3>
        <form id="flavor-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" name="name" value="${
              flavor ? flavor.name : ""
            }" required
                   class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ingredientes</label>
            <textarea name="ingredients" rows="3" 
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">${
                        flavor ? flavor.ingredients : ""
                      }</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select name="category_id" required
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione uma categoria</option>
              ${this.state.categories
                .map(
                  (category) => `
                <option value="${category.id}" ${
                    flavor && flavor.category_id === category.id
                      ? "selected"
                      : ""
                  }>
                  ${category.name}
                </option>
              `
                )
                .join("")}
            </select>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="is_available" name="is_available" 
                   ${!flavor || flavor.is_available ? "checked" : ""}
                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <label for="is_available" class="ml-2 text-sm text-gray-700">
              Disponível
            </label>
          </div>
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" id="cancel-flavor-btn"
                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
              ${flavor ? "Atualizar" : "Adicionar"}
            </button>
          </div>
        </form>
      `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Configurar eventos do formulário
    const form = modalContent.querySelector("#flavor-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveFlavor(form, flavor ? flavor.id : null);
    });

    const cancelBtn = modalContent.querySelector("#cancel-flavor-btn");
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

  // Salvar sabor (adicionar ou atualizar)
  async saveFlavor(form, flavorId = null) {
    try {
      this.state.isLoading = true;

      // Obter dados do formulário
      const formData = new FormData(form);
      const flavorData = {
        name: formData.get("name"),
        ingredients: formData.get("ingredients"),
        category_id: formData.get("category_id"),
        is_available: formData.has("is_available"),
      };

      console.log(`${flavorId ? "Atualizando" : "Criando"} sabor:`, flavorData);

      // Aqui você implementaria a chamada à API para salvar o sabor
      /*
        let savedFlavor;
        if (flavorId) {
          savedFlavor = await window.adminApp.fetchWithAuth(`/api/flavors/${flavorId}`, {
            method: 'PUT',
            body: JSON.stringify(flavorData)
          });
        } else {
          savedFlavor = await window.adminApp.fetchWithAuth('/api/flavors', {
            method: 'POST',
            body: JSON.stringify(flavorData)
          });
        }
        */

      // Por enquanto, vamos apenas simular a atualização
      if (flavorId) {
        const flavorIndex = this.state.flavors.findIndex(
          (f) => f.id.toString() === flavorId.toString()
        );
        if (flavorIndex !== -1) {
          this.state.flavors[flavorIndex] = {
            ...this.state.flavors[flavorIndex],
            ...flavorData,
          };
        }
      } else {
        // Simular novo sabor
        const newFlavor = {
          id: Date.now(), // ID temporário
          ...flavorData,
          created_at: new Date().toISOString(),
        };

        this.state.flavors.push(newFlavor);
      }

      // Atualizar lista filtrada
      this.filterFlavors(this.state.currentFilter);

      // Fechar formulário
      const modalOverlay = document.querySelector(
        ".fixed.inset-0.bg-black.bg-opacity-50"
      );
      if (modalOverlay) {
        modalOverlay.remove();
      }

      window.adminApp.showNotification(
        `Sabor ${flavorId ? "atualizado" : "adicionado"} com sucesso`,
        "success"
      );

      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao salvar sabor:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao salvar sabor", "error");
    }
  },

  // Alternar disponibilidade do sabor
  async toggleFlavorAvailability(flavorId, makeAvailable) {
    try {
      this.state.isLoading = true;

      console.log(
        `${makeAvailable ? "Ativando" : "Desativando"} sabor ID ${flavorId}`
      );

      // Aqui você implementaria a chamada à API para atualizar o sabor
      /*
        const updatedFlavor = await window.adminApp.fetchWithAuth(`/api/flavors/${flavorId}/toggle`, {
          method: 'PATCH',
          body: JSON.stringify({ is_available: makeAvailable })
        });
        */

      // Por enquanto, vamos apenas simular a atualização
      const flavorIndex = this.state.flavors.findIndex(
        (f) => f.id.toString() === flavorId.toString()
      );
      if (flavorIndex !== -1) {
        this.state.flavors[flavorIndex].is_available = makeAvailable;

        // Atualizar sabores filtrados
        const filteredIndex = this.state.filteredFlavors.findIndex(
          (f) => f.id.toString() === flavorId.toString()
        );
        if (filteredIndex !== -1) {
          this.state.filteredFlavors[filteredIndex].is_available =
            makeAvailable;
        }

        this.renderFlavorsList();

        window.adminApp.showNotification(
          `Sabor ${makeAvailable ? "ativado" : "desativado"} com sucesso`,
          "success"
        );
      }

      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao alternar disponibilidade do sabor:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao atualizar sabor", "error");
    }
  },

  // Atualizar estado de carregamento
  updateLoadingState(isLoading) {
    const container = document.getElementById("flavors-section");
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
window.FlavorsModule = FlavorsModule;
