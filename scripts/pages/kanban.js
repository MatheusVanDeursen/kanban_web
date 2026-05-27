import { getToken, removeToken } from '../api/httpClient.js';
import { kanbanFetch } from '../api/kanbanFetch.js';
import { updateSyncStatus } from '../components/syncIndicator.js';
import { initTheme } from '../utils/theme.js';
import { createColumnElement } from '../components/column.js';
import { createCardElement } from '../components/card.js';
import { initDragDropPolyfill, setupMainContainerDragEvents } from '../utils/dragDrop.js';
import { setSoundEnabled, preloadSounds, playSound } from '../utils/audioManager.js';

if (!getToken()) window.location.href = 'login.html';

let defaultColumnColor = '#e6b905';
let confirmBeforeDelete = true;
let newCardPosition = 'bottom';

initDragDropPolyfill();
preloadSounds();
initTheme('theme-toggle', null, (theme) => {
    kanbanFetch('/users/me/preferences', 'PATCH', { theme }).catch(e => console.error("Erro ao salvar tema:", e));
});
document.addEventListener('DOMContentLoaded', loadBoard);

async function loadBoard() {
    const container = document.querySelector('.container');
    setupMainContainerDragEvents(container);
    
    try {
        updateSyncStatus('saving', 'Conectando ao servidor...');
        const columns = await kanbanFetch('/columns/board');
        
        container.innerHTML = '';
        
        const addColBtn = document.createElement('div');
        addColBtn.className = 'col add-column-col';
        addColBtn.id = 'add-column-btn';
        addColBtn.innerHTML = '<span>+ Nova Coluna</span>';
        
        columns.forEach(colData => {
            const colElement = createColumnElement(colData, { confirmBeforeDelete, newCardPosition });
            container.appendChild(colElement);
            
            colData.cards.forEach(cardData => {
                const cardElement = createCardElement(cardData, colData.color);
                colElement.querySelector('.content').appendChild(cardElement);
            });
        });

        container.appendChild(addColBtn);
        
        addColBtn.onclick = async () => {
            playSound('create');
            const newColData = await kanbanFetch('/columns', 'POST', { title: 'Nova Coluna', color: defaultColumnColor });
            const colElement = createColumnElement(newColData, { confirmBeforeDelete, newCardPosition });
            addColBtn.parentNode.insertBefore(colElement, addColBtn);
        };

        updateSyncStatus('saved', 'Quadro carregado');
        playSound('loaded');
    } catch (error) {
        updateSyncStatus('error', 'Falha na conexão');
        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-server error-icon"></i>
                <h2 class="error-title">Erro de Conexão</h2>
                <p class="error-message">Não conseguimos alcançar o servidor.<br>Verifique sua internet ou se a API está online.</p>
                <button id="retry-load-btn" class="error-retry-btn"><i class="fas fa-sync-alt"></i> Tentar Novamente</button>
            </div>
        `;
        document.getElementById('retry-load-btn')?.addEventListener('click', loadBoard);
    }
}

// --- Menu Header ---
const settingsBtn = document.getElementById('settings-toggle-btn');
const settingsMenu = document.getElementById('settings-menu');
settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); });
document.addEventListener('click', () => settingsMenu.classList.remove('active'));
settingsMenu.addEventListener('click', (e) => e.stopPropagation());

kanbanFetch('/users/me').then(userData => {
    document.getElementById('display-email').innerText = userData.email;
}).catch(() => console.error("Erro ao buscar dados do usuário"));

kanbanFetch('/users/me/preferences').then(prefs => {
    if (prefs && prefs.theme) {
        const isLight = prefs.theme === 'light';
        localStorage.setItem('theme', prefs.theme);
        if (isLight) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn && themeBtn.type === 'checkbox') {
            themeBtn.checked = !isLight;
        }
    }
    if (prefs && prefs.defaultColor) {
        defaultColumnColor = prefs.defaultColor;
    }
    if (prefs && prefs.confirmBeforeDelete !== undefined) {
        confirmBeforeDelete = prefs.confirmBeforeDelete;
    }
    if (prefs && prefs.newCardPosition) {
        newCardPosition = prefs.newCardPosition;
    }
    if (prefs && prefs.soundEnabled !== undefined) {
        setSoundEnabled(prefs.soundEnabled);
    }
    if (prefs && prefs.compactMode !== undefined) {
        if (prefs.compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
    }
}).catch(() => console.error("Erro ao buscar preferências"));

document.getElementById('logout-btn').addEventListener('click', () => {
    removeToken(); window.location.href = 'login.html';
});

document.getElementById('account-btn').addEventListener('click', (e) => { e.preventDefault(); window.location.assign('account.html'); });