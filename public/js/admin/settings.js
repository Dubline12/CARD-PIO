// public/js/admin/settings.js

// Módulo para gerenciamento de configurações no painel administrativo
const SettingsModule = {
  // Estado local
  state: {
    settings: {
      business_name: "",
      business_phone: "",
      delivery_fee: 0,
      pix_key: "",
      pix_owner: "",
      payment_methods: [],
    },
    users: [],
    neighborhoods: [],
    isLoading: false,
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
    // Configurar formulário de configurações gerais
    const generalSettingsForm = document.getElementById(
      "general-settings-form"
    );
    if (generalSettingsForm) {
      generalSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveGeneralSettings(e.target);
      });
    }

    // Configurar botão de adicionar usuário
    const addUserBtn = document.getElementById("add-user-btn");
    if (addUserBtn) {
      addUserBtn.addEventListener("click", () => {
        this.showUserForm();
      });
    }
  },

  // Carregar todos os dados
  async loadData() {
    try {
      this.state.isLoading = true;
      this.updateLoadingState(true);

      // Carregar configurações
      await this.loadSettings();

      // Carregar usuários
      await this.loadUsers();

      // Carregar bairros
      await this.loadNeighborhoods();

      this.updateLoadingState(false);
      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao carregar dados de configurações:", error);
      this.updateLoadingState(false);
      this.state.isLoading = false;
      window.adminApp.showNotification(
        "Erro ao carregar configurações",
        "error"
      );
    }
  },

  // Carregar configurações gerais
  async loadSettings() {
    try {
      const settings = await window.adminApp.fetchWithAuth("/api/settings");
      this.state.settings = settings || this.state.settings;

      // Preencher formulário
      this.populateSettingsForm();
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      throw error;
    }
  },

  // Preencher formulário de configurações
  populateSettingsForm() {
    const form = document.getElementById("general-settings-form");
    if (!form) return;

    const { settings } = this.state;

    // Preencher campos
    for (const key in settings) {
      const input = form.elements[key];
      if (input && key !== "payment_methods") {
        if (typeof settings[key] === "number") {
          input.value = settings[key].toFixed(2);
        } else {
          input.value = settings[key] || "";
        }
      }
    }
  },

  // Salvar configurações gerais
  async saveGeneralSettings(form) {
    try {
      this.state.isLoading = true;

      // Obter dados do formulário
      const formData = new FormData(form);
      const settingsData = {
        business_name: formData.get("business_name"),
        business_phone: formData.get("business_phone"),
        delivery_fee: parseFloat(formData.get("delivery_fee")),
        pix_key: formData.get("pix_key"),
        pix_owner: formData.get("pix_owner"),
      };

      console.log("Salvando configurações:", settingsData);

      // Aqui você implementaria a chamada à API para salvar as configurações
      /*
          const updatedSettings = await window.adminApp.fetchWithAuth('/api/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsData)
          });
          
          this.state.settings = updatedSettings;
          */

      // Por enquanto, vamos apenas simular a atualização
      this.state.settings = {
        ...this.state.settings,
        ...settingsData,
      };

      window.adminApp.showNotification(
        "Configurações salvas com sucesso",
        "success"
      );

      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao salvar configurações", "error");
    }
  },

  // Carregar usuários
  async loadUsers() {
    try {
      const users = await window.adminApp.fetchWithAuth("/api/auth/users");
      this.state.users = users || [];

      // Renderizar lista de usuários
      this.renderUsersList();
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      this.state.users = [];
      throw error;
    }
  },

  // Renderizar lista de usuários
  renderUsersList() {
    const container = document.getElementById("users-list");
    if (!container) return;

    if (this.state.users.length === 0) {
      container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
              Nenhum usuário encontrado
            </div>
          `;
      return;
    }

    const userItems = this.state.users
      .map(
        (user) => `
          <div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
            <div>
              <p class="font-medium">${user.name}</p>
              <p class="text-sm text-gray-600">${user.email}</p>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                ${user.role === "admin" ? "Administrador" : "Usuário"}
              </span>
            </div>
            <div class="flex space-x-2">
              <button class="edit-user-btn px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors"
                      data-id="${user.id}">
                <i class="fas fa-edit"></i>
              </button>
              ${
                user.id !== window.adminAuth.getUser().id
                  ? `
                <button class="delete-user-btn px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                        data-id="${user.id}" data-name="${user.name}">
                  <i class="fas fa-trash-alt"></i>
                </button>
              `
                  : ""
              }
            </div>
          </div>
        `
      )
      .join("");

    container.innerHTML = userItems;

    // Adicionar listeners de evento aos botões
    container.querySelectorAll(".edit-user-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const userId = btn.dataset.id;
        const user = this.state.users.find((u) => u.id.toString() === userId);
        if (user) {
          this.showUserForm(user);
        }
      });
    });

    container.querySelectorAll(".delete-user-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const userId = btn.dataset.id;
        const userName = btn.dataset.name;

        window.adminApp.showConfirmModal(
          "Excluir Usuário",
          `Tem certeza que deseja excluir o usuário "${userName}"?`,
          () => this.deleteUser(userId)
        );
      });
    });
  },

  // Mostrar formulário de usuário
  showUserForm(user = null) {
    // Criar modal de formulário
    const modalOverlay = document.createElement("div");
    modalOverlay.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-white p-6 rounded-lg shadow-xl max-w-md w-full";

    modalContent.innerHTML = `
          <h3 class="text-xl font-bold mb-4">${
            user ? "Editar Usuário" : "Novo Usuário"
          }</h3>
          <form id="user-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input type="text" name="name" value="${
                user ? user.name : ""
              }" required
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value="${
                user ? user.email : ""
              }" required
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Senha ${
                user ? "(deixe em branco para manter a atual)" : ""
              }</label>
              <input type="password" name="password" ${!user ? "required" : ""}
                     class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Função</label>
              <select name="role" required
                      class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="user" ${
                  user && user.role === "user" ? "selected" : ""
                }>Usuário</option>
                <option value="admin" ${
                  user && user.role === "admin" ? "selected" : ""
                }>Administrador</option>
              </select>
            </div>
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" id="cancel-user-btn"
                      class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-colors">
                Cancelar
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                ${user ? "Atualizar" : "Adicionar"}
              </button>
            </div>
          </form>
        `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Configurar eventos do formulário
    const form = modalContent.querySelector("#user-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveUser(form, user ? user.id : null);
    });

    const cancelBtn = modalContent.querySelector("#cancel-user-btn");
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

  // Salvar usuário (adicionar ou atualizar)
  async saveUser(form, userId = null) {
    try {
      this.state.isLoading = true;

      // Obter dados do formulário
      const formData = new FormData(form);
      const userData = {
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
      };

      // Adicionar senha apenas se preenchida ou for novo usuário
      const password = formData.get("password");
      if (password) {
        userData.password = password;
      }

      console.log(`${userId ? "Atualizando" : "Criando"} usuário:`, userData);

      // Aqui você implementaria a chamada à API para salvar o usuário
      /*
          let savedUser;
          if (userId) {
            savedUser = await window.adminApp.fetchWithAuth(`/api/auth/users/${userId}`, {
              method: 'PUT',
              body: JSON.stringify(userData)
            });
          } else {
            savedUser = await window.adminApp.fetchWithAuth('/api/auth/users', {
              method: 'POST',
              body: JSON.stringify(userData)
            });
          }
          
          // Recarregar lista de usuários
          await this.loadUsers();
          */

      // Por enquanto, vamos apenas simular a atualização
      if (userId) {
        const userIndex = this.state.users.findIndex(
          (u) => u.id.toString() === userId.toString()
        );
        if (userIndex !== -1) {
          this.state.users[userIndex] = {
            ...this.state.users[userIndex],
            ...userData,
          };
        }
      } else {
        // Simular novo usuário
        const newUser = {
          id: Date.now(), // ID temporário
          ...userData,
          created_at: new Date().toISOString(),
        };

        this.state.users.push(newUser);
      }

      // Atualizar lista de usuários
      this.renderUsersList();

      // Fechar formulário
      const modalOverlay = document.querySelector(
        ".fixed.inset-0.bg-black.bg-opacity-50"
      );
      if (modalOverlay) {
        modalOverlay.remove();
      }

      window.adminApp.showNotification(
        `Usuário ${userId ? "atualizado" : "adicionado"} com sucesso`,
        "success"
      );

      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao salvar usuário", "error");
    }
  },

  // Excluir usuário
  async deleteUser(userId) {
    try {
      this.state.isLoading = true;

      console.log(`Excluindo usuário ID ${userId}`);

      // Aqui você implementaria a chamada à API para excluir o usuário
      /*
          await window.adminApp.fetchWithAuth(`/api/auth/users/${userId}`, {
            method: 'DELETE'
          });
          
          // Recarregar lista de usuários
          await this.loadUsers();
          */

      // Por enquanto, vamos apenas simular a exclusão
      this.state.users = this.state.users.filter(
        (u) => u.id.toString() !== userId.toString()
      );

      // Atualizar lista de usuários
      this.renderUsersList();

      window.adminApp.showNotification(
        "Usuário excluído com sucesso",
        "success"
      );

      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      this.state.isLoading = false;
      window.adminApp.showNotification("Erro ao excluir usuário", "error");
    }
  },

  // Carregar bairros
  async loadNeighborhoods() {
    try {
      const neighborhoods = await window.adminApp.fetchWithAuth(
        "/api/settings/neighborhoods"
      );
      this.state.neighborhoods = neighborhoods || [];
    } catch (error) {
      console.error("Erro ao carregar bairros:", error);
      this.state.neighborhoods = [];
      throw error;
    }
  },

  // Atualizar estado de carregamento
  updateLoadingState(isLoading) {
    const container = document.getElementById("settings-section");
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
window.SettingsModule = SettingsModule;
