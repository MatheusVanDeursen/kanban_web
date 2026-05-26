// Objeto que guarda as instâncias de áudio pré-carregadas para tocarem sem atraso
const sounds = {
    pick: new Audio('assets/sounds/drag.wav'),
    drop: new Audio('assets/sounds/drop.aiff'),
    success: new Audio('assets/sounds/loaded_board.wav'),
    toggle: new Audio('assets/sounds/switch.wav'),
    trash: new Audio('assets/sounds/card_thrash.wav')
};

// Ajusta o volume para não assustar o usuário (0.0 a 1.0)
Object.values(sounds).forEach(audio => audio.volume = 0.5);

// Armazena o estado de áudio habilitado
let soundEnabled = localStorage.getItem('pref_sound') === 'true';

/**
 * Define se os áudios devem ser tocados
 * @param {boolean} enabled - Se true, ativa os efeitos sonoros
 */
export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
    localStorage.setItem('pref_sound', enabled ? 'true' : 'false');
}

/**
 * Retorna o estado atual de áudio
 * @returns {boolean} true se áudios estão habilitados
 */
export function isSoundEnabled() {
    return soundEnabled;
}

/**
 * Toca um som específico
 * @param {string} soundName - Nome do som (pick, drop, success, toggle, trash)
 */
export function playSound(soundName) {
    // 1. O gerenciador de áudio pergunta: "O usuário ativou o som?"
    if (!soundEnabled || !sounds[soundName]) return;

    // 2. Toca o som (o currentTime = 0 permite que o som toque várias vezes seguidas rápido, como mover vários cards)
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(err => {
        // Ignora erros caso o navegador bloqueie o autoplay antes do usuário interagir com a página
        console.warn('Áudio bloqueado pelo navegador:', err);
    });
}

/**
 * Pré-carrega os áudios para garantir que tocam sem atraso
 */
export function preloadSounds() {
    Object.values(sounds).forEach(audio => {
        audio.load();
    });
}