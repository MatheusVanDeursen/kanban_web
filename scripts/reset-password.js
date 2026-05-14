const API_URL = 'http://localhost:3000/api';

// Elementos do DOM
const resetForm = document.getElementById('reset-form');
const messageBox = document.getElementById('message-box');
const themeBtn = document.getElementById('theme-toggle');
const themeIcon = themeBtn.querySelector('i');
const backBtn = document.getElementById('back-to-login');

// Captura o token da URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = `message-box ${isError ? 'error' : 'success'}`;
    messageBox.style.display = 'block';
}

// ==========================================
// LÓGICA DO TEMA (REUTILIZADA)
// ==========================================
const savedTheme = localStorage.getItem('theme');
const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

function applyTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light-mode');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    } else {
        document.body.classList.remove('light-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
}

if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    applyTheme(true);
}

themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    themeIcon.classList.toggle('fa-sun', !isLight);
    themeIcon.classList.toggle('fa-moon', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// ==========================================
// LÓGICA DE REDEFINIÇÃO
// ==========================================

// Verifica se o token existe ao carregar
if (!token) {
    showMessage('Token de recuperação não encontrado ou inválido.', true);
    resetForm.style.display = 'none';
}

backBtn.addEventListener('click', () => {
    window.location.href = 'login.html';
});

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showMessage('As senhas não coincidem.', true);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Erro ao redefinir senha.', true);
            return;
        }

        showMessage('Senha atualizada com sucesso! Redirecionando...', false);
        
        // Redireciona para o login após 2 segundos
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2500);

    } catch (error) {
        showMessage('Erro ao conectar com o servidor.', true);
    }
});