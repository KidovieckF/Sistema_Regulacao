// Mostrar/ocultar altura/peso conforme o exame
const exameSelect = document.getElementById('exame');
const deps = document.getElementById('dependencias');
exameSelect.addEventListener('change', () => {
    const opt = exameSelect.selectedOptions[0];
    const precisaAltura = opt.dataset.altura === '1';
    const precisaPeso = opt.dataset.peso === '1';
    deps.style.display = (precisaAltura || precisaPeso) ? 'block' : 'none';
});

// Lógica de modal e envio via fetch
const form = document.getElementById('form-recepcao');
const modal = document.getElementById('modalSucesso');
const btnNovo = document.getElementById('btnNovo');
const btnFechar = document.getElementById('btnFechar');
const textoProtocolo = document.getElementById('textoProtocolo');
const linkAnexo = document.getElementById('linkAnexo');
const anexoInput = document.getElementById('anexo');

// Criar área de preview logo após o input se não existir
let previewContainer = document.getElementById('anexoPreview');
if (!previewContainer) {
    previewContainer = document.createElement('div');
    previewContainer.id = 'anexoPreview';
    previewContainer.className = 'anexo-preview';
    previewContainer.style.display = 'none';
    anexoInput.parentNode.appendChild(previewContainer);
}

// Formata tamanho legível
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

anexoInput.addEventListener('change', () => {
    const file = anexoInput.files[0];
    if (!file) {
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';
        return;
    }

    // Somente pdf
    const name = file.name;
    if (!name.toLowerCase().endsWith('.pdf')) {
        alert('Apenas arquivos PDF são permitidos.');
        anexoInput.value = '';
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';
        return;
    }

    // Monta preview
    previewContainer.innerHTML = `
        <div class="anexo-icon">PDF</div>
        <div class="anexo-meta">
            <div class="anexo-filename">${name}</div>
            <div class="anexo-filesize">${formatBytes(file.size)}</div>
        </div>
        <button type="button" class="anexo-remove" title="Remover anexo">&times;</button>
    `;
    previewContainer.style.display = 'inline-flex';

    // Remove handler
    previewContainer.querySelector('.anexo-remove').addEventListener('click', () => {
        anexoInput.value = '';
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';
    });
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const response = await fetch(window.location.pathname, {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
    const data = await response.json();
    modal.style.display = 'flex';
    textoProtocolo.textContent = `✅ Pedido registrado com sucesso!\nProtocolo: ${data.protocolo}`;
    // Mostrar link do anexo se houver
    if (data.anexo_url) {
        linkAnexo.style.display = 'block';
        linkAnexo.innerHTML = `<strong>Anexo:</strong> <a href="${data.anexo_url}" target="_blank">Visualizar PDF</a> <span class="anexo-attached-badge">Anexo enviado</span>`;
    } else {
        linkAnexo.style.display = 'none';
        linkAnexo.innerHTML = '';
    }
    form.reset();
    deps.style.display = 'none';
    // limpar preview
    anexoInput.value = '';
    previewContainer.style.display = 'none';
    previewContainer.innerHTML = '';
    } else {
        alert('❌ Ocorreu um erro ao registrar o pedido.');
    }
});

btnNovo.addEventListener('click', () => {
    modal.style.display = 'none';
    form.scrollIntoView({ behavior: 'smooth' });
});

btnFechar.addEventListener('click', () => {
    window.location.reload();
});

modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.style.display = 'none';
});
