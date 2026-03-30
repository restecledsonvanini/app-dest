const iconMap = {
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"></path><path d="M7 9l5-5 5 5"></path><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg>`,
    folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 6.75A1.75 1.75 0 0 1 5.5 5h4.1l1.8 2h7.1a1.75 1.75 0 0 1 1.75 1.75v8.75A1.75 1.75 0 0 1 18.5 19.25h-13A1.75 1.75 0 0 1 3.75 17.5z"></path></svg>`,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>`,
    eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 18"></path><path d="M6.7 6.7C4.18 8.03 2.63 10.68 2.25 12c.88 1.51 4.14 6 9.75 6 1.9 0 3.54-.52 4.93-1.27"></path><path d="M20.9 15.5c.47-.57.83-1.11.85-1.15-.88-1.51-4.14-6-9.75-6-1.15 0-2.22.19-3.2.52"></path></svg>`,
    word: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6"></path><path d="M8 12.5 9.2 17l1.4-3.2 1.4 3.2 1.2-4.5"></path></svg>`,
    pdf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"></path><path d="M14 2v5h5"></path><path d="M8 17v-4h1.3a1.4 1.4 0 0 1 0 2.8H8"></path><path d="M13 17v-4h1.3"></path><path d="M17 17v-4h2"></path></svg>`,
    external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5h5v5"></path><path d="M10 14 19 5"></path><path d="M19 13v5a1.75 1.75 0 0 1-1.75 1.75H6.75A1.75 1.75 0 0 1 5 18.25V7.75A1.75 1.75 0 0 1 6.75 6H12"></path></svg>`,
    expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5"></path><path d="M16 3h5v5"></path><path d="M8 21H3v-5"></path><path d="M16 21h5v-5"></path></svg>`,
    collapse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9 3 3"></path><path d="M15 9 21 3"></path><path d="M9 15 3 21"></path><path d="M15 15 21 21"></path></svg>`,
    reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.34 5.66"></path><path d="M20 4v7h-7"></path></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 9.2 17 19 7.5"></path></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 6 12 12"></path><path d="M18 6 6 18"></path></svg>`,
    braces: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4c-2 0-3 1-3 3v2c0 1.5-.7 2.5-2 3 1.3.5 2 1.5 2 3v2c0 2 1 3 3 3"></path><path d="M15 4c2 0 3 1 3 3v2c0 1.5.7 2.5 2 3-1.3.5-2 1.5-2 3v2c0 2-1 3-3 3"></path></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 10v5"></path><path d="M12 7.5h.01"></path></svg>`
};

export function getDocumentEditorIcon(name) {
    return iconMap[name] || iconMap.info;
}
