// Mapeamento lógico -> possíveis arquivos (ordem de preferência)
const soundFiles = {
    pick: ['drag.wav'],
    drop: ['drop.wav', 'drop.aiff'],
    create: ['menu_click.wav'],
    loaded: ['loaded_board.wav'],
    switch: ['switch.wav'],
    trash_card: ['card_thrash.wav'],
    trash_column: ['column_thrash.wav']
};

const basePath = 'assets/sounds/';

// Construímos os objetos de áudio apenas para arquivos que provavelmente funcionem
const sounds = {};

function canPlayExtension(ext) {
    const test = document.createElement('audio');
    if (!test.canPlayType) return true; // assume que funciona
    ext = ext.toLowerCase();
    if (ext.endsWith('.mp3')) return !!test.canPlayType('audio/mpeg');
    if (ext.endsWith('.wav')) return !!test.canPlayType('audio/wav');
    if (ext.endsWith('.ogg')) return !!test.canPlayType('audio/ogg; codecs="vorbis"');
    if (ext.endsWith('.aac') || ext.endsWith('.m4a')) return !!test.canPlayType('audio/aac');
    if (ext.endsWith('.aiff') || ext.endsWith('.aif')) return !!(test.canPlayType('audio/aiff') || test.canPlayType('audio/x-aiff'));
    return true;
}

function createAudioFor(name) {
    const candidates = soundFiles[name] || [];
    for (const file of candidates) {
        if (!canPlayExtension(file)) continue;
        const audio = new Audio(basePath + file);
        audio.volume = 0.5;
        return audio;
    }
    // Fallback: try to create audio from first candidate anyway
    if (candidates.length) {
        const audio = new Audio(basePath + candidates[0]);
        audio.volume = 0.5;
        return audio;
    }
    return null;
}

Object.keys(soundFiles).forEach(key => {
    const audio = createAudioFor(key);
    if (audio) sounds[key] = audio;
});

// Ajusta o volume para não assustar o usuário (0.0 a 1.0)
Object.values(sounds).forEach(audio => { if (audio) audio.volume = 0.5; });

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
 * @param {string} soundName - Nome do som lógico (pick, drop, create, loaded, switch, trash_card, trash_column)
 */
export function playSound(soundName) {
    if (!soundEnabled) return;
    const audio = sounds[soundName];
    if (!audio) return;
    try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
    } catch (err) {
        console.warn('Erro ao tocar som', soundName, err);
    }
}

/**
 * Pré-carrega os áudios para garantir que tocam sem atraso
 */
export function preloadSounds() {
    Object.values(sounds).forEach(audio => {
        if (audio && audio.load) audio.load();
    });
}