// public/js/admin/app.js

// Classe principal da aplicação de administração
class AdminApp {
  constructor() {
    this.currentSection = "dashboard";
    this.sidebarItems = document.querySelectorAll(".sidebar-item");
    this.mobileMenuBtn = document.getElementById("mobile-menu-btn");
    this.mobileSidebar = document.getElementById("mobile-sidebar");
    this.closeMobileMenuBtn = document.getElementById("close-mobile-menu");

    this.sections = {
      dashboard: document.getElementById("dashboard-section"),
      products: document.getElementById("products-section"),
      flavors: document.getElementById("flavors-section"),
      orders: document.getElementById("orders-section"),
      settings: document.getElementById("settings-section"),
    };

    this.init();
  }

  // Inicializar aplicação
  init() {
    // Configurar navegação
    this.setupNavigation();

    // Configurar menu mobile
    this.setupMobileMenu();

    // Inicializar seção atual
    this.navigateTo(this.getSavedSection() || "dashboard");
  }

  // Configurar navegação entre seções
  setupNavigation() {
    this.sidebarItems.forEach((item) => {
      item.addEventListener("click", () => {
        const section = item.getAttribute("data-section");
        this.navigateTo(section);
      });
    });
  }

  // Configurar menu mobile
  setupMobileMenu() {
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener("click", () => {
        this.toggleMobileMenu(true);
      });
    }

    if (this.closeMobileMenuBtn) {
      this.closeMobileMenuBtn.addEventListener("click", () => {
        this.toggleMobileMenu(false);
      });
    }

    // Fechar menu ao clicar fora
    if (this.mobileSidebar) {
      this.mobileSidebar.addEventListener("click", (e) => {
        if (e.target === this.mobileSidebar) {
          this.toggleMobileMenu(false);
        }
      });
    }
  }

  // Alternar menu mobile
  toggleMobileMenu(show) {
    if (this.mobileSidebar) {
      if (show) {
        this.mobileSidebar.classList.remove("hidden");
        setTimeout(() => {
          const sidebarContent = this.mobileSidebar.querySelector(".bg-white");
          if (sidebarContent) {
            sidebarContent.style.transform = "translateX(0)";
          }
        }, 10);
      } else {
        const sidebarContent = this.mobileSidebar.querySelector(".bg-white");
        if (sidebarContent) {
          sidebarContent.style.transform = "translateX(-100%)";
          setTimeout(() => {
            this.mobileSidebar.classList.add("hidden");
          }, 300);
        }
      }
    }
  }

  // Navegar para uma seção
  navigateTo(section) {
    if (!this.sections[section]) return;

    // Ocultar todas as seções
    Object.values(this.sections).forEach((el) => {
      if (el) el.classList.add("hidden");
    });

    // Mostrar seção selecionada
    this.sections[section].classList.remove("hidden");

    // Atualizar itens de navegação
    this.updateNavigationItems(section);

    // Salvar seção atual
    this.currentSection = section;
    localStorage.setItem("adminSection", section);

    // Inicializar módulo correspondente
    this.initSectionModule(section);

    // Fechar menu mobile ao navegar
    this.toggleMobileMenu(false);
  }

  // Atualizar itens de navegação
  updateNavigationItems(section) {
    this.sidebarItems.forEach((item) => {
      const itemSection = item.getAttribute("data-section");

      // Remover classe ativa de todos os itens
      item.classList.remove("active");

      // Adicionar classe ativa ao item selecionado
      if (itemSection === section) {
        item.classList.add("active");
      }
    });
  }

  // Inicializar módulo específico da seção
  initSectionModule(section) {
    switch (section) {
      case "dashboard":
        if (window.DashboardModule) {
          window.DashboardModule.init();
        }
        break;
      case "products":
        if (window.ProductsModule) {
          window.ProductsModule.init();
        }
        break;
      case "flavors":
        if (window.FlavorsModule) {
          window.FlavorsModule.init();
        }
        break;
      case "orders":
        if (window.OrdersModule) {
          window.OrdersModule.init();
        }
        break;
      case "settings":
        if (window.SettingsModule) {
          window.SettingsModule.init();
        }
        break;
    }
  }

  // Obter seção salva
  getSavedSection() {
    return localStorage.getItem("adminSection");
  }

  // Mostrar uma notificação
  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-[1000] transform translate-y-10 opacity-0 transition-all duration-300 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
        ? "bg-red-500 text-white"
        : type === "warning"
        ? "bg-yellow-500 text-white"
        : "bg-blue-500 text-white"
    }`;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.style.transform = "translateY(0)";
      notification.style.opacity = "1";
    }, 10);

    // Animar saída e remover
    setTimeout(() => {
      notification.style.transform = "translateY(10px)";
      notification.style.opacity = "0";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }

  // Exibir modal de confirmação
  showConfirmModal(title, message, onConfirm, onCancel = null) {
    const modalOverlay = document.createElement("div");
    modalOverlay.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]";

    const modalContent = document.createElement("div");
    modalContent.className =
      "bg-white p-6 rounded-lg shadow-xl max-w-md w-full transform scale-95 opacity-0 transition-all duration-300";

    modalContent.innerHTML = `
        <h3 class="text-lg font-bold mb-2">${title}</h3>
        <p class="text-gray-600 mb-6">${message}</p>
        <div class="flex justify-end gap-3">
          <button id="modal-cancel" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">
            Cancelar
          </button>
          <button id="modal-confirm" class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">
            Confirmar
          </button>
        </div>
      `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Animar entrada
    setTimeout(() => {
      modalContent.style.transform = "scale(1)";
      modalContent.style.opacity = "1";
    }, 10);

    // Configurar botões
    const confirmBtn = modalContent.querySelector("#modal-confirm");
    const cancelBtn = modalContent.querySelector("#modal-cancel");

    // Função para fechar o modal
    const closeModal = () => {
      modalContent.style.transform = "scale(0.95)";
      modalContent.style.opacity = "0";
      setTimeout(() => {
        modalOverlay.remove();
      }, 300);
    };

    // Event listeners
    confirmBtn.addEventListener("click", () => {
      closeModal();
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    });

    cancelBtn.addEventListener("click", () => {
      closeModal();
      if (typeof onCancel === "function") {
        onCancel();
      }
    });

    // Fechar ao clicar fora
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        closeModal();
        if (typeof onCancel === "function") {
          onCancel();
        }
      }
    });
  }

  // Fazer requisição com autenticação
  async fetchWithAuth(url, options = {}) {
    const token = window.adminAuth ? window.adminAuth.getToken() : null;

    if (!token) {
      throw new Error("Usuário não autenticado");
    }

    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": options.headers?.["Content-Type"] || "application/json",
      },
    };

    try {
      const response = await fetch(url, authOptions);

      if (response.status === 401 || response.status === 403) {
        // Token inválido ou expirado
        if (window.adminAuth) {
          window.adminAuth.handleLogout();
        }
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro na requisição");
      }

      return data;
    } catch (error) {
      console.error("Erro na requisição:", error);
      throw error;
    }
  }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  window.adminApp = new AdminApp();
});
