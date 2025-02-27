// server/routes/settings.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateJWT, isAdmin } = require("../middleware/auth");

// Constantes de configuração padrão
const DEFAULT_SETTINGS = {
  delivery_fee: 5.0,
  business_name: "Pizzaria Oliveira",
  business_phone: "5599984573587",
  pix_key: "62463717360",
  pix_owner: "Anderson Felipe",
  payment_methods: [
    { value: "pix", label: "PIX" },
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "cash", label: "Dinheiro" },
  ],
};

// Lista de bairros disponíveis para entrega
const AVAILABLE_NEIGHBORHOODS = [
  "Aeroporto",
  "Alto São José",
  "Baixada",
  "Boiada",
  "Conjunto Primavera",
  "Diogo",
  "Engenho",
  "Goiabal",
  "Jardim das Oliveiras",
  "Jerusalém",
  "Loteamento Bela Vista",
  "Loteamento Chicote",
  "Loteamento do Tomas",
  "Loteamento Lolita",
  "Loteamento Passos",
  "Loteamento Pedra Grande",
  "Loteamento São José",
  "Loteamento do Tavinho",
  "Loteamento Paulo Chicote",
  "Luís Carroceiro",
  "Matadouro",
  "Monte Cristo",
  "Morro do Calango",
  "Mutirão",
  "Nova Pedreiras",
  "Ouro Branco",
  "Ouro Vivo",
  "Pão de Açúcar",
  "Parque das Palmeiras",
  "Parque Henrique",
  "Pedreiras Centro",
  "Rua do Campo",
  "São Benedito",
  "São José, Trizidela do Vale",
  "Séringal",
  "Trizidela do Vale",
  "Vila das Palmeiras",
];

// Obter configurações
router.get("/", async (req, res) => {
  try {
    // Aqui podemos implementar a leitura das configurações do banco de dados
    // Por enquanto, retornaremos as configurações padrão

    res.status(200).json(DEFAULT_SETTINGS);
  } catch (error) {
    console.error("Erro ao obter configurações:", error);
    res
      .status(500)
      .json({ message: "Erro ao obter configurações", error: error.message });
  }
});

// Atualizar configurações (somente admin)
router.put("/", authenticateJWT, isAdmin, async (req, res) => {
  try {
    // Aqui implementaríamos a atualização das configurações no banco
    // Por enquanto, apenas simulamos uma atualização

    const updatedSettings = {
      ...DEFAULT_SETTINGS,
      ...req.body,
    };

    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    res
      .status(500)
      .json({
        message: "Erro ao atualizar configurações",
        error: error.message,
      });
  }
});

// Obter bairros disponíveis
router.get("/neighborhoods", (req, res) => {
  try {
    // Retorna a lista de bairros disponíveis
    // Em um sistema completo, isso viria do banco de dados

    const neighborhoods = AVAILABLE_NEIGHBORHOODS.map((name) => ({ name }));
    res.status(200).json(neighborhoods);
  } catch (error) {
    console.error("Erro ao obter bairros:", error);
    res
      .status(500)
      .json({
        message: "Erro ao obter bairros disponíveis",
        error: error.message,
      });
  }
});

// Adicionar bairro (somente admin)
router.post("/neighborhoods", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nome do bairro é obrigatório" });
    }

    // Aqui implementaríamos a adição do bairro no banco
    // Por enquanto, apenas simulamos que funcionou

    res.status(201).json({ name });
  } catch (error) {
    console.error("Erro ao adicionar bairro:", error);
    res
      .status(500)
      .json({ message: "Erro ao adicionar bairro", error: error.message });
  }
});

module.exports = router;
