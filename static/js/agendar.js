document.addEventListener("DOMContentLoaded", async () => {
    console.log("📞 Script agendar_pedido.js carregado");

    const pedidoId = document.getElementById("pedidoId")?.value;
    if (!pedidoId) {
        console.error("❌ ID do pedido não encontrado!");
        return;
    }

    await carregarDetalhesAgendamento(pedidoId);

    const form = document.getElementById("formContato");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await registrarTentativaContato(pedidoId);
    });
});

async function carregarDetalhesAgendamento(pedidoId) {
    try {
        const response = await fetch(`/api/pedidos/${pedidoId}`);
        const dados = await response.json();

        if (!response.ok || dados.erro) {
            alert("Erro ao carregar dados do paciente.");
            console.error(dados.erro);
            return;
        }

        // Preencher dados básicos do paciente
        document.getElementById("paciente-nome").textContent = dados.nome_paciente || "-";
        document.getElementById("paciente-telefone").textContent = dados.telefone || "-";
        document.getElementById("paciente-unidade").textContent = dados.unidade || "-";
        document.getElementById("exame-tipo").textContent = dados.exame_nome || "-";
        document.getElementById("exame-prioridade").textContent = dados.prioridade || "-";
        document.getElementById("exame-status").textContent = dados.status_agendamento || "-";

        // Exibir histórico de contatos
        const lista = document.getElementById("lista-contatos");
        lista.innerHTML = "";

        (dados.historico_contatos || []).forEach((item) => {
            const div = document.createElement("div");
            div.classList.add("contato-item");
            div.innerHTML = `
                <strong>${new Date(item.data_hora).toLocaleString()}</strong> - ${item.resultado}
                ${item.observacao ? `<br><small>${item.observacao}</small>` : ""}
            `;
            lista.appendChild(div);
        });

        // Atualizar progresso (3 tentativas máx.)
        const tentativas = dados.tentativas_contato || 0;
        const progresso = Math.min((tentativas / 3) * 100, 100);
        const barra = document.querySelector(".progress-bar");
        barra.style.width = `${progresso}%`;
        barra.style.backgroundColor = tentativas >= 3 ? "#dc3545" : "#007bff";
        barra.textContent = `${tentativas}/3`;

        // Bloquear formulário se já chegou no limite
        const form = document.getElementById("formContato");
        const btn = document.getElementById("btnRegistrar");
        if (tentativas >= 3 || dados.status_agendamento === "Agendado") {
            form.classList.add("disabled");
            btn.disabled = true;
            alert("⚠️ Limite de tentativas atingido. Pedido será cancelado.");
        }

    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
        alert("Erro de conexão ao buscar os detalhes.");
    }
}

async function registrarTentativaContato(pedidoId) {
    const dataHora = document.getElementById("dataHora").value;
    const resultado = document.getElementById("resultado").value;
    const observacao = document.getElementById("observacao").value;

    if (!dataHora || !resultado) {
        alert("⚠️ Preencha os campos obrigatórios!");
        return;
    }

    try {
        const response = await fetch("/api/registrar-contato", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pedido_id: pedidoId,
                data_hora: dataHora,
                resultado: resultado,
                observacao: observacao
            })
        });

        const dados = await response.json();

        if (!response.ok || dados.erro) {
            alert(dados.erro || "Erro ao registrar tentativa.");
            return;
        }

        // Atualiza interface
        await carregarDetalhesAgendamento(pedidoId);

        // Limpa o campo de observação
        document.getElementById("observacao").value = "";

        if (dados.status_atualizado) {
            alert(`✅ Status atualizado: ${dados.status_atualizado}`);
        }

    } catch (error) {
        console.error("Erro ao registrar tentativa:", error);
        alert("Erro de conexão com o servidor.");
    }
}
