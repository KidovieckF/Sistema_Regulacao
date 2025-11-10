document.addEventListener("DOMContentLoaded", () => {
    console.log("📋 Script pedidos.js carregado");

    // ----------------------------
    // 🔔 Função auxiliar para mostrar mensagem temporária
    // ----------------------------
    function mostrarToast(mensagem, tipo = "sucesso") {
        let toast = document.createElement("div");
        toast.className = `toast ${tipo}`;
        toast.textContent = mensagem;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add("show"), 50);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ----------------------------
    // 🧩 Atualização de separação (Cross/Município)
    // ----------------------------
    const formsSeparacao = document.querySelectorAll(".form-separacao");
    formsSeparacao.forEach(form => {
        const select = form.querySelector("select");
        select.addEventListener("change", async () => {
            const formData = new FormData(form);

            try {
                const response = await fetch(window.location.pathname, {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("✅ Separação atualizada:", data);
                    mostrarToast("Separação atualizada com sucesso ✅");
                } else {
                    console.error("❌ Erro ao atualizar separação");
                    mostrarToast("Erro ao atualizar separação ❌", "erro");
                }
            } catch (err) {
                console.error("Erro:", err);
                mostrarToast("Falha na conexão com o servidor ❌", "erro");
            }
        });
    });

    // ----------------------------
    // 📤 Enviar pedido à regulação
    // ----------------------------
    const formsEnvio = document.querySelectorAll(".form-enviar-regulacao");
    formsEnvio.forEach(form => {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            // 🔄 Agora buscamos a linha (não mais um card)
            const linha = form.closest("tr");

            try {
                const response = await fetch(window.location.pathname, {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.sucesso) {
                        // 🔥 Faz a linha desaparecer com animação
                        if (linha) {
                            // Linha de detalhes (onde o botão está)
                            const detalhe = linha;
                            // Linha principal está logo acima
                            const principal = detalhe.previousElementSibling;

                            // Anima a remoção da principal (se existir)
                            if (principal && principal.classList.contains("linha-pedido")) {
                                principal.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                                principal.style.opacity = "0";
                                principal.style.transform = "scale(0.98)";
                            }

                            // Anima o detalhe
                            detalhe.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                            detalhe.style.opacity = "0";
                            detalhe.style.transform = "scale(0.98)";

                            setTimeout(() => {
                                if (principal) principal.remove();
                                detalhe.remove();
                            }, 400);
                        }
                        mostrarToast("Pedido encaminhado ao médico regulador ✅");
                    } else {
                        mostrarToast("Erro ao processar pedido ❌", "erro");
                    }
                } else {
                    mostrarToast("Erro ao comunicar com o servidor ❌", "erro");
                }
            } catch (error) {
                console.error("Erro:", error);
                mostrarToast("Falha na conexão com o servidor ❌", "erro");
            }
        });
    });
});
