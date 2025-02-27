// public/js/admin/auth.js

// Classe de autenticação para o painel administrativo
class AdminAuth {
  constructor() {
    this.token = localStorage.getItem("adminToken");
    this.user = JSON.parse(localStorage.getItem("adminUser") || "null");
    this.authModal = document.getElementById("auth-modal");
    this.appContainer = document.getElementById("app-container");
    this.loginForm = document.getElementById("login-form");
    this.authError = document.getElementById("auth-error");
    this.logoutBtn = document.getElementById("logout-btn");
    this.mobileLogoutBtn = document.getElementById("mobile-logout-btn");

    this.init();
  }

  // Inicializar autenticação
  init() {
    // Verificar se o usuário está autenticado
    this.checkAuth();

    // Configurar listeners de formulário
    if (this.loginForm) {
      this.loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }

    // Configurar botões de logout
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", this.handleLogout.bind(this));
    }

    if (this.mobileLogoutBtn) {
      this.mobileLogoutBtn.addEventListener(
        "click",
        this.handleLogout.bind(this)
      );
    }
  }

  // Verificar se o usuário está autenticado
  checkAuth() {
    if (this.token && this.user) {
      // Verificar validade do token
      this.validateToken()
        .then((isValid) => {
          if (isValid) {
            this.showApp();
          } else {
            this.showAuthModal();
          }
        })
        .catch(() => {
          this.showAuthModal();
        });
    } else {
      this.showAuthModal();
    }
  }

  // Validar token
  async validateToken() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Erro ao validar token:", error);
      return false;
    }
  }

  // Mostrar modal de autenticação
  showAuthModal() {
    if (this.authModal) {
      this.authModal.classList.remove("hidden");
    }

    if (this.appContainer) {
      this.appContainer.classList.add("hidden");
    }
  }

  // Mostrar aplicação
  showApp() {
    if (this.authModal) {
      this.authModal.classList.add("hidden");
    }

    if (this.appContainer) {
      this.appContainer.classList.remove("hidden");
    }
  }

  // Handler para o formulário de login
  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao fazer login");
      }

      // Salvar token e dados do usuário
      this.token = data.token;
      this.user = data.user;

      localStorage.setItem("adminToken", this.token);
      localStorage.setItem("adminUser", JSON.stringify(this.user));

      // Verificar se o usuário é admin
      if (this.user.role !== "admin") {
        this.showError(
          "Você não tem permissão para acessar o painel administrativo"
        );
        this.handleLogout();
        return;
      }

      // Mostrar aplicação
      this.showApp();
    } catch (error) {
      console.error("Erro no login:", error);
      this.showError(error.message || "Falha na autenticação");
    }
  }

  // Mostrar erro de autenticação
  showError(message) {
    if (this.authError) {
      this.authError.textContent = message;
      this.authError.classList.remove("hidden");

      // Ocultar mensagem após alguns segundos
      setTimeout(() => {
        this.authError.classList.add("hidden");
      }, 5000);
    }
  }

  // Handler para logout
  handleLogout() {
    // Limpar dados de autenticação
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    this.token = null;
    this.user = null;

    // Redirecionar para tela de login
    this.showAuthModal();
  }

  // Obter token para uso em outras requisições
  getToken() {
    return this.token;
  }

  // Obter usuário atual
  getUser() {
    return this.user;
  }

  // Verificar se o usuário está autenticado
  isAuthenticated() {
    return !!this.token && !!this.user;
  }
}

// Inicializar autenticação quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  window.adminAuth = new AdminAuth();
});
