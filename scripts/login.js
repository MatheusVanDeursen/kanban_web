const API_URL = 'https://api-kanban.matheusvandeursen.com/api';

// Elementos do DOM
const authForm = document.getElementById('auth-form');
const toggleBtn = document.getElementById('toggle-btn');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const formSubtitle = document.getElementById('form-subtitle');
const toggleText = document.getElementById('toggle-text');
const themeBtn = document.getElementById('login-theme-toggle');
const themeIcon = themeBtn.querySelector('i');

// Novos Elementos
const passwordGroup = document.getElementById('password-group');
const passwordInput = document.getElementById('password');
const forgotLink = document.getElementById('forgot-password-link');
const messageBox = document.getElementById('message-box');
const socialSeparator = document.getElementById('social-separator');
const socialWrapper = document.getElementById('social-wrapper');

let currentState = 'login'; // Pode ser: 'login', 'register', 'forgot'

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
// LÓGICA DE ESTADO (LOGIN / REGISTER / FORGOT)
// ==========================================
function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = `message-box ${isError ? 'error' : 'success'}`;
    messageBox.style.display = 'block';
    // Esconde a mensagem automaticamente após 5 segundos
    setTimeout(() => { messageBox.style.display = 'none'; }, 5000);
}

function setFormState(state) {
    currentState = state;
    messageBox.style.display = 'none'; // Limpa mensagens anteriores
    
    if (state === 'login') {
        formTitle.innerText = 'Entrar';
        formSubtitle.innerText = 'Bem-vindo de volta ao seu quadro!';
        submitBtn.innerText = 'Entrar';
        toggleText.innerText = 'Não tem uma conta?';
        toggleBtn.innerText = 'Cadastre-se';
        
        passwordGroup.style.display = 'block';
        passwordInput.required = true;
        forgotLink.style.display = 'block';
        socialSeparator.style.display = 'flex';
        socialWrapper.style.display = 'flex';
    } 
    else if (state === 'register') {
        formTitle.innerText = 'Cadastre-se';
        formSubtitle.innerText = 'Crie sua conta e comece a organizar.';
        submitBtn.innerText = 'Criar Conta';
        toggleText.innerText = 'Já tem uma conta?';
        toggleBtn.innerText = 'Entrar';
        
        passwordGroup.style.display = 'block';
        passwordInput.required = true;
        forgotLink.style.display = 'none';
        socialSeparator.style.display = 'flex';
        socialWrapper.style.display = 'flex';
    } 
    else if (state === 'forgot') {
        formTitle.innerText = 'Recuperar Senha';
        formSubtitle.innerText = 'Enviaremos um link para o seu e-mail.';
        submitBtn.innerText = 'Enviar Link';
        toggleText.innerText = 'Lembrou a senha?';
        toggleBtn.innerText = 'Voltar para o Login';
        
        // Esconde a senha e o botão do Google
        passwordGroup.style.display = 'none';
        passwordInput.required = false; 
        forgotLink.style.display = 'none';
        socialSeparator.style.display = 'none';
        socialWrapper.style.display = 'none';
    }
}

// Eventos de clique para trocar de tela
toggleBtn.addEventListener('click', () => {
    if (currentState === 'login' || currentState === 'forgot') setFormState('register');
    else setFormState('login');
});

forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    setFormState('forgot');
});

// ==========================================
// LÓGICA DO FORMULÁRIO (LOGIN / REGISTER / FORGOT)
// ==========================================
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    
    let endpoint = '';
    let bodyData = { email };

    // 1. Define o caminho correto para a API baseado na tela atual
    if (currentState === 'login') {
        endpoint = '/users/login';
        bodyData.password = password;
    } else if (currentState === 'register') {
        endpoint = '/users/signup'; 
        bodyData.password = password;
    } else if (currentState === 'forgot') {
        endpoint = '/users/request-reset';
    }

    try {
        // 2. Faz a requisição para o servidor
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Ocorreu um erro.', true);
            return;
        }

        // 3. Executa a ação de sucesso correta
        if (currentState === 'login') {
            localStorage.setItem('kanban_token', data.token);
            window.location.href = 'kanban.html';
        } 
        else if (currentState === 'register') {
            setFormState('login'); 
            showMessage('Conta criada com sucesso! Faça seu login abaixo.', false);
            passwordInput.value = ''; 
        } 
        else if (currentState === 'forgot') {
            setFormState('login'); 
            showMessage('Instruções enviadas! Verifique sua caixa de entrada.', false);
            passwordInput.value = ''; 
        }

    } catch (error) {
        showMessage('Erro ao conectar com o servidor. Tente novamente.', true);
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