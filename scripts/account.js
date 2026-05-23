const API_URL = 'https://api-kanban.matheusvandeursen.com/api';
const TOKEN = localStorage.getItem('kanban_token');

// Redireciona se não estiver logado
if (!TOKEN) {
    window.location.href = 'login.html';
}

// Variável global para armazenar o email atual (usado para driblar a validação da API ao mudar só a senha)
let currentSavedEmail = '';

// Função auxiliar para fazer chamadas à API
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
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        // Se o token estiver inválido, expulsa o usuário
        if (response.status === 401 && !data.error) {
            localStorage.removeItem('kanban_token');
            window.location.href = 'login.html';
        }
        throw new Error(data.error || 'Ocorreu um erro no servidor.');
    }
    
    return data;
}

// --- Sistema de Modais Customizados ---
function showModal(contentHtml, isDanger, onConfirm) {
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
    modal.querySelector('.btn-cancel').addEventListener('click', closeModal);
    modal.querySelector('.btn-confirm').addEventListener('click', () => {
        const passValue = passInput ? passInput.value : null;
        closeModal();
        onConfirm(passValue);
    });
}

function promptPasswordModal(title, message, isDanger, onConfirm) {
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

function confirmDangerModal(title, message, onConfirm) {
    showModal(`
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="modal-buttons">
            <button class="btn-secondary btn-cancel">Cancelar</button>
            <button class="btn-danger btn-confirm">Prosseguir</button>
        </div>
    `, true, onConfirm);
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. CARREGAR DADOS INICIAIS
    try {
        // Busca Email
        const user = await apiFetch('/users/me');
        currentSavedEmail = user.email;
        document.getElementById('user-email-display').innerText = user.email;

        // Busca Estatísticas
        const stats = await apiFetch('/users/me/stats');
        document.getElementById('stats-columns').innerText = stats.totalColumns || 0;
        document.getElementById('stats-cards').innerText = stats.totalCards || 0;
    } catch (error) {
        alert("Erro ao carregar os dados da conta: " + error.message);
    }

    // 2. ATUALIZAR EMAIL
    document.getElementById('btn-update-email').addEventListener('click', () => {
        const newEmail = document.getElementById('new-email-input').value;

        if (!newEmail) return alert("Por favor, digite o novo e-mail.");

        promptPasswordModal('Confirmar Identidade', 'Para alterar seu e-mail, informe sua senha atual:', false, async (currentPassword) => {
            try {
                const btn = document.getElementById('btn-update-email');
                btn.innerText = "Salvando...";
                
                const response = await apiFetch('/users/me', 'PUT', { 
                    newEmail: newEmail, 
                    currentPassword: currentPassword || ""
                });
                
                alert("E-mail atualizado com sucesso! (Verifique sua caixa de entrada)");
                currentSavedEmail = response.user.email;
                document.getElementById('user-email-display').innerText = currentSavedEmail;
                document.getElementById('new-email-input').value = '';
                btn.innerText = "Atualizar Email";
            } catch (error) {
                alert(error.message);
                document.getElementById('btn-update-email').innerText = "Atualizar Email";
            }
        });
    });

    // 3. ATUALIZAR SENHA
    document.getElementById('btn-update-password').addEventListener('click', () => {
        const newPassword = document.getElementById('new-password-input').value;

        if (!newPassword) return alert("Por favor, digite a nova senha.");

        promptPasswordModal('Confirmar Identidade', 'Para alterar sua senha, informe sua senha atual:', false, async (currentPassword) => {
            try {
                const btn = document.getElementById('btn-update-password');
                btn.innerText = "Salvando...";

                const response = await apiFetch('/users/me', 'PUT', { 
                    newEmail: currentSavedEmail, 
                    newPassword: newPassword,
                    currentPassword: currentPassword || ""
                });
                
                alert("Senha alterada com sucesso!");
                document.getElementById('new-password-input').value = '';
                btn.innerText = "Alterar Senha";
            } catch (error) {
                alert(error.message);
                document.getElementById('btn-update-password').innerText = "Alterar Senha";
            }
        });
    });

    // 4. EXCLUIR CONTA
    document.getElementById('btn-delete-account').addEventListener('click', () => {
        confirmDangerModal('Atenção!', 'Você tem certeza ABSOLUTA? Todos os seus cards e colunas serão apagados para sempre. Esta ação não pode ser desfeita.', () => {
            promptPasswordModal('Exclusão de Conta', 'Para confirmar a exclusão permanente, digite sua senha:', true, async (currentPassword) => {
                try {
                    await apiFetch('/users/me', 'DELETE', { currentPassword: currentPassword || "" });
                    alert("Sua conta foi excluída permanentemente. Até logo!");
                    localStorage.removeItem('kanban_token');
                    window.location.href = 'login.html';
                } catch (error) {
                    alert(error.message);
                }
            });
        });
    });

    // 5. TEMA CLARO/ESCURO (Reutilizando sua lógica)
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.body.classList.add('light-mode');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    });
});