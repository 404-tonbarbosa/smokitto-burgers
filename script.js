document.addEventListener('DOMContentLoaded', function() {
    // Variáveis globais
    let currentStep = 1;
    const totalSteps = 7;
    const pedido = {
        base: ['Pão Brioche', 'Hambúrguer 56g', 'Tomate', 'Alface', 'Batata Palha'],
        adicionais: [],
        adicionaisPagos: [],
        molhos: [],
        bebidas: [],
        endereco: {},
        pagamento: 'cartao',
        total: 0,
        nomeLanche: ''
    };

    // Elementos do DOM
    const progressSteps = document.querySelectorAll('.progress-step');
    const sections = document.querySelectorAll('.section');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const optionCards = document.querySelectorAll('.option-card');
    const floatingCart = document.getElementById('floating-cart');
    const cartCount = document.getElementById('cart-count');
    const finalizarPedidoBtn = document.getElementById('finalizar-pedido');
    const whatsappButton = document.getElementById('whatsapp-button');
    const confirmationPage = document.getElementById('confirmation-page');
    const nomeLancheInput = document.getElementById('nome-lanche');
    const burgerNameDisplay = document.getElementById('burger-name-display');

    // Mostrar apenas a primeira seção inicialmente
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById('section-1').classList.add('active');

    // Navegação entre passos
    function updateProgress() {
        progressSteps.forEach((step, index) => {
            if (index + 1 < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        // Esconde todas as seções e mostra apenas a atual
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        if (currentStep <= totalSteps) {
            document.getElementById(`section-${currentStep}`).classList.add('active');
        }

        // Atualiza o carrinho flutuante
        updateCartCount();
    }

    // Avançar passo
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                updateProgress();
                
                // Ao chegar na etapa de confirmação, atualiza o resumo
                if (currentStep === 7) {
                    updateOrderSummary();
                }
            }
        });
    });

    // Voltar passo
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateProgress();
            }
        });
    });

    // Seleção de opções
    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            const item = this.getAttribute('data-item');
            const price = parseFloat(this.getAttribute('data-price'));
            const group = this.getAttribute('data-group');
            
            // Verifica se é um adicional grátis
            if (group === 'free') {
                const selectedFree = document.querySelectorAll('.option-card.selected[data-group="free"]').length;
                
                if (this.classList.contains('selected')) {
                    // Remove seleção
                    this.classList.remove('selected');
                    removeFromOrder(item, 'adicionais');
                } else if (selectedFree < 4) {
                    // Adiciona seleção
                    this.classList.add('selected');
                    addToOrder(item, this.querySelector('.option-name').textContent, price, 'adicionais');
                } else {
                    // Limite atingido
                    alert('Você só pode escolher até 4 adicionais grátis. Para mais, selecione na seção de adicionais pagos.');
                }
            } else {
                // Para outros itens (pagos ou não)
                this.classList.toggle('selected');
                
                if (this.classList.contains('selected')) {
                    // Determina a categoria do item
                    let category = 'adicionaisPagos';
                    if (item.includes('suco') || item.includes('refri')) category = 'bebidas';
                    else if (item.includes('ketchup') || item.includes('maionese')) category = 'molhos';
                    
                    addToOrder(item, this.querySelector('.option-name').textContent, price, category);
                } else {
                    removeFromOrder(item);
                }
            }
            
            updateCartCount();
        });
    });

    // Adiciona item ao pedido
    function addToOrder(item, name, price, category) {
        // Remove se já existir (evitar duplicatas)
        removeFromOrder(item);
        
        // Adiciona ao array apropriado
        if (category === 'adicionais' || category === 'molhos') {
            pedido[category].push(name);
        } else if (category === 'adicionaisPagos' || category === 'bebidas') {
            pedido[category].push({ name, price });
        }
        
        // Atualiza total
        pedido.total += price;
    }

    // Remove item do pedido
    function removeFromOrder(item, specificCategory = null) {
        // Encontra o item em qualquer categoria e remove
        let removed = false;
        
        if (!specificCategory) {
            // Verifica em todas as categorias
            ['adicionais', 'adicionaisPagos', 'molhos', 'bebidas'].forEach(category => {
                if (removeItemFromCategory(item, category)) {
                    removed = true;
                }
            });
        } else {
            removed = removeItemFromCategory(item, specificCategory);
        }
        
        return removed;
    }

    function removeItemFromCategory(item, category) {
        if (category === 'adicionais' || category === 'molhos') {
            const index = pedido[category].findIndex(name => 
                name.toLowerCase().includes(item.split('-')[0]));
            if (index !== -1) {
                pedido[category].splice(index, 1);
                return true;
            }
        } else if (category === 'adicionaisPagos' || category === 'bebidas') {
            const index = pedido[category].findIndex(obj => 
                obj.name.toLowerCase().includes(item.split('-')[0]));
            if (index !== -1) {
                pedido.total -= pedido[category][index].price;
                pedido[category].splice(index, 1);
                return true;
            }
        }
        return false;
    }

    // Atualiza contador do carrinho
    function updateCartCount() {
        const totalItems = 
            pedido.adicionais.length + 
            pedido.adicionaisPagos.length + 
            pedido.molhos.length + 
            pedido.bebidas.length;
        
        cartCount.textContent = totalItems;
        
        // Animação quando adiciona itens
        if (totalItems > 0) {
            floatingCart.style.transform = 'scale(1.1)';
            setTimeout(() => {
                floatingCart.style.transform = 'scale(1)';
            }, 300);
        }
    }

    // Atualiza o resumo do pedido
    function updateOrderSummary() {
        // Captura dados do endereço
        pedido.endereco = {
            rua: document.getElementById('rua').value,
            numero: document.getElementById('numero').value,
            bairro: document.getElementById('bairro').value,
            complemento: document.getElementById('complemento').value,
            cep: document.getElementById('cep').value,
            observacoes: document.getElementById('observacoes').value
        };
        
        // Captura forma de pagamento
        pedido.pagamento = document.querySelector('input[name="pagamento"]:checked').value;
        
        // Atualiza os elementos de resumo
        document.getElementById('base-summary').innerHTML = 
            pedido.base.map(item => `<div class="summary-item">${item}</div>`).join('');
        
        document.getElementById('adicionais-summary').innerHTML = 
            pedido.adicionais.map(item => `<div class="summary-item">${item}</div>`).join('') +
            pedido.adicionaisPagos.map(item => `<div class="summary-item">${item.name} <span>+ R$ ${item.price.toFixed(2)}</span></div>`).join('');
        
        document.getElementById('molhos-summary').innerHTML = 
            pedido.molhos.map(item => `<div class="summary-item">${item}</div>`).join('');
        
        document.getElementById('bebidas-summary').innerHTML = 
            pedido.bebidas.map(item => `<div class="summary-item">${item.name} <span>R$ ${item.price.toFixed(2)}</span></div>`).join('');
        
        document.getElementById('endereco-summary').innerHTML = `
            <div class="summary-item">${pedido.endereco.rua}, ${pedido.endereco.numero}</div>
            <div class="summary-item">${pedido.endereco.bairro}</div>
            <div class="summary-item">${pedido.endereco.complemento || 'Sem complemento'}</div>
            <div class="summary-item">CEP: ${pedido.endereco.cep}</div>
            <div class="summary-item">Obs: ${pedido.endereco.observacoes || 'Nenhuma'}</div>
        `;
        
        document.getElementById('pagamento-summary').innerHTML = `
            <div class="summary-item">${getPaymentMethodName(pedido.pagamento)}</div>
        `;
        
        // Calcula total
        const total = pedido.bebidas.reduce((sum, item) => sum + item.price, 0) +
                     pedido.adicionaisPagos.reduce((sum, item) => sum + item.price, 0);
        
        document.getElementById('total-summary').textContent = `Total: R$ ${total.toFixed(2)}`;
    }

    function getPaymentMethodName(method) {
        switch(method) {
            case 'cartao': return 'Cartão (Máquina na entrega)';
            case 'dinheiro': return 'Dinheiro';
            case 'pix': return 'PIX';
            default: return method;
        }
    }

    // Finalizar pedido
    finalizarPedidoBtn.addEventListener('click', function() {
        // Validação básica
        if (!pedido.endereco.rua || !pedido.endereco.numero || !pedido.endereco.bairro || !pedido.endereco.cep) {
            alert('Por favor, preencha todos os campos obrigatórios do endereço.');
            currentStep = 5;
            updateProgress();
            return;
        }
        
        // Captura o nome do lanche
        pedido.nomeLanche = nomeLancheInput.value.trim();
        if (!pedido.nomeLanche) {
            alert('Por favor, dê um nome criativo para seu lanche!');
            return;
        }
        
        // Mostra a página de confirmação
        showConfirmationPage();
    });

    // Mostrar página de confirmação
    function showConfirmationPage() {
        // Esconde todas as seções
        sections.forEach(section => section.classList.remove('active'));
        
        // Atualiza a página de confirmação
        burgerNameDisplay.textContent = `"${pedido.nomeLanche}"`;
        
        // Preenche os detalhes do pedido
        document.getElementById('order-summary').innerHTML = `
            <h4>Seu lanche: ${pedido.nomeLanche}</h4>
            <div class="summary-item">Base: ${pedido.base.join(', ')}</div>
            ${pedido.adicionais.length > 0 ? `<div class="summary-item">Adicionais grátis: ${pedido.adicionais.join(', ')}</div>` : ''}
            ${pedido.adicionaisPagos.length > 0 ? `<div class="summary-item">Adicionais extras: ${pedido.adicionaisPagos.map(item => item.name).join(', ')}</div>` : ''}
            ${pedido.molhos.length > 0 ? `<div class="summary-item">Molhos: ${pedido.molhos.join(', ')}</div>` : ''}
            ${pedido.bebidas.length > 0 ? `<div class="summary-item">Bebidas: ${pedido.bebidas.map(item => item.name).join(', ')}</div>` : ''}
        `;
        
        document.getElementById('delivery-summary').innerHTML = `
            <h4>Endereço de entrega:</h4>
            <div class="summary-item">${pedido.endereco.rua}, ${pedido.endereco.numero}</div>
            <div class="summary-item">${pedido.endereco.bairro}</div>
            <div class="summary-item">${pedido.endereco.complemento || 'Sem complemento'}</div>
            <div class="summary-item">CEP: ${pedido.endereco.cep}</div>
            <div class="summary-item">Observações: ${pedido.endereco.observacoes || 'Nenhuma'}</div>
        `;
        
        document.getElementById('payment-summary-final').innerHTML = `
            <h4>Pagamento:</h4>
            <div class="summary-item">${getPaymentMethodName(pedido.pagamento)}</div>
        `;
        
        // Calcula total
        const total = pedido.bebidas.reduce((sum, item) => sum + item.price, 0) +
                     pedido.adicionaisPagos.reduce((sum, item) => sum + item.price, 0);
        
        document.getElementById('total-summary-final').textContent = `Total: R$ ${total.toFixed(2)}`;
        
        // Mostra a página de confirmação
        confirmationPage.classList.remove('hidden');
        
        // Rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Botão do WhatsApp
    whatsappButton.addEventListener('click', function() {
        const phone = '5511999999999'; // Substitua pelo número real
        const message = generateWhatsAppMessage();
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    });

    // Gerar mensagem para WhatsApp
    function generateWhatsAppMessage() {
        let message = `📱 *Pedido Smokitto Burgers* 🍔\n\n`;
        
        // Nome do lanche
        message += `🍔 *Lanche Personalizado:* ${pedido.nomeLanche}\n\n`;
        
        // Base
        message += `🍔 *Base do Lanche:*\n`;
        message += `- ${pedido.base.join('\n- ')}\n\n`;
        
        // Adicionais
        if (pedido.adicionais.length > 0 || pedido.adicionaisPagos.length > 0) {
            message += `➕ *Adicionais:*\n`;
            pedido.adicionais.forEach(item => message += `- ${item} (Grátis)\n`);
            pedido.adicionaisPagos.forEach(item => message += `- ${item.name} (+ R$ ${item.price.toFixed(2)})\n`);
            message += `\n`;
        }
        
        // Molhos
        if (pedido.molhos.length > 0) {
            message += `🍶 *Molhos:*\n`;
            message += `- ${pedido.molhos.join('\n- ')}\n\n`;
        }
        
        // Bebidas
        if (pedido.bebidas.length > 0) {
            message += `🥤 *Bebidas:*\n`;
            pedido.bebidas.forEach(item => message += `- ${item.name} (R$ ${item.price.toFixed(2)})\n`);
            message += `\n`;
        }
        
        // Endereço
        message += `📍 *Endereço de Entrega:*\n`;
        message += `${pedido.endereco.rua}, ${pedido.endereco.numero}\n`;
        message += `${pedido.endereco.bairro}\n`;
        message += `${pedido.endereco.complemento || 'Sem complemento'}\n`;
        message += `CEP: ${pedido.endereco.cep}\n`;
        message += `Observações: ${pedido.endereco.observacoes || 'Nenhuma'}\n\n`;
        
        // Pagamento
        message += `💳 *Forma de Pagamento:* ${getPaymentMethodName(pedido.pagamento)}\n\n`;
        
        // Total
        const total = pedido.bebidas.reduce((sum, item) => sum + item.price, 0) +
                     pedido.adicionaisPagos.reduce((sum, item) => sum + item.price, 0);
        message += `💰 *Total do Pedido:* R$ ${total.toFixed(2)}\n\n`;
        
        message += `🔔 *Obrigado pelo seu pedido!* 🍔`;
        
        return message;
    }

    // Carrinho flutuante - mostra resumo ao clicar
    floatingCart.addEventListener('click', function() {
        updateOrderSummary();
        currentStep = 7;
        updateProgress();
        
        // Rola para o topo da seção de confirmação
        document.getElementById('section-7').scrollIntoView({ behavior: 'smooth' });
    });
});
