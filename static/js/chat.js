document.addEventListener("DOMContentLoaded", () => {
    const socket = io();

    // usuario já vem do template
    const input = document.getElementById("chat-input");
    const mensagensDiv = document.getElementById("chat-messages");
    const botao = document.getElementById("btn-enviar");

    socket.on("connect", () => console.log("✅ Conectado ao chat."));

    socket.on("message", (data) => {
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("chat-message");
        
        // Apenas as minhas mensagens ficam à direita
        msgDiv.classList.add(data.usuario === usuario ? "own-message" : "other-message");

        msgDiv.innerHTML = `<div class="chat-bubble">
            <strong>${data.usuario}:</strong> ${data.mensagem}
        </div>`;
        
        mensagensDiv.appendChild(msgDiv);
        mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
    });

    botao.addEventListener("click", enviarMensagem);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") enviarMensagem();
    });

    function enviarMensagem() {
        const texto = input.value.trim();
        if (texto) {
            socket.emit("mensagem", { usuario, mensagem: texto });
            input.value = "";
        }
    }
});
