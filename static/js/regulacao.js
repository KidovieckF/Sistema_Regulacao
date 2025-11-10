document.addEventListener("DOMContentLoaded", () => {
    console.log("⚕️ regulacao.js carregado");

    // Alternância de abas
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`tab-${tab}`).classList.add("active");
        });
    });

    // Expansão da linha
    document.querySelectorAll(".linha-pedido").forEach(linha => {
        linha.addEventListener("click", () => {
            const id = linha.dataset.id;
            const detalhe = document.getElementById(`detalhe-${id}`);
            detalhe.classList.toggle("ativo");
        });
    });

    // Garantir que textareas de motivo não fiquem 'required' por padrão (evita erro de validação quando estão ocultas)
    document.querySelectorAll('.motivo-reprova textarea[name="motivo"]').forEach(t => {
        t.required = false;
    });

    // Exibe e oculta o campo de motivo
    document.querySelectorAll(".btn-reprovar").forEach(botao => {
        botao.addEventListener("click", () => {
            const form = botao.closest("form");
            const campo = form.querySelector(".motivo-reprova");
            const botoes = form.querySelector(".botoes-acoes");
            campo.style.display = "block";
            botoes.style.display = "none";
            const ta = campo.querySelector('textarea[name="motivo"]');
            if (ta) {
                ta.required = true;
                ta.focus();
            }
        });
    });

    document.querySelectorAll(".btn-cancelar-motivo").forEach(botao => {
        botao.addEventListener("click", () => {
            const form = botao.closest("form");
            const campo = form.querySelector(".motivo-reprova");
            const botoes = form.querySelector(".botoes-acoes");
            campo.style.display = "none";
            botoes.style.display = "flex";
            const ta = campo.querySelector('textarea[name="motivo"]');
            if (ta) ta.required = false;
        });
    });

    // Envio via fetch
    document.querySelectorAll(".form-acao").forEach(form => {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Detecta qual botão iniciou o submit (event.submitter) e define o input hidden 'acao'
            const submitter = e.submitter || document.activeElement;
            const acaoInput = form.querySelector('input[name="acao"]');
            let acaoValor = '';

            if (submitter) {
                // prioridade: data-acao attribute, depois name/value
                acaoValor = submitter.dataset && submitter.dataset.acao ? submitter.dataset.acao : (submitter.name && submitter.value ? submitter.value : '');
            }

            if (acaoInput) {
                acaoInput.value = acaoValor;
            }

            // Se for reprovação, garanta que o motivo foi preenchido (validação cliente)
            if (acaoValor === 'reprovar') {
                const motivoField = form.querySelector('textarea[name="motivo"]');
                if (motivoField && !motivoField.value.trim()) {
                    alert('Por favor, informe o motivo da reprovação.');
                    motivoField.focus();
                    return;
                }
            }

            const formData = new FormData(form);
            const linha = form.closest("tr").previousElementSibling; // linha principal
            const detalhe = form.closest("tr"); // detalhe abaixo

            console.log("📤 Enviando:", Object.fromEntries(formData.entries()));

            try {
                const response = await fetch("/regulacao/acao", {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    console.error("❌ Erro HTTP:", response.status, response.statusText);
                    alert("❌ Falha na requisição.");
                    return;
                }

                const data = await response.json();
                console.log("📥 Resposta:", data);

                if (data.sucesso) {
                    linha.remove();
                    detalhe.remove();
                } else {
                    alert(data.mensagem || "Erro ao processar ação.");
                }
            } catch (err) {
                console.error("Erro:", err);
                alert("❌ Erro de conexão com o servidor.");
            }
        });
    });
});
