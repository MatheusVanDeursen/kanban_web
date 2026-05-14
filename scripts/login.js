const API_URL = 'http://localhost:3000/api';
const authForm = document.getElementById('auth-form');
const toggleBtn = document.getElementById('toggle-btn');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const formSubtitle = document.getElementById('form-subtitle');
const toggleText = document.getElementById('toggle-text');

let isLogin = true;

toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    formTitle.innerText = isLogin ? 'Entrar' : 'Cadastre-se';
    formSubtitle.innerText = isLogin ? 'Bem-vindo de volta ao seu quadro!' : 'Crie sua conta e comece a organizar.';
    submitBtn.innerText = isLogin ? 'Entrar' : 'Criar Conta';
    toggleText.innerText = isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?';
    toggleBtn.innerText = isLogin ? 'Cadastre-se' : 'Entrar';
});

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
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor.');
    }
});

// --- Lógica de Tema Claro/Escuro ---
const loginThemeToggleBtn = document.getElementById('login-theme-toggle');
const themeIcon = loginThemeToggleBtn.querySelector('i');

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
}

let isLightMode = savedTheme === 'light' || (!savedTheme && systemPrefersLight);
applyTheme(isLightMode);

loginThemeToggleBtn.addEventListener('click', () => {
    isLightMode = !isLightMode;
    applyTheme(isLightMode);
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
});

window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        isLightMode = e.matches;
        applyTheme(isLightMode);
    }
});