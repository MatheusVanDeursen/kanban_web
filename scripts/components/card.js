import { kanbanFetch } from '../api/kanbanFetch.js';
import { setupCardDragEvents } from '../utils/dragDrop.js';
import { playSound } from '../utils/audioManager.js';

export function createCardElement(cardData, columnColor) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('draggable', 'true');
    card.dataset.cardId = cardData.id;
    card.dataset.position = cardData.position;
    card.style.borderTopColor = columnColor;

    card.innerHTML = `
        <button class="delete-card-btn" title="Excluir Card">X</button>
        <textarea class="card-title" rows="1" placeholder="Título">${cardData.title}</textarea>
        <textarea class="card-content" placeholder="Adicione uma descrição...">${cardData.content || ''}</textarea>
    `;

    setupCardDragEvents(card);
    
    card.querySelector('.delete-card-btn').addEventListener('click', async () => {
        playSound('trash_card');
        await kanbanFetch(`/cards/${card.dataset.cardId}`, 'DELETE');
        card.remove();
    });
    
    card.querySelectorAll('textarea').forEach(setupTextarea);
    setupCardUpdate(card);

    return card;
}

function setupCardUpdate(card) {
    const titleInput = card.querySelector('.card-title');
    const contentInput = card.querySelector('.card-content');
    
    let lastTitle = titleInput.value;
    let lastContent = contentInput.value;

    const save = async () => {
        if (titleInput.value === lastTitle && contentInput.value === lastContent) return;
        try {
            await kanbanFetch(`/cards/${card.dataset.cardId}`, 'PATCH', { title: titleInput.value, content: contentInput.value });
            lastTitle = titleInput.value;
            lastContent = contentInput.value;
        } catch (error) { console.error("Erro ao atualizar card"); }
    };

    titleInput.addEventListener('blur', save);
    contentInput.addEventListener('blur', save);
}

export function setupTextarea(textarea) { 
    const autoResize = function() { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; };
    textarea.addEventListener('input', autoResize); 
    autoResize.call(textarea); setTimeout(() => autoResize.call(textarea), 0);
}