document.addEventListener('DOMContentLoaded', () => {
    // pedidoId pode vir do template ou da URL
    let id = typeof pedidoId !== 'undefined' && pedidoId ? pedidoId : null;
    if (!id) {
        // tentar extrair do caminho /agendar/<id>
        const parts = window.location.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (!isNaN(Number(last))) id = Number(last);
    }

    if (!id) {
        alert('ID do pedido não encontrado na URL.');
        return;
    }

    const elNome = document.getElementById('ag-nome');
    const elTelefone = document.getElementById('ag-telefone');
    const elUnidade = document.getElementById('ag-unidade');
    const elExame = document.getElementById('ag-exame');
    const elPrioridade = document.getElementById('ag-prioridade');
    const elStatus = document.getElementById('ag-status');
    const elSub = document.getElementById('subtitulo');
    const tentativasList = document.getElementById('tentativas-list');
    const form = document.getElementById('formNovaTentativa');

    async function loadDados() {
        try {
            const res = await fetch(`/api/pedidos/${id}`);
            if (!res.ok) throw new Error('Erro ao buscar pedido');
            const dados = await res.json();

            elNome.textContent = dados.nome_paciente || '';
            elTelefone.textContent = dados.telefone || '';
            elUnidade.textContent = dados.unidade || dados.unidade_nome || '';
            elExame.textContent = dados.exame_nome || '';
            elPrioridade.textContent = dados.prioridade || '';
            elStatus.textContent = dados.status_agendamento || dados.status || '';
            elSub.textContent = `Pedido: ${dados.protocolo || ''}`;

            // preencher lista de tentativas
            tentativasList.innerHTML = '';
            const historico = dados.historico_contatos || [];
            for (let i = 0; i < 3; i++) {
                const item = document.createElement('div');
                item.className = 'p-2 mb-2 border rounded';
                if (historico[i]) {
                    const h = historico[i];
                    item.innerHTML = `<strong>Tentativa ${i+1}:</strong> ${h.data_hora ? new Date(h.data_hora).toLocaleString() : ''} - ${h.resultado} ${h.observacao ? ('<br><small>'+h.observacao+'</small>') : ''}`;
                } else {
                    item.innerHTML = `<strong>Tentativa ${i+1}:</strong> —`;
                }
                tentativasList.appendChild(item);
            }

            // desabilitar form se já finalizado
            const tentCount = dados.tentativas_contato || 0;
            if (tentCount >= 3 || ['Agendado','Cancelado por não contato'].includes(dados.status_agendamento)) {
                form.querySelectorAll('input,select,button').forEach(i => i.disabled = true);
            } else {
                form.querySelectorAll('input,select,button').forEach(i => i.disabled = false);
            }

            // preencher pedidoId oculto
            const hidden = document.getElementById('ag-pedidoId');
            if (hidden) hidden.value = id;

            // preencher dataHora default
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            const dt = now.toISOString().slice(0,16);
            const dtInput = document.getElementById('ag-dataHora');
            if (dtInput && !dtInput.value) dtInput.value = dt;

        } catch (err) {
            console.error(err);
            alert('Erro ao carregar dados do pedido. Veja console.');
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data_hora = document.getElementById('ag-dataHora').value;
        const resultado = document.getElementById('ag-resultado').value;
        const observacao = document.getElementById('ag-observacao').value;

        try {
            const res = await fetch('/api/registrar-contato', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({pedido_id: id, data_hora, resultado, observacao})
            });
            const json = await res.json();
            if (!res.ok) {
                alert(json.erro || 'Erro ao registrar tentativa');
                return;
            }
            // reload data
            await loadDados();
            if (json.status_atualizado) {
                alert('Status finalizado: ' + (resultado === 'Atendeu' ? 'Agendado' : 'Cancelado por não contato'));
                // optionally redirect back to list
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao registrar tentativa. Veja console.');
        }
    });

    loadDados();
});
