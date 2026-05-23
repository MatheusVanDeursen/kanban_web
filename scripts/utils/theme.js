export function initTheme(toggleElementId, iconElementId = null) {
    const themeBtn = document.getElementById(toggleElementId);
    const themeIcon = iconElementId ? document.querySelector(iconElementId) : (themeBtn ? themeBtn.querySelector('i') : null);
    
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    const applyTheme = (isLight) => {
        if (isLight) {
            document.body.classList.add('light-mode');
            if (themeIcon && themeIcon.classList.contains('fa-moon')) {
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        } else {
            document.body.classList.remove('light-mode');
            if (themeIcon && themeIcon.classList.contains('fa-sun')) {
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            }
        }
        // Renderização do botão do google respeitando tema caso ele exista na tela
        if (typeof window.renderGoogleButton === 'function') {
            window.renderGoogleButton(isLight);
        }
    };

    let isLightMode = savedTheme === 'light' || (!savedTheme && systemPrefersLight);
    applyTheme(isLightMode);

    if (themeBtn) {
        themeBtn.addEventListener('change', (e) => {
            const isLight = !e.target.checked;
            applyTheme(isLight);
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
        
        themeBtn.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return; // Previne rodar duas vezes caso o target for input
            isLightMode = !document.body.classList.contains('light-mode');
            applyTheme(isLightMode);
            localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
        });
    }
}