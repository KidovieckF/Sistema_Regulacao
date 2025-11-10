document.addEventListener("DOMContentLoaded", () => {
    // Gerenciamento das views
    const viewButtons = document.querySelectorAll('.view-toggle button');
    const views = {
        lista: document.getElementById('listaPedidos'),
        resumo: document.getElementById('resumoMensal')
    };

    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewName = this.dataset.view;
            
            // Atualizar botões
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Mostrar view selecionada
            Object.keys(views).forEach(key => {
                views[key].style.display = key === viewName ? 'block' : 'none';
            });
        });
    });

    // Helpers para mostrar/ocultar modais (simula comportamento mínimo do Bootstrap)
    function createBackdrop() {
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            // ensure backdrop covers full screen and is behind modal
            backdrop.style.position = 'fixed';
            backdrop.style.left = '0';
            backdrop.style.top = '0';
            backdrop.style.width = '100%';
            backdrop.style.height = '100%';
            backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
            backdrop.style.zIndex = '1040';
            backdrop.classList.add('show');
            document.body.appendChild(backdrop);
        }
        return backdrop;
    }

    function showModal(el) {
        if (!el) return;
        console.log('showModal called for', el.id, el);
        el.style.display = 'block';
        el.classList.add('show');
        // ensure modal is above backdrop
        try {
            el.style.zIndex = '1050';
        } catch (e) {}
        document.body.classList.add('modal-open');
        const backdrop = createBackdrop();
        if (backdrop) backdrop.classList.add('show');
        // diagnostic info
        try {
            const cs = window.getComputedStyle(el);
            console.log(`modal ${el.id} computed display=${cs.display}, visibility=${cs.visibility}, opacity=${cs.opacity}`);
            console.log('modal rect', el.getBoundingClientRect());
        } catch (e) {}
    }

    function hideModal(el) {
        if (!el) return;
        console.log('hideModal called for', el.id);
        el.style.display = 'none';
        el.classList.remove('show');
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
    }

    // Handlers para lista de pedidos
    const pedidoRows = document.querySelectorAll('.pedido-row');
    pedidoRows.forEach(row => {
        row.addEventListener('click', async function() {
            const pedidoId = this.dataset.id;
            await carregarDetalhesPedido(pedidoId);
            // Mostrar modal de detalhes (usando helper)
            const modalDetalhes = document.getElementById('modalDetalhes');
            if (modalDetalhes) showModal(modalDetalhes);
        });
    });

    // Formulário de contato
    const formContato = document.getElementById('formContato');
    if (formContato) {
        formContato.addEventListener('submit', async function(e) {
            e.preventDefault();
            await registrarTentativa();
        });
    }

    // Modal legado para resumo mensal
    const modalResumo = document.createElement('div');
    modalResumo.className = 'modal';
    modalResumo.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3></h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <table class="tabela-pedidos">
                    <thead>
                        <tr>
                            <th>Protocolo</th>
                            <th>Paciente</th>
                            <th>Unidade</th>
                            <th>Data</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;
    document.body.appendChild(modalResumo);

    // Fechar modal
    const closeBtn = modalResumo.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modalResumo.style.display = 'none';
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === modalResumo) {
            modalResumo.style.display = 'none';
        }
    });

    // Configurar fechamento do modal de detalhes (se existir no DOM)
    const modalDetalhesEl = document.getElementById('modalDetalhes');
    if (modalDetalhesEl) {
        const closeDetalhes = modalDetalhesEl.querySelector('.close');
        if (closeDetalhes) {
            closeDetalhes.addEventListener('click', () => {
                modalDetalhesEl.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modalDetalhesEl) {
                modalDetalhesEl.style.display = 'none';
            }
        });
    }

    // Handler para cliques nos blocos P1/P2
    document.querySelectorAll('.celula-prioridade span').forEach(span => {
        span.style.cursor = 'pointer';
        span.addEventListener('click', async () => {
            const prioridade = span.classList.contains('p1') ? 'P1' : 'P2';
            const exame = span.closest('tr').querySelector('td strong').textContent;
            const mes = span.closest('tr').cells[span.closest('td').cellIndex].dataset.mes;

            try {
                const response = await fetch(`/api/exames_detalhes?exame=${encodeURIComponent(exame)}&mes=${encodeURIComponent(mes)}&prioridade=${prioridade}`);
                
                if (!response.ok) {
                    throw new Error('Erro ao buscar detalhes');
                }

                const detalhes = await response.json();

                // Atualizar título do modal
                modalResumo.querySelector('.modal-header h3').textContent = 
                    `${exame} - ${mes} (${prioridade})`;

                // Limpar e preencher tabela
                const tbody = modalResumo.querySelector('tbody');
                tbody.innerHTML = detalhes.map(d => `
                    <tr data-id="${d.id}">
                        <td>${d.protocolo}</td>
                        <td>${d.nome_paciente}</td>
                        <td>${d.unidade_nome}</td>
                        <td>${d.data_registro}</td>
                        <td>${d.status}</td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-agendar">
                                Agendar
                            </button>
                        </td>
                    </tr>
                `).join('');

                // Adicionar handlers para os botões de agendamento
                tbody.querySelectorAll('.btn-agendar').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation(); // Evita propagação do evento
                        const row = btn.closest('tr');
                        const pedidoId = row ? row.dataset.id : null;

                        console.log('btn-agendar clicked, pedidoId=', pedidoId);
                        if (!pedidoId) {
                            alert('ID do pedido não encontrado para este item.');
                            return;
                        }

                        try {
                            // Carregar detalhes primeiro; só fechar o resumo se carregar com sucesso
                            await carregarDetalhesPedido(pedidoId);

                            // Fechar modal de resumo após carregar detalhes
                            hideModal(modalResumo);

                            // Abrir modal de detalhes (sem jQuery)
                            const modalDetalhes = document.getElementById('modalDetalhes');
                            if (modalDetalhes) showModal(modalDetalhes);
                            console.log('Detalhes carregados e modal exibido para pedido', pedidoId);
                        } catch (err) {
                            console.error('Erro ao abrir detalhes após clicar Agendar:', err);
                            alert('Erro ao abrir detalhes do pedido. Veja o console para detalhes.');
                        }
                    });
                });

                // Exibir modal
                modalResumo.style.display = 'block';

            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao carregar detalhes dos exames.');
            }
        });
    });
});

