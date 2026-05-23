import { kanbanFetch } from '../api/kanbanFetch.js';
import { createCardElement, setupTextarea } from './card.js';
import { setupColumnDragEvents, setupContainerEvents } from '../utils/dragDrop.js';

export function createColumnElement(colData) {
    const col = document.createElement('div');
    col.classList.add('col');
    col.dataset.colId = colData.id;
    col.dataset.position = colData.position;

    col.innerHTML = `
        <div class="title">
            <input type="color" class="col-color-picker" value="${colData.color}" title="Cor da Coluna">
            <div class="col-drag-handle" title="Arraste para mover a coluna">&#8942;&#8942;</div>
            <textarea class="col-title" rows="1" placeholder="Título">${colData.title}</textarea>
            <button class="delete-col-btn" title="Excluir Coluna">X</button>
        </div>
        <div class="content"></div>
        <button class="add-card-btn">+</button>
    `;

    setupContainerEvents(col.querySelector('.content'));
    setupColumnDragEvents(col);
    setupTextarea(col.querySelector('.col-title'));
    setupColumnUpdate(col);
    
    col.querySelector('.col-color-picker').addEventListener('input', (e) => {
        col.querySelectorAll('.card').forEach(card => card.style.borderTopColor = e.target.value);
    });

    col.querySelector('.add-card-btn').addEventListener('click', async () => {
        const color = col.querySelector('.col-color-picker').value;
        const newCardData = await kanbanFetch('/cards', 'POST', { column_id: col.dataset.colId, title: '', content: '' });
        const newCard = createCardElement(newCardData, color);
        col.querySelector('.content').appendChild(newCard);
    });

    col.querySelector('.delete-col-btn').addEventListener('click', async () => {
        const hasCards = col.querySelectorAll('.card').length > 0;
        if (hasCards) {
            showCustomConfirm(col, async () => {
                await kanbanFetch(`/columns/${col.dataset.colId}`, 'DELETE');
                col.remove();
            });
        } else {
            await kanbanFetch(`/columns/${col.dataset.colId}`, 'DELETE');
            col.remove();
        }
    });

    return col;
}

function showCustomConfirm(col, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'delete-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'delete-modal';
    modal.innerHTML = `
        <h3>Excluir Coluna?</h3>
        <p>Esta coluna contém cards. Tem certeza que deseja excluí-la permanentemente?</p>
        <div class="delete-modal-buttons">
            <button class="btn-cancel">Cancelar</button>
            <button class="btn-confirm">Excluir</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    col.classList.add('highlight-for-deletion');
    
    const closeConfirm = () => { overlay.remove(); modal.remove(); col.classList.remove('highlight-for-deletion'); };
    overlay.addEventListener('click', closeConfirm);
    modal.querySelector('.btn-cancel').addEventListener('click', closeConfirm);
    modal.querySelector('.btn-confirm').addEventListener('click', () => { closeConfirm(); onConfirm(); });
}

function setupColumnUpdate(col) {
    const titleInput = col.querySelector('.col-title');
    const colorInput = col.querySelector('.col-color-picker');
    let lastTitle = titleInput.value, lastColor = colorInput.value;
    
    const save = async () => {
        if (titleInput.value === lastTitle && colorInput.value === lastColor) return;
        try {
            await kanbanFetch(`/columns/${col.dataset.colId}`, 'PATCH', { title: titleInput.value, color: colorInput.value, position: parseFloat(col.dataset.position) });
            lastTitle = titleInput.value; lastColor = colorInput.value;
        } catch (error) { console.error("Erro ao atualizar coluna"); }
    };
    
    titleInput.addEventListener('blur', save); colorInput.addEventListener('change', save);
}