const syncIndicator = document.createElement('div');
syncIndicator.className = 'sync-status';
document.body.appendChild(syncIndicator);
let syncTimeout;

export function updateSyncStatus(state, message) {
    clearTimeout(syncTimeout);
    syncIndicator.className = `sync-status show ${state}`;
    
    let icon = '';
    if (state === 'saving') icon = '<i class="fas fa-sync-alt fa-spin-custom"></i>';
    if (state === 'saved') icon = '<i class="fas fa-check"></i>';
    if (state === 'error') icon = '<i class="fas fa-exclamation-triangle"></i>';
    
    syncIndicator.innerHTML = `${icon} <span>${message}</span>`;

    // Esconde a mensagem de sucesso ou erro após 3 segundos
    if (state === 'saved' || state === 'error') {
        syncTimeout = setTimeout(() => {
            syncIndicator.classList.remove('show');
        }, 3000);
    }
}

// Callbacks padronizados para plugar no httpClient
export const onSaving = () => updateSyncStatus('saving', 'Salvando...');
export const onSaved = () => updateSyncStatus('saved', 'Salvo na nuvem');
export const onError = () => updateSyncStatus('error', 'Ocorreu um erro.');