async function carregarDetalhesPedido(pedidoId) {
    try {
        const response = await fetch(`/api/pedidos/${pedidoId}`);
        const dados = await response.json();

        if (dados.erro) {
            alert(dados.erro);
            return;
        }

        // Trabalhar sempre dentro do modal de detalhes (se existir)
        const modalDetalhes = document.getElementById('modalDetalhes');

        const pacienteNomeEl = modalDetalhes ? modalDetalhes.querySelector('#paciente-nome') : document.getElementById('paciente-nome');
        const pacienteTelefoneEl = modalDetalhes ? modalDetalhes.querySelector('#paciente-telefone') : document.getElementById('paciente-telefone');
        const pacienteUnidadeEl = modalDetalhes ? modalDetalhes.querySelector('#paciente-unidade') : document.getElementById('paciente-unidade');

        if (pacienteNomeEl) pacienteNomeEl.textContent = dados.nome_paciente || '';
        if (pacienteTelefoneEl) pacienteTelefoneEl.textContent = dados.telefone || '';
        if (pacienteUnidadeEl) pacienteUnidadeEl.textContent = dados.unidade || '';

        // Preencher informações do exame
        const exameTipoEl = modalDetalhes ? modalDetalhes.querySelector('#exame-tipo') : document.getElementById('exame-tipo');
        const examePrioridadeEl = modalDetalhes ? modalDetalhes.querySelector('#exame-prioridade') : document.getElementById('exame-prioridade');
        const exameStatusEl = modalDetalhes ? modalDetalhes.querySelector('#exame-status') : document.getElementById('exame-status');

        if (exameTipoEl) exameTipoEl.textContent = dados.exame_nome || '';
        if (examePrioridadeEl) examePrioridadeEl.textContent = dados.prioridade || '';
        if (exameStatusEl) exameStatusEl.textContent = dados.status_agendamento || '';

        // Preencher histórico de contatos
        const listaContatos = modalDetalhes ? modalDetalhes.querySelector('#lista-contatos') : document.getElementById('lista-contatos');
        if (listaContatos) {
            listaContatos.innerHTML = '';
            (dados.historico_contatos || []).forEach(contato => {
                const div = document.createElement('div');
                div.className = 'contato-item mb-2 p-2 border rounded';
                div.innerHTML = `
                    <strong>${contato.data_hora ? new Date(contato.data_hora).toLocaleString() : ''}</strong> - 
                    ${contato.resultado || ''}
                    ${contato.observacao ? `<br><small>${contato.observacao}</small>` : ''}
                `;
                listaContatos.appendChild(div);
            });
        }

        // Atualizar barra de progresso
        const progressBar = modalDetalhes ? modalDetalhes.querySelector('.progress-bar') : document.querySelector('.progress-bar');
        const progresso = ((dados.tentativas_contato || 0) / 3) * 100;
        if (progressBar) {
            progressBar.style.width = `${progresso}%`;
            progressBar.style.backgroundColor = progresso >= 100 ? '#dc3545' : '#007bff';
        }

        // Configurar formulário (dentro do modal)
        const pedidoIdInput = modalDetalhes ? modalDetalhes.querySelector('#pedidoId') : document.getElementById('pedidoId');
        const btnRegistrar = modalDetalhes ? modalDetalhes.querySelector('#btnRegistrar') : document.getElementById('btnRegistrar');
        const formContatoEl = modalDetalhes ? modalDetalhes.querySelector('#formContato') : document.getElementById('formContato');

        if (pedidoIdInput) pedidoIdInput.value = pedidoId;

        // Ajustar botão 'Agendar' para abrir página dedicada
        const btnAbrirAgendar = modalDetalhes ? modalDetalhes.querySelector('#btnAbrirAgendar') : document.getElementById('btnAbrirAgendar');
        if (btnAbrirAgendar) {
            btnAbrirAgendar.setAttribute('href', `/agendar/${pedidoId}`);
            btnAbrirAgendar.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = `/agendar/${pedidoId}`;
            });
        }

        if (btnRegistrar && formContatoEl) {
            if ((dados.tentativas_contato || 0) >= 3 || (dados.status_agendamento === 'Agendado') || (dados.status_agendamento === 'Cancelado por não contato')) {
                btnRegistrar.disabled = true;
                formContatoEl.classList.add('disabled');
            } else {
                btnRegistrar.disabled = false;
                formContatoEl.classList.remove('disabled');
            }
        }

        // Pre-preencher data/hora atual
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const dataHoraInput = modalDetalhes ? modalDetalhes.querySelector('#dataHora') : document.getElementById('dataHora');
        if (dataHoraInput) dataHoraInput.value = now.toISOString().slice(0, 16);

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do pedido');
    }
}

async function registrarTentativa() {
    const pedidoId = document.getElementById('pedidoId').value;
    const dataHora = document.getElementById('dataHora').value;
    const resultado = document.getElementById('resultado').value;
    const observacao = document.getElementById('observacao').value;

    try {
        const response = await fetch('/api/registrar-contato', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pedido_id: pedidoId,
                data_hora: dataHora,
                resultado: resultado,
                observacao: observacao
            })
        });

        const dados = await response.json();

        if (dados.erro) {
            alert(dados.erro);
            return;
        }

        // Recarregar detalhes do pedido
        await carregarDetalhesPedido(pedidoId);

        // Limpar formulário
        document.getElementById('observacao').value = '';

        // Se o pedido foi finalizado, atualizar a lista
        if (dados.status_atualizado) {
            location.reload();
        }

    } catch (error) {
        console.error('Erro ao registrar tentativa:', error);
        alert('Erro ao registrar tentativa de contato');
    }
}