import { kanbanFetch } from '../api/kanbanFetch.js';
import { playSound } from './audioManager.js';

export function initDragDropPolyfill() {
    if (window.MobileDragDrop) {
        window.MobileDragDrop.polyfill({
            holdToDrag: 200, 
            dragImageTranslateOverride: window.MobileDragDrop.scrollBehaviourDragImageTranslateOverride
        });
        document.addEventListener('dragenter', e => e.preventDefault());
        window.addEventListener('touchmove', function() {}, {passive: false});
    }
}

export function setupCardDragEvents(card) {
    let originalColId = null, originalPosition = null, originalNextSibling = null, originalIndex = null;

    card.addEventListener('dragstart', () => {
        playSound('pick');
        card.classList.add('dragging-card');
        const currentCol = card.closest('.col');
        originalColId = currentCol.dataset.colId;
        originalPosition = card.dataset.position;
        originalNextSibling = card.nextElementSibling;
        const cardsInColumn = [...currentCol.querySelectorAll('.card')];
        originalIndex = cardsInColumn.indexOf(card);
    });

    card.addEventListener('dragend', async (e) => {
        e.stopPropagation();
        card.classList.remove('dragging-card');
        
        const col = card.closest('.col');
        if (!col) return;

        const contentDiv = col.querySelector('.content');
        const cardsInColumn = [...contentDiv.querySelectorAll('.card')];
        const currentIndex = cardsInColumn.indexOf(card);

        if (col.dataset.colId === originalColId && currentIndex === originalIndex) return; 

        playSound('drop');
        card.style.borderTopColor = col.querySelector('.col-color-picker').value;

        let newPos = 1.0;
        if (cardsInColumn.length > 1) {
            if (currentIndex === 0) newPos = parseFloat(cardsInColumn[1].dataset.position) / 2;
            else if (currentIndex === cardsInColumn.length - 1) newPos = parseFloat(cardsInColumn[currentIndex - 1].dataset.position) + 1.0;
            else newPos = (parseFloat(cardsInColumn[currentIndex - 1].dataset.position) + parseFloat(cardsInColumn[currentIndex + 1].dataset.position)) / 2;
        }
        
        card.dataset.position = newPos;
        
        try {
            await kanbanFetch(`/cards/${card.dataset.cardId}/move`, 'PATCH', { column_id: col.dataset.colId, position: newPos });
        } catch (error) {
            const originalColElement = document.querySelector(`.col[data-col-id="${originalColId}"]`);
            if (originalColElement) {
                const originalContentDiv = originalColElement.querySelector('.content');
                if (originalNextSibling && originalNextSibling.parentNode === originalContentDiv) {
                    originalContentDiv.insertBefore(card, originalNextSibling);
                } else {
                    originalContentDiv.appendChild(card);
                }
                card.style.borderTopColor = originalColElement.querySelector('.col-color-picker').value;
                card.dataset.position = originalPosition;
            }
        }
    });
}

export function setupContainerEvents(container) {
    container.addEventListener('dragenter', e => e.preventDefault());
    container.addEventListener('dragover', e => {
        const dragging = document.querySelector('.dragging-card');
        if (!dragging) return;
        e.preventDefault();

        const threshold = 60, speed = 15;
        const rect = container.getBoundingClientRect();
        
        if (e.clientY - rect.top < threshold) container.scrollTop -= speed;
        else if (rect.bottom - e.clientY < threshold) container.scrollTop += speed;

        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement == null) container.appendChild(dragging);
        else container.insertBefore(dragging, afterElement);
    });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.card:not(.dragging-card)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

export function setupColumnDragEvents(col) {
    const handle = col.querySelector('.col-drag-handle');
    let originalNextSibling = null, originalPosition = null, originalIndex = null;

    handle.addEventListener('mousedown', () => col.setAttribute('draggable', 'true'));
    handle.addEventListener('touchstart', () => col.setAttribute('draggable', 'true'), { passive: true });
    
    col.addEventListener('dragstart', (e) => { 
        if(e.target === col) {
            playSound('pick');
            col.classList.add('dragging-col'); 
            originalNextSibling = col.nextElementSibling;
            originalPosition = col.dataset.position;
            const columnsInBoard = [...col.parentNode.querySelectorAll('.col:not(.add-column-col)')];
            originalIndex = columnsInBoard.indexOf(col);
        }
    });
    
    col.addEventListener('dragend', async () => { 
        col.classList.remove('dragging-col'); 
        col.setAttribute('draggable', 'false'); 

        const container = col.parentNode;
        const columnsInBoard = [...container.querySelectorAll('.col:not(.add-column-col)')];
        const currentIndex = columnsInBoard.indexOf(col);

        if (currentIndex === originalIndex) return;
        
        playSound('toggle');
        if (columnsInBoard.length > 1) {
            if (currentIndex === 0) newPos = parseFloat(columnsInBoard[1].dataset.position) / 2;
            else if (currentIndex === columnsInBoard.length - 1) newPos = parseFloat(columnsInBoard[currentIndex - 1].dataset.position) + 1.0;
            else newPos = (parseFloat(columnsInBoard[currentIndex - 1].dataset.position) + parseFloat(columnsInBoard[currentIndex + 1].dataset.position)) / 2;
        }
        col.dataset.position = newPos;

        try {
            await kanbanFetch(`/columns/${col.dataset.colId}`, 'PATCH', { 
                title: col.querySelector('.col-title').value,
                color: col.querySelector('.col-color-picker').value,
                position: newPos 
            });
        } catch (error) {
            if (originalNextSibling && originalNextSibling.parentNode === container) container.insertBefore(col, originalNextSibling);
            else container.insertBefore(col, document.getElementById('add-column-btn'));
            col.dataset.position = originalPosition;
        }
    });
}

function getDragAfterColElement(container, x) {
  const draggableElements = [...container.querySelectorAll('.col:not(.dragging-col):not(.add-column-col)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

export function setupMainContainerDragEvents(mainContainer) {
    mainContainer.addEventListener('dragenter', e => e.preventDefault());
    mainContainer.addEventListener('dragover', e => {
        const draggingCol = document.querySelector('.dragging-col');
        if (!draggingCol) return;
        e.preventDefault();

        const threshold = 80, speed = 15;
        const rect = mainContainer.getBoundingClientRect();
        
        if (e.clientX - rect.left < threshold) mainContainer.scrollLeft -= speed; 
        else if (rect.right - e.clientX < threshold) mainContainer.scrollLeft += speed; 
        
        const afterElement = getDragAfterColElement(mainContainer, e.clientX);
        const addColumnBtn = document.getElementById('add-column-btn');

        if (afterElement == null) {
            mainContainer.insertBefore(draggingCol, addColumnBtn);
        } else {
            mainContainer.insertBefore(draggingCol, afterElement);
        }
    });
}