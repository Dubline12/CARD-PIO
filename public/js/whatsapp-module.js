// public/js/whatsapp-module.js

// Módulo para gestão de confirmação e envio de pedidos via WhatsApp
const WhatsAppModule = {
    // Configurações
    config: {
        businessPhone: "5599984573587", // Número do WhatsApp da pizzaria (com código do país e DDD)
        messageTemplate: "🍕 *NOVO PEDIDO* 🍕\n\n*Pedido #{{orderId}}*\n{{orderItems}}\n*Total:* {{total}}\n\n*Cliente:* {{customerName}}\n*Telefone:* {{customerPhone}}\n\n*Forma de Entrega:* {{deliveryMethod}}\n{{deliveryDetails}}\n\n*Forma de Pagamento:* {{paymentMethod}}\n{{paymentDetails}}\n\n*Observações:* {{observations}}"
    },

    // Transformar método de entrega para texto legível
    formatDeliveryMethod(method) {
        const methods = {
            'delivery': '🛵 Entrega',
            'pickup': '🛍️ Retirada',
            'dineIn': '🍽️ Na Mesa'
        };
        return methods[method] || method;
    },

    // Transformar método de pagamento para texto legível
    formatPaymentMethod(method) {
        const methods = {
            'pix': '💸 PIX',
            'credit': '💳 Cartão de Crédito',
            'debit': '💳 Cartão de Débito',
            'cash': '💵 Dinheiro'
        };
        return methods[method] || method;
    },

    // Formatar valor como moeda
    formatCurrency(value) {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    // Gerar detalhes de entrega baseado no método
    generateDeliveryDetails(orderData) {
        if (orderData.deliveryMethod === 'delivery') {
            return `*Endereço:* ${orderData.address}, ${orderData.address_number}\n*Bairro:* ${orderData.neighborhood}${orderData.complement ? `\n*Complemento:* ${orderData.complement}` : ''}${orderData.reference ? `\n*Referência:* ${orderData.reference}` : ''}`;
        } else if (orderData.deliveryMethod === 'dineIn') {
            return `*Mesa:* ${orderData.tableNumber}`;
        } else {
            return 'Retirada no local';
        }
    },

    // Gerar detalhes de pagamento
    generatePaymentDetails(orderData) {
        if (orderData.paymentMethod === 'cash' && orderData.changeFor) {
            return `*Troco para:* ${this.formatCurrency(parseFloat(orderData.changeFor))}`;
        } else if (orderData.paymentMethod === 'pix') {
            return 'Aguardando pagamento via PIX';
        } else {
            return '';
        }
    },

    // Gerar descrição dos itens
    generateItemsDescription(items) {
        return items.map(item => {
            let itemDesc = `• ${item.quantity}x ${item.name} - ${this.formatCurrency(item.price * item.quantity)}`;
            
            // Adicionar sabores
            if (item.selectedFlavors && item.selectedFlavors.length > 0) {
                itemDesc += `\n  *Sabores:* ${item.selectedFlavors.join(', ')}`;
            }
            
            // Adicionar borda
            if (item.border) {
                itemDesc += `\n  *Borda:* ${item.border.name} (+${this.formatCurrency(item.border.price * item.quantity)})`;
            }
            
            return itemDesc;
        }).join('\n\n');
    },

    // Preparar mensagem de pedido
    prepareOrderMessage(orderData) {
        // Formatar os itens do pedido
        const orderItems = this.generateItemsDescription(orderData.items);
        
        // Calcular total com ou sem taxa de entrega
        const total = orderData.totalWithDelivery || 
                      orderData.items.reduce((sum, item) => {
                          let itemTotal = item.price * item.quantity;
                          if (item.border) {
                              itemTotal += item.border.price * item.quantity;
                          }
                          return sum + itemTotal;
                      }, 0);
        
        // Preparar mensagem substituindo placeholders
        let message = this.config.messageTemplate
            .replace('{{orderId}}', orderData.orderId)
            .replace('{{orderItems}}', orderItems)
            .replace('{{total}}', this.formatCurrency(total))
            .replace('{{customerName}}', orderData.name)
            .replace('{{customerPhone}}', orderData.phone || 'Não informado')
            .replace('{{deliveryMethod}}', this.formatDeliveryMethod(orderData.deliveryMethod))
            .replace('{{deliveryDetails}}', this.generateDeliveryDetails(orderData))
            .replace('{{paymentMethod}}', this.formatPaymentMethod(orderData.paymentMethod))
            .replace('{{paymentDetails}}', this.generatePaymentDetails(orderData))
            .replace('{{observations}}', orderData.observations || 'Nenhuma');
        
        return encodeURIComponent(message);
    },

    // Enviar pedido via WhatsApp
    sendOrder(orderData) {
        const message = this.prepareOrderMessage(orderData);
        const whatsappLink = `https://wa.me/${this.config.businessPhone}?text=${message}`;
        
        // Abre uma nova aba com o link do WhatsApp
        window.open(whatsappLink, '_blank');
    },

    // Criar página de confirmação do pedido
    createOrderConfirmationPage(orderData) {
        // Limpar conteúdo principal
        const mainContent = document.querySelector('main');
        if (!mainContent) return;
        
        mainContent.innerHTML = '';
        
        // Criar elemento de confirmação
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'container mx-auto max-w-2xl p-6 bg-white rounded-lg shadow-lg animate-fade-in';
        
        // Calcular total
        const total = orderData.totalWithDelivery || 
                      orderData.items.reduce((sum, item) => {
                          let itemTotal = item.price * item.quantity;
                          if (item.border) {
                              itemTotal += item.border.price * item.quantity;
                          }
                          return sum + itemTotal;
                      }, 0);
        
        // Conteúdo da confirmação
        confirmationDiv.innerHTML = `
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <i class="fas fa-check text-green-500 text-3xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Pedido Realizado com Sucesso!</h2>
                <p class="text-gray-600 mt-2">Seu pedido #${orderData.orderId} foi enviado com sucesso!</p>
            </div>
            
            <div class="border-t border-b py-4 my-6">
                <h3 class="font-bold text-lg mb-4">Resumo do Pedido</h3>
                <div class="space-y-3">
                    ${orderData.items.map(item => {
                        let price = item.price * item.quantity;
                        if (item.border) {
                            price += item.border.price * item.quantity;
                        }
                        
                        return `
                            <div class="flex justify-between">
                                <div>
                                    <p class="font-medium">${item.quantity}x ${item.name}</p>
                                    ${item.selectedFlavors && item.selectedFlavors.length > 0 ? 
                                        `<p class="text-sm text-gray-600">Sabores: ${item.selectedFlavors.join(', ')}</p>` : ''}
                                    ${item.border ? 
                                        `<p class="text-sm text-gray-600">Borda: ${item.border.name}</p>` : ''}
                                </div>
                                <p class="font-medium">${this.formatCurrency(price)}</p>
                            </div>
                        `;
                    }).join('')}
                    
                    ${orderData.deliveryMethod === 'delivery' ? `
                        <div class="flex justify-between pt-2 border-t">
                            <p>Taxa de Entrega</p>
                            <p>${this.formatCurrency(orderData.deliveryFee || 0)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="flex justify-between pt-2 border-t font-bold">
                        <p>Total</p>
                        <p>${this.formatCurrency(total)}</p>
                    </div>
                </div>
            </div>
            
            <div class="mb-6">
                <h3 class="font-bold text-lg mb-2">Detalhes da Entrega</h3>
                <p><span class="font-medium">Método:</span> ${this.formatDeliveryMethod(orderData.deliveryMethod)}</p>
                ${orderData.deliveryMethod === 'delivery' ? `
                    <p><span class="font-medium">Endereço:</span> ${orderData.address}, ${orderData.address_number}</p>
                    <p><span class="font-medium">Bairro:</span> ${orderData.neighborhood}</p>
                    ${orderData.complement ? `<p><span class="font-medium">Complemento:</span> ${orderData.complement}</p>` : ''}
                    ${orderData.reference ? `<p><span class="font-medium">Referência:</span> ${orderData.reference}</p>` : ''}
                ` : orderData.deliveryMethod === 'dineIn' ? `
                    <p><span class="font-medium">Mesa:</span> ${orderData.tableNumber}</p>
                ` : `
                    <p>Retirada no local</p>
                `}
            </div>
            
            <div class="mb-6">
                <h3 class="font-bold text-lg mb-2">Pagamento</h3>
                <p><span class="font-medium">Método:</span> ${this.formatPaymentMethod(orderData.paymentMethod)}</p>
                ${orderData.paymentMethod === 'cash' && orderData.changeFor ? `
                    <p><span class="font-medium">Troco para:</span> ${this.formatCurrency(parseFloat(orderData.changeFor))}</p>
                ` : ''}
            </div>
            
            <div class="text-center mt-8">
                <p class="text-gray-600 mb-4">O pedido será enviado para o WhatsApp da pizzaria. Clique no botão abaixo para continuar.</p>
                <button id="send-whatsapp-btn" class="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300">
                    <i class="fab fa-whatsapp mr-2"></i> Enviar pedido via WhatsApp
                </button>
                <p class="text-sm text-gray-500 mt-4">Você também pode ligar para (99) 98457-3587 para confirmar seu pedido</p>
            </div>
        `;
        
        mainContent.appendChild(confirmationDiv);
        
        // Adicionar listener para o botão de WhatsApp
        const whatsappBtn = document.getElementById('send-whatsapp-btn');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => {
                this.sendOrder(orderData);
            });
        }
        
        // Limpar o carrinho
        state.cart = [];
        localStorage.removeItem('cart');
        
        // Atualizar contagem do carrinho
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = "0";
        }
    }
};

// Exportar o módulo para o escopo global
window.WhatsAppModule = WhatsAppModule;
