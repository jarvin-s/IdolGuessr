export const THEME_STORAGE_KEY = 'idol-guessr-theme'

export type ThemeChoice = 'light' | 'dark' | 'system'

export function isThemeChoice(value: string | null): value is ThemeChoice {
    return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveIsDark(choice: ThemeChoice): boolean {
    if (choice === 'dark') return true
    if (choice === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(choice: ThemeChoice) {
    const dark = resolveIsDark(choice)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'

    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'theme-color')
        document.head.appendChild(meta)
    }
    meta.setAttribute('content', dark ? '#09090b' : '#ffffff')
}

export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var root=document.documentElement;root.classList.toggle('dark',dark);root.style.colorScheme=dark?'dark':'light';var meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.setAttribute('name','theme-color');document.head.appendChild(meta);}meta.setAttribute('content',dark?'#09090b':'#ffffff');}catch(e){}})();`
