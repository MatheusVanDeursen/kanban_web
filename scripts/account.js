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
    document.getElementById('btn-update-email').addEventListener('click', async () => {
        const newEmail = document.getElementById('new-email-input').value;
        const currentPassword = document.getElementById('current-password-input').value;

        if (!newEmail) return alert("Por favor, digite o novo e-mail.");

        try {
            const btn = document.getElementById('btn-update-email');
            btn.innerText = "Salvando...";
            
            const response = await apiFetch('/users/me', 'PUT', { 
                newEmail: newEmail, 
                currentPassword: currentPassword 
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

    // 3. ATUALIZAR SENHA
    document.getElementById('btn-update-password').addEventListener('click', async () => {
        const newPassword = document.getElementById('new-password-input').value;
        const currentPassword = document.getElementById('current-password-input').value;

        if (!newPassword) return alert("Por favor, digite a nova senha.");

        try {
            const btn = document.getElementById('btn-update-password');
            btn.innerText = "Salvando...";

            // Enviamos o currentSavedEmail junto, pois o controller exige a presença do campo email
            const response = await apiFetch('/users/me', 'PUT', { 
                newEmail: currentSavedEmail, 
                newPassword: newPassword,
                currentPassword: currentPassword 
            });
            
            alert("Senha alterada com sucesso!");
            document.getElementById('new-password-input').value = '';
            document.getElementById('current-password-input').value = '';
            btn.innerText = "Alterar Senha";
        } catch (error) {
            alert(error.message);
            document.getElementById('btn-update-password').innerText = "Alterar Senha";
        }
    });

    // 4. EXCLUIR CONTA
    document.getElementById('btn-delete-account').addEventListener('click', async () => {
        const currentPassword = document.getElementById('current-password-input').value;

        const confirmText = "Você tem certeza ABSOLUTA? Todos os seus cards e colunas serão apagados para sempre. Esta ação não pode ser desfeita.";
        if (!confirm(confirmText)) return;

        try {
            await apiFetch('/users/me', 'DELETE', { currentPassword: currentPassword });
            alert("Sua conta foi excluída permanentemente. Até logo!");
            localStorage.removeItem('kanban_token');
            window.location.href = 'login.html';
        } catch (error) {
            alert(error.message);
        }
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