const API_URL = 'http://localhost:3000/api';
const TOKEN = localStorage.getItem('kanban_token');

// Ativa o suporte a toque no celular
MobileDragDrop.polyfill({
    // Permite que o usuário segure o dedo por 250ms para começar a arrastar
    // Isso evita que a tela arraste acidentalmente quando o usuário só quer fazer scroll
    holdToDrag: 250, 
    dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride
});

// Impede que a tela atualize (Pull-to-refresh) ou role acidentalmente durante o drag
window.addEventListener('touchmove', function() {}, {passive: false});

if (!TOKEN) {
    window.location.href = 'login.html';
}

async function apiFetch(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (response.status === 401) {
        localStorage.removeItem('kanban_token');
        window.location.href = 'login.html';
    }
    if (!response.ok) throw new Error('Falha na API');
    return response.json();
}

document.addEventListener('DOMContentLoaded', loadBoard);

async function loadBoard() {
    try {
        const columns = await apiFetch('/columns/board');
        const container = document.querySelector('.container');
        const addColBtn = document.getElementById('add-column-btn');

        // Limpa o que for necessário mantendo o botão de adicionar
        const existingCols = container.querySelectorAll('.col:not(.add-column-col)');
        existingCols.forEach(c => c.remove());
        
        columns.forEach(colData => {
            const colElement = createColumnElement(colData);
            container.insertBefore(colElement, addColBtn);
            
            colData.cards.forEach(cardData => {
                const cardElement = createCardElement(cardData, colData.color);
                colElement.querySelector('.content').appendChild(cardElement);
            });
        });

        setupAddColumnButton();

        setTimeout(() => {
            document.querySelectorAll('textarea').forEach(ta => autoResize.call(ta));
        }, 10);

    } catch (error) {
        console.error("Erro ao carregar o quadro.", error);
    }
}

function createColumnElement(colData) {
    const col = document.createElement('div');
    col.classList.add('col');
    col.dataset.colId = colData.id;
    col.dataset.position = colData.position;

    col.innerHTML = `
        <div class="title">
            <input type="color" class="col-color-picker" value="${colData.color}" title="Cor da Coluna">
            <div class="col-drag-handle" title="Arraste para mover a coluna">&#8942;&#8942;</div>
            <textarea class="col-title" rows="1" placeholder="Nome da coluna">${colData.title}</textarea>
            <button class="delete-col-btn" title="Excluir Coluna">X</button>
        </div>
        <div class="content"></div>
        <button class="add-card-btn">+</button>
    `;

    setupContainerEvents(col.querySelector('.content'));
    setupAddCardButton(col.querySelector('.add-card-btn'));
    setupDeleteColumnButton(col.querySelector('.delete-col-btn'));
    setupColorPicker(col.querySelector('.col-color-picker'));
    setupColumnDragEvents(col);
    
    const titleTextarea = col.querySelector('.col-title');
    setupTextarea(titleTextarea);
    setupColumnUpdate(col);

    return col;
}

function createCardElement(cardData, columnColor) {
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
    setupDeleteCardButton(card.querySelector('.delete-card-btn'));
    
    card.querySelectorAll('textarea').forEach(setupTextarea);
    setupCardUpdate(card);

    return card;
}

function setupAddColumnButton() {
    const btn = document.getElementById('add-column-btn');
    btn.onclick = async () => {
        const newColData = await apiFetch('/columns', 'POST', { title: 'Nova Coluna', color: '#e6b905' });
        const colElement = createColumnElement(newColData);
        btn.parentNode.insertBefore(colElement, btn);
    };
}

function setupAddCardButton(btn) {
    btn.addEventListener('click', async () => {
        const col = btn.closest('.col');
        const color = col.querySelector('.col-color-picker').value;
        const newCardData = await apiFetch('/cards', 'POST', { 
            column_id: col.dataset.colId, 
            title: 'Novo Card', 
            content: 'Descrição...' 
        });
        const newCard = createCardElement(newCardData, color);
        col.querySelector('.content').appendChild(newCard);
    });
}

function setupDeleteColumnButton(btn) {
    btn.addEventListener('click', async () => {
        if (!confirm('Excluir esta coluna?')) return;
        const col = btn.closest('.col');
        await apiFetch(`/columns/${col.dataset.colId}`, 'DELETE');
        col.remove();
    });
}

function setupDeleteCardButton(btn) {
    btn.addEventListener('click', async () => {
        const card = btn.closest('.card');
        await apiFetch(`/cards/${card.dataset.cardId}`, 'DELETE');
        card.remove();
    });
}

function setupColumnUpdate(col) {
    const titleInput = col.querySelector('.col-title');
    const colorInput = col.querySelector('.col-color-picker');
    const save = async () => {
        await apiFetch(`/columns/${col.dataset.colId}`, 'PATCH', {
            title: titleInput.value,
            color: colorInput.value
        });
    };
    titleInput.addEventListener('blur', save);
    colorInput.addEventListener('change', save);
}

function setupCardUpdate(card) {
    const titleInput = card.querySelector('.card-title');
    const contentInput = card.querySelector('.card-content');
    const save = async () => {
        await apiFetch(`/cards/${card.dataset.cardId}`, 'PATCH', {
            title: titleInput.value,
            content: contentInput.value
        });
    };
    titleInput.addEventListener('blur', save);
    contentInput.addEventListener('blur', save);
}

