// public/js/sabores.js

document.addEventListener("DOMContentLoaded", () => {
  // Cache de elementos DOM
  const elements = {
    flavorOptions: document.getElementById("flavor-options"),
    maxFlavors: document.getElementById("max-flavors"),
    title: document.querySelector("h1"),
    flavorText: document.querySelector(".flavor-selection-text"),
    confirmButton: document.getElementById("confirm-flavors-btn"),
  };

  // Estado da aplicação
  const state = {
    selectedFlavors: [],
    selectedBorder: null,
    pizzaInfo: {
      id: "",
      name: "",
      price: 0,
      maxFlavors: 1,
    },
    availableFlavors: [],
    loading: false,
  };

  // Funções utilitárias
  function formatPrice(price) {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-20 left-1/2 transform -translate-x-1/2 
                          px-4 py-2 rounded-lg shadow-lg text-white z-50
                          ${
                            type === "error"
                              ? "bg-red-500"
                              : type === "success"
                              ? "bg-green-500"
                              : type === "warning"
                              ? "bg-yellow-500"
                              : "bg-yellow-500"
                          }`;

    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, 20px)";

      requestAnimationFrame(() => {
        toast.style.transition = "all 0.3s ease-out";
        toast.style.opacity = "1";
        toast.style.transform = "translate(-50%, 0)";
      });
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, -20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Mostrar loader
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

  // Carregar informações da pizza e os sabores disponíveis
  async function loadData() {
    try {
      showLoader();

      const params = new URLSearchParams(window.location.search);

      state.pizzaInfo = {
        id: params.get("id") || "",
        name: params.get("name") || "Pizza",
        price: parseFloat(params.get("price")) || 0,
        maxFlavors: parseInt(params.get("maxFlavors")) || 1,
      };

      // Atualizar elementos da UI
      elements.maxFlavors.textContent = state.pizzaInfo.maxFlavors;
      elements.title.textContent = state.pizzaInfo.name;

      // Atualizar texto para singular quando for apenas 1 sabor
      if (elements.flavorText) {
        const textContent =
          state.pizzaInfo.maxFlavors === 1
            ? `Escolha até <span class="font-bold text-green-500">1</span> sabor`
            : `Escolha até <span class="font-bold text-green-500">${state.pizzaInfo.maxFlavors}</span> sabores`;
        elements.flavorText.innerHTML = textContent;
      }

      // Carregar sabores da API
      state.availableFlavors = await window.apiService.getFlavors();

      // Renderizar opções de sabores
      renderFlavorOptions();
      hideLoader();
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showToast("Erro ao carregar sabores. Tente novamente.", "error");
      hideLoader();
    }
  }

  // Renderizar opções de sabores de forma otimizada
  function renderFlavorOptions() {
    const container = elements.flavorOptions;
    if (!container) return;

    // Limpar container
    container.innerHTML = "";

    // Criar fragmento para melhor performance
    const fragment = document.createDocumentFragment();

    // Renderizar opções em batches
    const batchSize = 5;
    let currentBatch = 0;

    function renderBatch() {
      const start = currentBatch * batchSize;
      const end = Math.min(start + batchSize, state.availableFlavors.length);

      for (let i = start; i < end; i++) {
        const flavor = state.availableFlavors[i];
        const isSelected = state.selectedFlavors.includes(flavor.name);

        const div = document.createElement("div");
        div.className = `flavor-option p-4 rounded-lg border-2 cursor-pointer 
                              transition-all duration-200 transform hover:scale-[1.02] 
                              ${
                                isSelected
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200"
                              }`;

        div.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-gray-800">${
                                  flavor.name
                                }</h3>
                            </div>
                            <p class="text-sm text-gray-600">${
                              flavor.ingredients
                            }</p>
                            <span class="text-xs text-gray-500">${
                              flavor.category_name
                            }</span>
                        </div>
                        ${
                          isSelected
                            ? `
                            <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0 ml-4">
                                <i class="fas fa-check text-white text-sm"></i>
                            </div>
                        `
                            : ""
                        }
                    </div>
                `;

        div.addEventListener("click", () => handleFlavorSelect(flavor.name));
        fragment.appendChild(div);
      }

      if (currentBatch === 0) {
        container.appendChild(fragment);
      } else {
        container.appendChild(fragment.cloneNode(true));
      }

      currentBatch++;

      if (currentBatch * batchSize < state.availableFlavors.length) {
        requestAnimationFrame(renderBatch);
      }
    }

    renderBatch();
  }

  // Manipular seleção de sabores
  function handleFlavorSelect(flavorName) {
    if (state.selectedFlavors.includes(flavorName)) {
      state.selectedFlavors = state.selectedFlavors.filter(
        (f) => f !== flavorName
      );
    } else if (state.selectedFlavors.length < state.pizzaInfo.maxFlavors) {
      state.selectedFlavors.push(flavorName);
    } else {
      showToast(
        `Você só pode selecionar até ${state.pizzaInfo.maxFlavors} ${
          state.pizzaInfo.maxFlavors === 1 ? "sabor" : "sabores"
        }!`,
        "warning"
      );
      return;
    }

    // Atualizar UI
    renderFlavorOptions();
  }

  // Mostrar modal de borda
  async function showBorderModal() {
    try {
      // Carregar bordas da API se ainda não carregou
      if (!state.borders || state.borders.length === 0) {
        state.borders = await window.apiService.getBorders();
      }

      const modalOverlay = document.createElement("div");
      modalOverlay.className =
        "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center md:justify-center animate-fade-in";

      const modalContent = document.createElement("div");
      const isMobile = window.innerWidth < 768;
      modalContent.className = `bg-white w-full ${
        isMobile ? "mt-auto" : "max-w-md m-4"
      } rounded-xl p-6 transform translate-y-8 animate-slide-up`;

      modalContent.innerHTML = `
                <h2 class="text-2xl font-bold mb-6 text-center">Deseja Borda Recheada?</h2>
                <div class="space-y-4">
                    ${state.borders
                      .map(
                        (border) => `
                        <button class="w-full p-4 text-left border-2 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 border-option"
                                data-border-id="${border.id}">
                            <span class="font-bold text-gray-800">${
                              border.name
                            }</span>
                            <span class="block text-sm text-gray-600">+${formatPrice(
                              border.price
                            )}</span>
                        </button>
                    `
                      )
                      .join("")}
                    <button class="w-full p-4 text-center bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 border-option"
                            data-border-id="none">
                        Sem Borda
                    </button>
                </div>
            `;

      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);

      modalContent.querySelectorAll(".border-option").forEach((button) => {
        button.addEventListener("click", () => {
          const borderId = button.dataset.borderId;
          if (borderId === "none") {
            state.selectedBorder = null;
          } else {
            state.selectedBorder = borderId;
          }
          modalOverlay.remove();
          showDrinksModal();
        });
      });

      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.remove();
        }
      });
    } catch (error) {
      console.error("Erro ao carregar bordas:", error);
      showToast("Erro ao carregar opções de borda", "error");
    }
  }

  // Mostrar modal de bebidas
  function showDrinksModal() {
    const modalOverlay = document.createElement("div");
    modalOverlay.className =
      "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center md:justify-center animate-fade-in";

    const modalContent = document.createElement("div");
    const isMobile = window.innerWidth < 768;
    modalContent.className = `bg-white w-full ${
      isMobile ? "mt-auto" : "max-w-md m-4"
    } rounded-xl p-6 transform translate-y-8 animate-slide-up`;

    modalContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 text-center">Deseja Adicionar Bebidas?</h2>
            <div class="space-y-4">
                <button class="w-full p-4 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors duration-200" id="choose-drinks">
                    Escolher Bebidas
                </button>
                <button class="w-full p-4 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 transition-colors duration-200" id="finish-without-drinks">
                    Finalizar Sem Bebidas
                </button>
            </div>
        `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    modalContent
      .querySelector("#choose-drinks")
      .addEventListener("click", () => {
        finalizePizzaSelection(true);
        modalOverlay.remove();
      });

    modalContent
      .querySelector("#finish-without-drinks")
      .addEventListener("click", () => {
        finalizePizzaSelection(false);
        modalOverlay.remove();
      });

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });
  }

  // Finalizar seleção de pizza
  function finalizePizzaSelection(goToDrinks = false) {
    // Salvar sabores e borda selecionados
    const pizzaData = {
      id: state.pizzaInfo.id,
      name: state.pizzaInfo.name,
      price: state.pizzaInfo.price,
      flavors: state.selectedFlavors,
      border: state.selectedBorder,
    };

    localStorage.setItem("selectedFlavors", JSON.stringify(pizzaData));

    if (goToDrinks) {
      localStorage.setItem("activeTab", "drinks");
      window.location.href = "index.html";
    } else {
      window.location.href = "index.html";
    }
  }

  // Event Listeners
  if (elements.confirmButton) {
    elements.confirmButton.addEventListener("click", () => {
      if (state.selectedFlavors.length === 0) {
        showToast("Selecione pelo menos um sabor", "warning");
        return;
      }
      showBorderModal();
    });
  }

  // Inicialização
  loadData();
});
