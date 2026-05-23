export function showModal(contentHtml, isDanger, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = `custom-modal ${isDanger ? 'danger' : ''}`;
    modal.innerHTML = contentHtml;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    const passInput = modal.querySelector('#modal-password-input');
    if (passInput) passInput.focus();

    const closeModal = () => { overlay.remove(); modal.remove(); };
    overlay.addEventListener('click', closeModal);
    
    const cancelBtn = modal.querySelector('.btn-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    modal.querySelector('.btn-confirm').addEventListener('click', () => {
        const passValue = passInput ? passInput.value : null;
        closeModal();
        onConfirm(passValue);
    });
}

export function promptPasswordModal(title, message, isDanger, onConfirm) {
    showModal(`
        <h3>${title}</h3>
        <p>${message}</p>
        <input type="password" id="modal-password-input" class="modal-input" placeholder="Digite sua senha atual">
        <div class="modal-buttons">
            <button class="btn-secondary btn-cancel">Cancelar</button>
            <button class="${isDanger ? 'btn-danger' : 'btn-primary'} btn-confirm">Confirmar</button>
        </div>
    `, isDanger, onConfirm);
}

export function alertModal(title, message, isError = false) {
    return new Promise((resolve) => {
        showModal(`
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="modal-buttons">
                <button class="${isError ? 'btn-danger' : 'btn-primary'} btn-confirm">OK</button>
            </div>
        `, isError, resolve);
    });
}