// public/js/admin/dashboard.js

// Módulo para o dashboard administrativo
const DashboardModule = {
  // Estado local
  state: {
    revenueData: [],
    topProducts: [],
    orderStats: {
      total: 0,
      pending: 0,
      completed: 0,
    },
    isLoading: false,
  },

  // Inicializar o módulo
  init() {
    // Se não estiver autenticado, não prosseguir
    if (!window.adminAuth || !window.adminAuth.isAuthenticated()) return;

    // Carregar dados
    this.loadDashboardData();

    // Configurar atualização periódica
    this.setupAutoRefresh();
  },

  // Carregar dados do dashboard
  async loadDashboardData() {
    try {
      this.state.isLoading = true;
      this.updateLoadingState(true);

      // Obter estatísticas de pedidos
      await this.fetchOrderStats();

      // Obter contagem de produtos
      await this.fetchProductCount();

      // Renderizar dados
      this.renderDashboardData();

      // Inicializar gráficos
      this.initCharts();

      this.updateLoadingState(false);
      this.state.isLoading = false;
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      this.updateLoadingState(false);
      this.state.isLoading = false;
      window.adminApp.showNotification(
        "Erro ao carregar dados do dashboard",
        "error"
      );
    }
  },

  // Buscar estatísticas de pedidos
  async fetchOrderStats() {
    try {
      // Obter estatísticas dos últimos 30 dias
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];

      const stats = await window.adminApp.fetchWithAuth(
        `/api/orders/stats?startDate=${startDate}&endDate=${endDate}`
      );

      // Atualizar estado
      if (stats && stats.summary) {
        this.state.orderStats = {
          total: stats.summary.order_count || 0,
          revenue: stats.summary.revenue || 0,
        };
      }

      // Dados para o gráfico
      if (stats && stats.dailySales) {
        this.state.revenueData = stats.dailySales;
      }

      // Produtos mais vendidos
      if (stats && stats.topProducts) {
        this.state.topProducts = stats.topProducts;
      }

      // Status dos pedidos
      if (stats && stats.orderStatus) {
        const pendingCount =
          stats.orderStatus.find((s) => s.status === "pending")?.count || 0;
        const preparingCount =
          stats.orderStatus.find((s) => s.status === "preparing")?.count || 0;
        const deliveringCount =
          stats.orderStatus.find((s) => s.status === "delivering")?.count || 0;

        this.state.orderStats.pending =
          parseInt(pendingCount) +
          parseInt(preparingCount) +
          parseInt(deliveringCount);
        this.state.orderStats.completed =
          stats.orderStatus.find((s) => s.status === "completed")?.count || 0;
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas de pedidos:", error);
      throw error;
    }
  },

  // Buscar contagem de produtos
  async fetchProductCount() {
    try {
      const products = await window.adminApp.fetchWithAuth("/api/products");

      if (products) {
        this.state.productCount = products.filter((p) => p.is_available).length;
      }
    } catch (error) {
      console.error("Erro ao buscar contagem de produtos:", error);
      throw error;
    }
  },

  // Renderizar dados do dashboard
  renderDashboardData() {
    // Atualizar cards
    this.updateStatCard(
      "total-revenue",
      this.formatCurrency(this.state.orderStats.revenue || 0)
    );
    this.updateStatCard("total-orders", this.state.orderStats.total || 0);
    this.updateStatCard("pending-orders", this.state.orderStats.pending || 0);
    this.updateStatCard("active-products", this.state.productCount || 0);

    // Renderizar produtos mais vendidos
    this.renderTopProducts();
  },

  // Atualizar um card de estatística
  updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
      if (typeof value === "number") {
        element.textContent = value.toLocaleString();
      } else {
        element.textContent = value;
      }
    }
  },

  // Renderizar lista de produtos mais vendidos
  renderTopProducts() {
    const container = document.getElementById("top-products");
    if (!container) return;

    if (!this.state.topProducts || this.state.topProducts.length === 0) {
      container.innerHTML = `
          <div class="text-center text-gray-500 py-10">
            Nenhum produto vendido no período selecionado
          </div>
        `;
      return;
    }

    const productList = this.state.topProducts
      .map(
        (product, index) => `
        <div class="flex items-center justify-between py-2 ${
          index < this.state.topProducts.length - 1 ? "border-b" : ""
        }">
          <div class="flex items-center">
            <span class="font-bold text-gray-700 w-6">${index + 1}.</span>
            <span class="text-gray-800">${product.name}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">${
              product.quantity_sold
            } vendidos</span>
            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              ${product.order_count} pedidos
            </span>
          </div>
        </div>
      `
      )
      .join("");

    container.innerHTML = productList;
  },

  // Inicializar gráficos
  initCharts() {
    this.renderSalesChart();
  },

  // Renderizar gráfico de vendas
  renderSalesChart() {
    const chartContainer = document.getElementById("sales-chart");
    if (!chartContainer) return;

    // Aqui você pode implementar o gráfico usando uma biblioteca como Chart.js
    // Por enquanto, vamos apenas mostrar uma mensagem informativa

    if (!this.state.revenueData || this.state.revenueData.length === 0) {
      chartContainer.innerHTML = `
          <div class="flex items-center justify-center h-full">
            <p class="text-gray-500">Sem dados de vendas para o período selecionado</p>
          </div>
        `;
      return;
    }

    // Placeholder para o gráfico
    chartContainer.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <p class="text-gray-500">Dados disponíveis para gráfico - implementação pendente</p>
        </div>
      `;
  },

  // Configurar atualização automática
  setupAutoRefresh() {
    // Atualizar a cada 5 minutos
    setInterval(() => {
      if (!this.state.isLoading) {
        this.loadDashboardData();
      }
    }, 5 * 60 * 1000);
  },

  // Atualizar estado de carregamento
  updateLoadingState(isLoading) {
    const container = document.getElementById("dashboard-section");
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
window.DashboardModule = DashboardModule;
