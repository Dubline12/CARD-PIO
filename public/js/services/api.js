// public/js/services/api.js

// Classe de serviço para comunicação com a API
class ApiService {
  constructor() {
    this.baseUrl = "/api";
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos em milissegundos
  }

  // Método para realizar requisições à API
  async fetchAPI(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Erro na requisição: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na requisição para ${url}:`, error);
      throw error;
    }
  }

  // Método para buscar dados com cache
  async getCached(endpoint, forceRefresh = false) {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);

    if (
      !forceRefresh &&
      cached &&
      Date.now() - cached.timestamp < this.cacheDuration
    ) {
      console.log(`Usando cache para ${endpoint}`);
      return cached.data;
    }

    const data = await this.fetchAPI(endpoint);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
  }

  // Métodos para produtos
  async getProducts(category = null, forceRefresh = false) {
    const endpoint = category ? `/products?category=${category}` : "/products";
    return this.getCached(endpoint, forceRefresh);
  }

  async getProductById(id) {
    return this.fetchAPI(`/products/${id}`);
  }

  // Métodos para sabores
  async getFlavors(category = null, forceRefresh = false) {
    const endpoint = category ? `/flavors?category=${category}` : "/flavors";
    return this.getCached(endpoint, forceRefresh);
  }

  // Métodos para categorias
  async getCategories(forceRefresh = false) {
    return this.getCached("/categories", forceRefresh);
  }

  async getFlavorCategories(forceRefresh = false) {
    return this.getCached("/categories/flavors", forceRefresh);
  }

  // Métodos para bordas
  async getBorders(forceRefresh = false) {
    return this.getCached("/borders", forceRefresh);
  }

  // Método para criar pedido
  async createOrder(orderData) {
    return this.fetchAPI("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }
}

// Exporta uma instância singleton do serviço
window.apiService = new ApiService();
