const API_URL = 'http://localhost:3000/api';

// Elementos do DOM
const authForm = document.getElementById('auth-form');
const toggleBtn = document.getElementById('toggle-btn');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const formSubtitle = document.getElementById('form-subtitle');
const toggleText = document.getElementById('toggle-text');
const themeBtn = document.getElementById('login-theme-toggle');
const themeIcon = themeBtn.querySelector('i');

let isLogin = true;

// ==========================================
// LÓGICA DO TEMA (CLARO/ESCURO)
// ==========================================
const savedTheme = localStorage.getItem('theme');
const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

function applyTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light-mode');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        document.body.classList.remove('light-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    // Re-renderiza o botão do Google com a cor certa, caso a função já esteja disponível
    if (typeof renderGoogleButton === 'function') {
        renderGoogleButton(isLight);
    }
}

let isLightMode = savedTheme === 'light' || (!savedTheme && systemPrefersLight);
applyTheme(isLightMode);

// Alterna o tema ao clicar no botão
themeBtn.addEventListener('click', () => {
    isLightMode = !isLightMode;
    applyTheme(isLightMode);
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
});

// Escuta mudanças de tema do sistema e aplica caso o usuário não tenha preferência salva
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        isLightMode = e.matches;
        applyTheme(isLightMode);
    }
});

// ==========================================
// LÓGICA DE ALTERNÂNCIA (LOGIN/CADASTRO)
// ==========================================
toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    formTitle.innerText = isLogin ? 'Entrar' : 'Cadastre-se';
    formSubtitle.innerText = isLogin ? 'Bem-vindo de volta ao seu quadro!' : 'Crie sua conta e comece a organizar.';
    submitBtn.innerText = isLogin ? 'Entrar' : 'Criar Conta';
    toggleText.innerText = isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?';
    toggleBtn.innerText = isLogin ? 'Cadastre-se' : 'Entrar';
});

// ==========================================
// LÓGICA DE AUTENTICAÇÃO PADRÃO (EMAIL/SENHA)
// ==========================================
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const endpoint = isLogin ? '/users/login' : '/users/signup';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Ocorreu um erro.');
            return;
        }

        if (isLogin) {
            localStorage.setItem('kanban_token', data.token);
            window.location.href = 'kanban.html';
        } else {
            alert('Conta criada com sucesso! Faça login.');
            isLogin = true;
            toggleBtn.click();
            document.getElementById('password').value = '';
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor.');
    }
});

// ==========================================
// LÓGICA DE AUTENTICAÇÃO SOCIAL (GOOGLE)
// ==========================================
window.handleGoogleCredentialResponse = async (response) => {
    try {
        // Envia o token que o Google gerou para a nossa API validar
        const res = await fetch(`${API_URL}/users/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential }) // 'credential' é o JWT do Google
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Erro ao validar login com Google no servidor.');
            return;
        }

        // Sucesso! O servidor nos devolveu o JWT do Kanban.
        localStorage.setItem('kanban_token', data.token);
        window.location.href = 'kanban.html';
    } catch (error) {
        alert('Erro ao conectar com o servidor durante login social.');
    }
};

function renderGoogleButton(isLightMode) {
    const btnContainer = document.getElementById("google-button-div");
    if (!btnContainer) return;

    // Limpa o botão antigo se existir para re-renderizar com a nova cor
    btnContainer.innerHTML = ''; 

    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.renderButton(
            btnContainer,
            { 
                theme: isLightMode ? 'outline' : 'filled_black', 
                size: "large", 
                width: 320,
                text: "continue_with" 
            } 
        );
    }
}

// Inicializa a biblioteca do Google quando a página carregar
window.onload = function () {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
            // IMPORTANTE: Cole aqui o Client ID que você vai gerar no Google Cloud Console
            client_id: "628971780221-ootclb01igm7r0fej0nqssvd2olurclj.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse
        });
        
        // Renderiza o botão pela primeira vez respeitando o tema
        renderGoogleButton(document.body.classList.contains('light-mode'));
    }
};