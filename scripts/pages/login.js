import { apiFetch, setToken } from '../api/httpClient.js';
import { initTheme } from '../utils/theme.js';

// Elementos do DOM
const authForm = document.getElementById('auth-form');
const toggleBtn = document.getElementById('toggle-btn');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const formSubtitle = document.getElementById('form-subtitle');
const toggleText = document.getElementById('toggle-text');
const passwordGroup = document.getElementById('password-group');
const passwordInput = document.getElementById('password');
const forgotLink = document.getElementById('forgot-password-link');
const messageBox = document.getElementById('message-box');
const socialSeparator = document.getElementById('social-separator');
const socialWrapper = document.getElementById('social-wrapper');

let currentState = 'login';

// Inicializa o Tema globalmente com apenas 1 linha!
initTheme('login-theme-toggle');

function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = `message-box ${isError ? 'error' : 'success'}`;
    messageBox.style.display = 'block';
    setTimeout(() => { messageBox.style.display = 'none'; }, 5000);
}

function setFormState(state) {
    currentState = state;
    messageBox.style.display = 'none';
    
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
        
        passwordGroup.style.display = 'none';
        passwordInput.required = false; 
        forgotLink.style.display = 'none';
        socialSeparator.style.display = 'none';
        socialWrapper.style.display = 'none';
    }
}

toggleBtn.addEventListener('click', () => {
    if (currentState === 'login' || currentState === 'forgot') setFormState('register');
    else setFormState('login');
});

forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    setFormState('forgot');
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    
    let endpoint = currentState === 'login' ? '/users/login' : currentState === 'register' ? '/users/signup' : '/users/request-reset';
    let bodyData = { email };
    if (currentState !== 'forgot') bodyData.password = password;

    try {
        // Chamada de API muito mais limpa usando o módulo
        const data = await apiFetch(endpoint, 'POST', bodyData);

        if (currentState === 'login') {
            setToken(data.token);
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
        showMessage(error.message, true);
    }
});

// ==========================================
// LÓGICA DE AUTENTICAÇÃO SOCIAL (GOOGLE)
// ==========================================
window.handleGoogleCredentialResponse = async (response) => {
    try {
        const data = await apiFetch('/users/auth/google', 'POST', { token: response.credential });
        setToken(data.token);
        window.location.href = 'kanban.html';
    } catch (error) {
        showMessage(error.message || 'Erro ao conectar com o servidor.', true);
    }
};

window.renderGoogleButton = function(isLightMode) {
    const btnContainer = document.getElementById("google-button-div");
    if (!btnContainer) return;

    btnContainer.innerHTML = ''; 
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.renderButton(
            btnContainer,
            { theme: isLightMode ? 'outline' : 'filled_black', size: "large", width: 320, text: "continue_with" } 
        );
    }
};

window.addEventListener('load', () => {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
            // OBS: Mantenha seu Client ID correto aqui
            client_id: "628971780221-ootclb01igm7r0fej0nqssvd2olurclj.apps.googleusercontent.com",
            callback: window.handleGoogleCredentialResponse
        });
        
        window.renderGoogleButton(document.body.classList.contains('light-mode'));
    }
});