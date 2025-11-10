document.addEventListener("DOMContentLoaded", () => {

    
    
    // ---- Clique em linhas clicáveis (redirecionar para /agendar/<id>) ----
    document.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', function() {
            const href = this.dataset.href;
            if (href) {
                window.location.href = href;
            }
        });
    });

    // ---- Alternância entre Lista e Resumo ----
    const viewButtons = document.querySelectorAll('.view-toggle button');
    const views = {
        lista: document.getElementById('listaPedidos'),
        resumo: document.getElementById('resumoMensal')
    };

    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewName = this.dataset.view;

            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            Object.keys(views).forEach(key => {
                views[key].style.display = key === viewName ? 'block' : 'none';
            });
        });
    });

    // ---- Modal helpers ----
    function createBackdrop() {
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop show';
            Object.assign(backdrop.style, {
                position: 'fixed', left: 0, top: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040
            });
            document.body.appendChild(backdrop);
        }
        return backdrop;
    }

    function showModal(el) {
        if (!el) return;
        el.style.display = 'block';
        el.classList.add('show');
        el.style.zIndex = '1050';
        document.body.classList.add('modal-open');
        createBackdrop();
    }

    function hideModal(el) {
        if (!el) return;
        el.style.display = 'none';
        el.classList.remove('show');
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
    }

    // ---- Clique em linhas de pedidos (lista) ----
    // ---- Clique em linhas de pedidos (lista principal) ----
    document.querySelectorAll('.pedido-row').forEach(row => {
        row.addEventListener('click', async function() {
            const pedidoId = this.dataset.id;
            if (!pedidoId) {
                console.error('❌ Erro: pedidoId ausente no elemento da linha.');
                return;
            }
            await carregarDetalhesPedido(pedidoId);
            const modalDetalhes = document.getElementById('modalDetalhes');
            if (modalDetalhes) showModal(modalDetalhes);
        });
    });


    // ---- Formulário de contato (modo modal) ----
    const formContato = document.getElementById('formContato');
    if (formContato) {
        formContato.addEventListener('submit', async (e) => {
            e.preventDefault();
            await registrarTentativa();
        });
    }

    // ---- Modal resumo mensal ----
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
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;
    document.body.appendChild(modalResumo);
    modalResumo.querySelector('.modal-close').addEventListener('click', () => hideModal(modalResumo));

    // ---- Fechar modais clicando fora ----
    const modalDetalhesEl = document.getElementById('modalDetalhes');
    window.addEventListener('click', (e) => {
        if (e.target === modalResumo) hideModal(modalResumo);
        if (e.target === modalDetalhesEl) hideModal(modalDetalhesEl);
    });

    // ---- Clique em células P1/P2 no Resumo ----
    document.querySelectorAll('.celula-prioridade span').forEach(span => {
        span.style.cursor = 'pointer';
        span.addEventListener('click', async () => {
            const prioridade = span.classList.contains('p1') ? 'P1' : 'P2';
            const exame = span.closest('tr').querySelector('td strong').textContent;
            const mes = span.closest('td').dataset.mes;

            try {
                const response = await fetch(`/api/exames_detalhes?exame=${encodeURIComponent(exame)}&mes=${encodeURIComponent(mes)}&prioridade=${prioridade}`);
                if (!response.ok) throw new Error('Erro ao buscar detalhes');
                const detalhes = await response.json();

                const tbody = modalResumo.querySelector('tbody');
                modalResumo.querySelector('h3').textContent = `${exame} - ${mes} (${prioridade})`;
                tbody.innerHTML = detalhes.map(d => `
                    <tr data-id="${d.id}">
                        <td>${d.protocolo}</td>
                        <td>${d.nome_paciente}</td>
                        <td>${d.unidade_nome}</td>
                        <td>${d.data_registro}</td>
                        <td>${d.status}</td>
                        <td><button class="btn btn-sm btn-primary btn-agendar">Agendar</button></td>
                    </tr>
                `).join('');

                // ---- Clique no botão Agendar (redirecionar para nova página) ----
                tbody.querySelectorAll('.btn-agendar').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const row = btn.closest('tr');
                        const pedidoId = row ? row.dataset.id : null;

                        if (!pedidoId) {
                            console.error('❌ Erro: linha sem data-id.');
                            alert('Não foi possível identificar o pedido.');
                            return;
                        }

                        console.log('➡️ Redirecionando para:', `/agendar/${pedidoId}`);
                        hideModal(modalResumo);
                        window.location.href = `/agendar/${pedidoId}`;
                    });
                });
                showModal(modalResumo);
            } catch (error) {
                console.error('Erro ao carregar detalhes:', error);
                alert('Erro ao carregar detalhes dos exames.');
            }
        });
    });
});


// ---- Funções auxiliares ----
async function carregarDetalhesPedido(pedidoId) {
     if (!pedidoId) {
        console.error('❌ carregarDetalhesPedido chamado sem ID.');
        return;
    }
    try {
        const response = await fetch(`/api/pedidos/${pedidoId}`);
        const dados = await response.json();
        if (dados.erro) return alert(dados.erro);

        const modal = document.getElementById('modalDetalhes');
        modal.querySelector('#paciente-nome').textContent = dados.nome_paciente || '';
        modal.querySelector('#paciente-telefone').textContent = dados.telefone || '';
        modal.querySelector('#paciente-unidade').textContent = dados.unidade || '';
        modal.querySelector('#exame-tipo').textContent = dados.exame_nome || '';
        modal.querySelector('#exame-prioridade').textContent = dados.prioridade || '';
        modal.querySelector('#exame-status').textContent = dados.status_agendamento || '';
        modal.querySelector('#pedidoId').value = pedidoId;

        const listaContatos = modal.querySelector('#lista-contatos');
        listaContatos.innerHTML = '';
        (dados.historico_contatos || []).forEach(c => {
            const div = document.createElement('div');
            div.className = 'contato-item mb-2 p-2 border rounded';
            div.innerHTML = `<strong>${new Date(c.data_hora).toLocaleString()}</strong> - ${c.resultado}<br><small>${c.observacao || ''}</small>`;
            listaContatos.appendChild(div);
        });

        const progress = (dados.tentativas_contato || 0) / 3 * 100;
        const bar = modal.querySelector('.progress-bar');
        bar.style.width = `${progress}%`;
        bar.style.backgroundColor = progress >= 100 ? '#dc3545' : '#007bff';

        // Corrigido: redirecionamento de "Agendar"
        const btnAgendar = modal.querySelector('#btnAbrirAgendar');
        if (btnAgendar) {
            btnAgendar.onclick = (e) => {
                e.preventDefault();
                hideModal(modal);
                window.location.href = `/agendar/${pedidoId}`;
            };
        }

        // Atualizar data/hora atual
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        modal.querySelector('#dataHora').value = now.toISOString().slice(0, 16);
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do pedido.');
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pedido_id: pedidoId, data_hora: dataHora, resultado, observacao })
        });
        const dados = await response.json();
        if (dados.erro) return alert(dados.erro);
        await carregarDetalhesPedido(pedidoId);
    } catch (error) {
        console.error('Erro ao registrar tentativa:', error);
        alert('Erro ao registrar tentativa de contato.');
    }
}
