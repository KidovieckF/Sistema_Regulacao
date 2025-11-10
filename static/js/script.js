/**
 * Script principal da aplicação Flask - Gerenciador de Tarefas
 * Funções para interação com a API e manipulação do DOM
 */

// ==================== FUNÇÕES DE API ====================

/**
 * Carrega e exibe as estatísticas das tarefas
 */
async function carregarEstatisticas() {
    try {
        const response = await fetch('/api/estatisticas');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar estatísticas');
        }
        
        const dados = await response.json();
        
        // Atualizar os valores no DOM
        document.getElementById('stat-total').textContent = dados.total;
        document.getElementById('stat-concluidas').textContent = dados.concluidas;
        document.getElementById('stat-pendentes').textContent = dados.pendentes;
        
        // Animação de contagem
        animarContagem('stat-total', dados.total);
        animarContagem('stat-concluidas', dados.concluidas);
        animarContagem('stat-pendentes', dados.pendentes);
        
    } catch (erro) {
        console.error('Erro ao carregar estatísticas:', erro);
        mostrarNotificacao('Erro ao carregar estatísticas', 'erro');
    }
}

/**
 * Alterna o status de conclusão de uma tarefa
 * @param {number} tarefaId - ID da tarefa
 */
async function toggleTarefa(tarefaId) {
    try {
        const response = await fetch(`/api/tarefa/${tarefaId}/concluir`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar tarefa');
        }
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            // Encontrar o card da tarefa
            const taskCard = document.querySelector(`[data-task-id="${tarefaId}"]`);
            const botao = taskCard.querySelector('.btn-concluir');
            
            // Alternar classe de conclusão
            taskCard.classList.toggle('task-completed');
            
            // Atualizar texto do botão
            if (resultado.concluida) {
                botao.innerHTML = '✓ Enviada';
                mostrarNotificacao('Tarefa marcada como concluída!', 'sucesso');
            } else {
                botao.innerHTML = '○ Enviar';
                mostrarNotificacao('Tarefa desmarcada', 'info');
            }
            
            // Atualizar estatísticas
            carregarEstatisticas();
        }
        
    } catch (erro) {
        console.error('Erro ao atualizar tarefa:', erro);
        mostrarNotificacao('Erro ao atualizar tarefa', 'erro');
    }
}


/**
 * Exibe um modal de confirmação customizado
 * @param {string} titulo - Título do modal
 * @param {string} mensagem - Mensagem exibida
 * @returns {Promise<boolean>} - Retorna true se confirmado
 */
function mostrarConfirmacao(titulo, mensagem) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmacaoModal');
        const modalTitulo = document.getElementById('modalTitulo');
        const modalMensagem = document.getElementById('modalMensagem');
        const btnConfirmar = document.getElementById('modalConfirmar');
        const btnCancelar = document.getElementById('modalCancelar');

        modalTitulo.textContent = titulo;
        modalMensagem.textContent = mensagem;

        modal.style.display = 'flex';

        // Funções de clique
        btnConfirmar.onclick = () => {
            modal.style.display = 'none';
            resolve(true);
        };

        btnCancelar.onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };

        // Fecha o modal ao clicar fora
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                resolve(false);
            }
        };
    });
}



/**
 * Deleta uma tarefa
 * @param {number} tarefaId - ID da tarefa
 */
async function deletarTarefa(tarefaId) {
    // Confirmação antes de deletar
    const confirmacao = await mostrarConfirmacao(
        'Tem certeza que deseja deletar esta tarefa?',
        'Esta ação não pode ser desfeita.'
    );

    if (!confirmacao) return;
    
    try {
        const response = await fetch(`/api/tarefa/${tarefaId}/deletar`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao deletar tarefa');
        }
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            // Encontrar e remover o card da tarefa com animação
            const taskCard = document.querySelector(`[data-task-id="${tarefaId}"]`);
            
            taskCard.style.opacity = '0';
            taskCard.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                taskCard.remove();
                
                // Verificar se ainda há tarefas
                const tasksGrid = document.querySelector('.tasks-grid');
                if (tasksGrid && tasksGrid.children.length === 0) {
                    // Recarregar a página para mostrar estado vazio
                    location.reload();
                } else {
                    // Atualizar estatísticas
                    carregarEstatisticas();
                    mostrarNotificacao('Tarefa deletada com sucesso!', 'sucesso');
                }
            }, 300);
        }
        
    } catch (erro) {
        console.error('Erro ao deletar tarefa:', erro);
        mostrarNotificacao('Erro ao deletar tarefa', 'erro');
    }
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

/**
 * Valida o formulário de adicionar tarefa
 * @returns {boolean} - Retorna true se o formulário é válido
 */
function validarFormulario() {
    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const data = document.getElementById('data').value;
    
    if (!titulo) {
        mostrarNotificacao('Por favor, preencha o título da tarefa', 'erro');
        return false;
    }
    
    if (!descricao) {
        mostrarNotificacao('Por favor, preencha a descrição da tarefa', 'erro');
        return false;
    }
    
    if (!data) {
        mostrarNotificacao('Por favor, selecione uma data', 'erro');
        return false;
    }
    
    return true;
}

/**
 * Mostra uma notificação na tela
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo da notificação (sucesso, erro, info)
 */
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remover notificações anteriores
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }
    
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    
    // Estilos inline para a notificação
    Object.assign(notificacao.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        color: 'white',
        fontWeight: '600',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px'
    });
    
    // Cores baseadas no tipo
    const cores = {
        sucesso: '#10b981',
        erro: '#ef4444',
        info: '#5D5CDE'
    };
    
    notificacao.style.backgroundColor = cores[tipo] || cores.info;
    
    // Adicionar ao body
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

/**
 * Função para confirmar ação (substituindo window.confirm)
 * @param {string} mensagem - Mensagem de confirmação
 * @returns {boolean} - Retorna true se confirmado
 */
function confirmarAcao(mensagem) {
    // Por enquanto usa confirm nativo, mas pode ser substituído por modal customizado
    return confirm(mensagem);
}

/**
 * Anima a contagem de um número
 * @param {string} elementId - ID do elemento
 * @param {number} valorFinal - Valor final da contagem
 */
function animarContagem(elementId, valorFinal) {
    const elemento = document.getElementById(elementId);
    const duracao = 500; // ms
    const passos = 20;
    const incremento = valorFinal / passos;
    let contador = 0;
    let valorAtual = 0;
    
    const intervalo = setInterval(() => {
        valorAtual += incremento;
        contador++;
        
        if (contador >= passos) {
            elemento.textContent = valorFinal;
            clearInterval(intervalo);
        } else {
            elemento.textContent = Math.floor(valorAtual);
        }
    }, duracao / passos);
}

// ==================== ANIMAÇÕES CSS ====================

// Adicionar estilos de animação ao documento
const estilosAnimacao = document.createElement('style');
estilosAnimacao.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(estilosAnimacao);

// ==================== EVENT
