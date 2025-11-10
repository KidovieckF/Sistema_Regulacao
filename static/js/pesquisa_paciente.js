document.addEventListener("DOMContentLoaded", () => {
    const campo = document.getElementById("campoPesquisa");
    const sugestoesBox = document.getElementById("sugestoes");

    let timeout = null;

    campo.addEventListener("input", () => {
        const termo = campo.value.trim();
        clearTimeout(timeout);

        if (termo.length < 2) {
            sugestoesBox.innerHTML = "";
            sugestoesBox.style.display = "none";
            return;
        }

        timeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/sugestoes_pacientes?q=${encodeURIComponent(termo)}`);
                if (!response.ok) return;
                const nomes = await response.json();

                if (nomes.length === 0) {
                    sugestoesBox.innerHTML = "";
                    sugestoesBox.style.display = "none";
                    return;
                }

                sugestoesBox.innerHTML = nomes
                    .map(nome => `<div class="sugestao-item">${nome}</div>`)
                    .join("");
                sugestoesBox.style.display = "block";

                document.querySelectorAll(".sugestao-item").forEach(item => {
                    item.addEventListener("click", () => {
                        campo.value = item.textContent;
                        sugestoesBox.style.display = "none";
                    });
                });
            } catch (err) {
                console.error("Erro ao buscar sugestões:", err);
            }
        }, 300);
    });

    document.addEventListener("click", (e) => {
        if (!sugestoesBox.contains(e.target) && e.target !== campo) {
            sugestoesBox.style.display = "none";
        }
    });
});