function setupCardDragEvents(card) {
    card.addEventListener('dragstart', () => card.classList.add('dragging-card'));
    
    card.addEventListener('dragend', async () => {
        card.classList.remove('dragging-card');
        
        const col = card.closest('.col');
        if (!col) return;

        // CORREÇÃO: Atualiza a cor do topo do card ao soltar na nova coluna!
        const colorPicker = col.querySelector('.col-color-picker');
        if (colorPicker) {
            card.style.borderTopColor = colorPicker.value;
        }

        const contentDiv = col.querySelector('.content');
        const cardsInColumn = [...contentDiv.querySelectorAll('.card')];
        const index = cardsInColumn.indexOf(card);
        let newPos = 1.0;
        
        if (cardsInColumn.length > 1) {
            if (index === 0) {
                newPos = parseFloat(cardsInColumn[1].dataset.position) / 2;
            } else if (index === cardsInColumn.length - 1) {
                newPos = parseFloat(cardsInColumn[index - 1].dataset.position) + 1.0;
            } else {
                newPos = (parseFloat(cardsInColumn[index - 1].dataset.position) + parseFloat(cardsInColumn[index + 1].dataset.position)) / 2;
            }
        }
        
        card.dataset.position = newPos;
        await apiFetch(`/cards/${card.dataset.cardId}/move`, 'PATCH', { 
            column_id: col.dataset.colId, 
            position: newPos 
        });
    });
}

function autoResize() { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; }

function setupTextarea(textarea) { 
    textarea.addEventListener('input', autoResize); autoResize.call(textarea); 
    setTimeout(() => autoResize.call(textarea), 0);
}

function setupColorPicker(picker) {
    picker.addEventListener('input', (e) => {
        const col = picker.closest('.col');
        const cards = col.querySelectorAll('.card');
        cards.forEach(card => card.style.borderTopColor = e.target.value);
    });
}

function setupContainerEvents(container) {
    container.addEventListener('dragover', e => {
        const dragging = document.querySelector('.dragging-card');
        if (!dragging) return;
        e.preventDefault();
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

function setupColumnDragEvents(col) {
    const handle = col.querySelector('.col-drag-handle');
    handle.addEventListener('mousedown', () => col.setAttribute('draggable', 'true'));
    col.addEventListener('dragstart', (e) => { if(e.target === col) col.classList.add('dragging-col'); });
    col.addEventListener('dragend', () => { col.classList.remove('dragging-col'); col.setAttribute('draggable', 'false'); });
}

const mainContainer = document.querySelector('.container');
mainContainer.addEventListener('dragover', e => {
    // 1. Lógica de Rolagem Horizontal (Auto-scroll) para toda a tela
    const threshold = 80; // Área (em pixels) nas bordas para ativar o scroll
    const speed = 15;     // Velocidade da rolagem
    const rect = mainContainer.getBoundingClientRect();
    
    // Se o mouse/dedo estiver perto da borda esquerda ou direita, rola a tela
    if (e.clientX - rect.left < threshold) {
        mainContainer.scrollLeft -= speed; 
    } else if (rect.right - e.clientX < threshold) {
        mainContainer.scrollLeft += speed; 
    }

    // 2. Lógica de reordenação das Colunas (só executa se for uma coluna)
    const draggingCol = document.querySelector('.dragging-col');
    if (!draggingCol) return; // Se for um card, a função para por aqui (apenas rola a tela)

    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterColumn(mainContainer, e.clientX);
    const addColumnBtn = document.getElementById('add-column-btn');

    if (afterElement == null || afterElement === addColumnBtn) {
        mainContainer.insertBefore(draggingCol, addColumnBtn);
    } else {
        mainContainer.insertBefore(draggingCol, afterElement);
    }
});

function getDragAfterColumn(container, x) {
    const draggableElements = [...container.querySelectorAll('.col:not(.dragging-col):not(.add-column-col)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}














// 1. Alternar exibição do Menu
const settingsBtn = document.getElementById('settings-toggle-btn');
const settingsMenu = document.getElementById('settings-menu');

settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('active');
});

// Fecha o menu se clicar fora dele
document.addEventListener('click', () => settingsMenu.classList.remove('active'));
settingsMenu.addEventListener('click', (e) => e.stopPropagation());

// 2. Buscar E-mail do Usuário (Usando a rota /me que criamos no início)
async function fetchUserInfo() {
    try {
        const userData = await apiFetch('/users/me'); // Rota que retorna {id, email}
        document.getElementById('display-email').innerText = userData.email;
    } catch (err) {
        console.error("Erro ao buscar dados do usuário");
    }
}
fetchUserInfo();

// 3. Lógica de Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('kanban_token');
    window.location.href = 'login.html';
});

// 4. Lógica de Tema Claro/Escuro
const themeToggle = document.getElementById('theme-toggle');

// 1. Verifica a preferência salva e a preferência do sistema
const savedTheme = localStorage.getItem('theme');
const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

// 2. Aplica o tema inicial (Prioridade: 1º LocalStorage, 2º Sistema)
if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    document.body.classList.add('light-mode');
    themeToggle.checked = true;
}

// 3. Lida com a mudança manual no botão
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
    
    // Força o autoResize para ajustar os textareas no novo tema
    document.querySelectorAll('textarea').forEach(ta => autoResize.call(ta));
});

// Extra: Fica escutando caso o usuário mude o tema do sistema enquanto o site está aberto
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    // Só altera automaticamente se o usuário não tiver forçado uma preferência manual antes
    if (!localStorage.getItem('theme')) {
        if (e.matches) {
            document.body.classList.add('light-mode');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('light-mode');
            themeToggle.checked = false;
        }
    }
});