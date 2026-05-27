const API_URL = 'https://api-kanban.matheusvandeursen.com/api';
const TOKEN = localStorage.getItem('kanban_token');

// Importa o gerenciador de áudio
import { setSoundEnabled, playSound } from '../utils/audioManager.js';

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
    const cancelBtn = modal.querySelector('.btn-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
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

function alertModal(title, message, isError = false) {
    return new Promise((resolve) => {
        showModal(`
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="modal-buttons">
                <button class="${isError ? 'btn-danger' : 'btn-primary'} btn-confirm">OK</button>
            </div>
        `, isError, resolve);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. CARREGAR DADOS INICIAIS
    try {
        // Busca Email
        const user = await apiFetch('/users/me');
        currentSavedEmail = user.email;
        document.getElementById('user-email-display').innerText = user.email;

        // ==========================================
        // GESTÃO DE VÍNCULO DO GOOGLE
        // ==========================================
        const unlinkBtn = document.getElementById('btn-unlink-google');
        const linkWrapper = document.getElementById('btn-link-google-wrapper');

        if (user.auth_provider === 'google') {
            // Se a conta já é Google, permite desvincular
            unlinkBtn.style.display = 'block';
            linkWrapper.style.display = 'none';
        } else {
            // Se for local, exibe o botão para vincular
            unlinkBtn.style.display = 'none';
            linkWrapper.style.display = 'block';

            // Inicializa o componente de autenticação do Google
            google.accounts.id.initialize({
                client_id: "628971780221-ootclb01igm7r0fej0nqssvd2olurclj.apps.googleusercontent.com",
                callback: async (googleResponse) => {
                    try {
                        // Envia o token do Google para a nova rota protegida de vínculo
                        await apiFetch('/users/me/link-google', 'POST', { token: googleResponse.credential });
                        await alertModal("Sucesso", "Conta do Google vinculada com sucesso!");
                        window.location.reload(); // Recarrega para atualizar o estado da tela
                    } catch (err) {
                        alertModal("Erro", err.message, true);
                    }
                }
            });

            // Renderiza o botão nativo do Google dentro da nossa div
            google.accounts.id.renderButton(
                linkWrapper,
                { theme: "outline", size: "medium", text: "signin_with" }
            );
        }

        // Evento do botão de Desvincular
        unlinkBtn.addEventListener('click', () => {
            promptPasswordModal(
                'Desvincular Conta', 
                'Tem certeza que deseja desvincular sua conta do Google? Terá de usar o seu e-mail e senha local para entrar. Por favor, confirme digitando sua senha:', 
                true, 
                async (currentPassword) => {
                    try {
                        await apiFetch('/users/me/unlink-google', 'POST', { currentPassword: currentPassword || "" });
                        await alertModal("Sucesso", "Conta do Google desvinculada com sucesso! O seu acesso agora é 100% local.");
                        window.location.reload();
                    } catch (error) {
                        alertModal("Erro", error.message, true);
                    }
                }
            );
        });

        // Busca Estatísticas
        const stats = await apiFetch('/users/me/stats');
        document.getElementById('stats-columns').innerText = stats.totalColumns || 0;
        document.getElementById('stats-cards').innerText = stats.totalCards || 0;
        if (stats.memberSince) {
            const date = new Date(stats.memberSince);
            const formattedDate = date.toLocaleDateString('pt-BR');
            document.getElementById('stats-date').innerText = formattedDate;
        }

        // ==========================================
        // CARREGAMENTO DE PREFERÊNCIAS
        // ==========================================
        const preferences = await apiFetch('/users/me/preferences');
        
        // Garante valores padrão caso a API não retorne algo específico
        const prefs = {
            theme: preferences.theme || 'dark',
            confirmBeforeDelete: preferences.confirmBeforeDelete ?? true,
            soundEnabled: preferences.soundEnabled ?? false,
            compactMode: preferences.compactMode ?? false,
            newCardPosition: preferences.newCardPosition || 'bottom',
            defaultColor: preferences.defaultColor || '#e6b905'
        };

        // Preenche a interface com os dados do banco
        const prefTheme = document.getElementById('pref-theme');
        if (prefTheme) prefTheme.checked = prefs.theme === 'dark';

        const prefConfirm = document.getElementById('pref-confirm');
        if (prefConfirm) prefConfirm.checked = prefs.confirmBeforeDelete;

        const prefSound = document.getElementById('pref-sound');
        if (prefSound) prefSound.checked = prefs.soundEnabled;

        const prefCompact = document.getElementById('pref-compact');
        if (prefCompact) prefCompact.checked = prefs.compactMode;

        const prefCardPos = document.getElementById('pref-card-pos');
        if (prefCardPos) prefCardPos.value = prefs.newCardPosition;

        const prefColor = document.getElementById('pref-color');
        if (prefColor) prefColor.value = prefs.defaultColor;

        // Aplica o tema instantaneamente na tela de conta para refletir o banco de dados
        if (prefs.theme === 'light') {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
        
        // Aplica o modo compacto instantaneamente na tela de conta
        if (prefs.compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
        
    } catch (error) {
        alertModal("Erro", "Erro ao carregar os dados da conta: " + error.message, true);
    }

    // 2. ATUALIZAR EMAIL
    document.getElementById('btn-update-email').addEventListener('click', () => {
        const newEmail = document.getElementById('new-email-input').value;

        if (!newEmail) {
            alertModal("Atenção", "Por favor, digite o novo e-mail.", true);
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            alertModal("Atenção", "Por favor, digite um formato de e-mail válido.", true);
            return;
        }

        promptPasswordModal('Confirmar Identidade', 'Para alterar seu e-mail, informe sua senha atual:', false, async (currentPassword) => {
            try {
                const btn = document.getElementById('btn-update-email');
                btn.innerText = "Salvando...";
                
                const response = await apiFetch('/users/me', 'PUT', { 
                    newEmail: newEmail, 
                    currentPassword: currentPassword || ""
                });
                
                await alertModal("Sucesso", "E-mail atualizado com sucesso! (Verifique sua caixa de entrada)");
                currentSavedEmail = response.user.email;
                document.getElementById('user-email-display').innerText = currentSavedEmail;
                document.getElementById('new-email-input').value = '';
                btn.innerText = "Atualizar Email";
            } catch (error) {
                alertModal("Erro", error.message, true);
                document.getElementById('btn-update-email').innerText = "Atualizar Email";
            }
        });
    });

    // 3. ATUALIZAR SENHA
    document.getElementById('btn-update-password').addEventListener('click', () => {
        const newPassword = document.getElementById('new-password-input').value;

        if (!newPassword) {
            alertModal("Atenção", "Por favor, digite a nova senha.", true);
            return;
        }
        
        if (newPassword.length < 6) {
            alertModal("Atenção", "A nova senha deve ter pelo menos 6 caracteres.", true);
            return;
        }

        promptPasswordModal('Confirmar Identidade', 'Para alterar sua senha, informe sua senha atual:', false, async (currentPassword) => {
            try {
                const btn = document.getElementById('btn-update-password');
                btn.innerText = "Salvando...";

                const response = await apiFetch('/users/me', 'PUT', { 
                    newEmail: currentSavedEmail, 
                    newPassword: newPassword,
                    currentPassword: currentPassword || ""
                });
                
                await alertModal("Sucesso", "Senha alterada com sucesso!");
                document.getElementById('new-password-input').value = '';
                btn.innerText = "Alterar Senha";
            } catch (error) {
                alertModal("Erro", error.message, true);
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
                    await alertModal("Conta Excluída", "Sua conta foi excluída permanentemente. Até logo!");
                    localStorage.removeItem('kanban_token');
                    window.location.href = 'login.html';
                } catch (error) {
                    alertModal("Erro", error.message, true);
                }
            });
        });
    });

    // ==========================================
    // SALVAMENTO DE PREFERÊNCIAS (API)
    // ==========================================
    // Função genérica que atualiza uma única preferência de forma inteligente no banco
    async function updatePreference(key, value) {
        try {
            await apiFetch('/users/me/preferences', 'PATCH', { [key]: value });
            
            // Tratamento especial para o tema (muda na hora e salva no localStorage para o carregamento inicial ser rápido)
            if (key === 'theme') {
                if (value === 'light') {
                    document.body.classList.add('light-mode');
                    localStorage.setItem('theme', 'light');
                } else {
                    document.body.classList.remove('light-mode');
                    localStorage.setItem('theme', 'dark');
                }
            }
            
            // Sincroniza a preferência de som com o audioManager
            if (key === 'soundEnabled') {
                setSoundEnabled(value);
            }
            
            // Aplicar modo compacto em tempo real
            if (key === 'compactMode') {
                if (value) {
                    document.body.classList.add('compact-mode');
                } else {
                    document.body.classList.remove('compact-mode');
                }
            }
        } catch (error) {
            console.error(`Erro ao salvar preferência ${key}:`, error);
        }
    }

    // Escutadores de Evento: Disparam a atualização na API sempre que o usuário altera um valor
    const prefThemeEl = document.getElementById('pref-theme');
    if (prefThemeEl) {
        prefThemeEl.addEventListener('change', (e) => {
            updatePreference('theme', e.target.checked ? 'dark' : 'light');
            playSound('switch');
        });
    }

    const prefConfirmEl = document.getElementById('pref-confirm');
    if (prefConfirmEl) {
        prefConfirmEl.addEventListener('change', (e) => { updatePreference('confirmBeforeDelete', e.target.checked); playSound('switch'); });
    }

    const prefSoundEl = document.getElementById('pref-sound');
    if (prefSoundEl) {
        prefSoundEl.addEventListener('change', (e) => {
            // Salva a preferência e, se estiver ativando, toca o som de confirmação
            updatePreference('soundEnabled', e.target.checked).then(() => { if (e.target.checked) playSound('switch'); });
        });
    }

    const prefCompactEl = document.getElementById('pref-compact');
    if (prefCompactEl) {
        prefCompactEl.addEventListener('change', (e) => { updatePreference('compactMode', e.target.checked); playSound('switch'); });
    }

    const prefCardPosEl = document.getElementById('pref-card-pos');
    if (prefCardPosEl) {
        prefCardPosEl.addEventListener('change', (e) => { updatePreference('newCardPosition', e.target.value); playSound('switch'); });
    }
    
    // Para o input de cor, usamos 'change' em vez de 'input' para não sobrecarregar a API com chamadas enquanto o usuário arrasta o mouse
    const prefColorEl = document.getElementById('pref-color');
    if (prefColorEl) {
        prefColorEl.addEventListener('change', (e) => { updatePreference('defaultColor', e.target.value); playSound('switch'); });
    }

    // ==========================================
    // EXPORTAÇÃO DE DADOS (DOWNLOAD JSON)
    // ==========================================
    document.getElementById('btn-export-data').addEventListener('click', async () => {
        try {
            const btn = document.getElementById('btn-export-data');
            btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Exportando...';

            // Faz a requisição protegida para a API
            const response = await fetch(`${API_URL}/users/me/export`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });

            if (!response.ok) throw new Error('Falha ao gerar o arquivo de exportação.');

            // Transforma a resposta em um arquivo de download (Blob)
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Cria um link invisível e simula o clique para iniciar o download
            const a = document.createElement('a');
            a.href = url;
            a.download = `kanban_backup_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            
            // Limpa a memória do navegador
            a.remove();
            window.URL.revokeObjectURL(url);
            
            btn.innerHTML = '<i class="fas fa-download"></i> Exportar JSON';
        } catch (error) {
            alertModal("Erro", "Erro ao exportar dados: " + error.message, true);
            document.getElementById('btn-export-data').innerHTML = '<i class="fas fa-download"></i> Exportar JSON';
        }
    });


});