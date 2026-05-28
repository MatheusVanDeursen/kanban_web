// Obtém o token se existir (para usuários logados)
const TOKEN = localStorage.getItem('kanban_token');

// Aplica tema salvo
function applyTheme() {
    const savedTheme = localStorage.getItem('kanban_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

// Aplica modo compacto salvo
function applyCompactMode() {
    const savedCompactMode = localStorage.getItem('kanban_compact_mode');
    if (savedCompactMode === 'true') {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
}

// Define a data de atualização no header
function setUpdateDate() {
    const updateElement = document.getElementById('update-date');
    if (updateElement) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        updateElement.textContent = formattedDate;
    }
}

// Ajusta o botão de voltar baseado no histórico
function adjustBackButton() {
    const backBtn = document.querySelector('.back-btn');
    if (backBtn && !TOKEN) {
        // Se não estiver logado, volta para login ao invés de quadro
        backBtn.href = 'login.html';
        backBtn.textContent = '';
        const icon = document.createElement('i');
        icon.className = 'fas fa-arrow-left';
        backBtn.appendChild(icon);
        backBtn.appendChild(document.createTextNode(' Voltar'));
    }
}

// Inicializa a página
function initializePrivacyPolicy() {
    applyTheme();
    applyCompactMode();
    setUpdateDate();
    adjustBackButton();
}

// Executa ao carregar
document.addEventListener('DOMContentLoaded', initializePrivacyPolicy);
