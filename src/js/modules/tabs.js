export function initTabs() {
    // Menu Hamburguer Responsive
    const hamburgerBtn = document.getElementById('hamburger-tab-btn');
    const tabNav = document.getElementById('main-tab-nav');

    document.addEventListener('click', (e) => {
        // Handle Mobile Hamburger
        if (hamburgerBtn && (e.target === hamburgerBtn || hamburgerBtn.contains(e.target))) {
            tabNav.classList.toggle('show');
            const isExpanded = tabNav.classList.contains('show');
            hamburgerBtn.setAttribute('aria-expanded', isExpanded);
            return;
        }

        // Handle Main Tabs
        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn) {
            const tabName = tabBtn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            tabBtn.classList.add('active');
            const target = document.getElementById(tabName);
            if (target) target.classList.add('active');

            if (tabNav && tabNav.classList.contains('show')) {
                tabNav.classList.remove('show');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            }
            return;
        }

        // Handle Subtabs
        const subtabBtn = e.target.closest('.subtab-btn');
        if (subtabBtn) {
            const targetId = subtabBtn.getAttribute('data-subtab');
            const target = document.getElementById(targetId);
            if (!target) return;
            const contents = target.closest('.subtab-contents');
            if (!contents) return;

            const nav = subtabBtn.closest('.subtab-nav');
            if (nav) nav.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
            subtabBtn.classList.add('active');

            contents.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
            target.classList.add('active');

            const firstInput = target.querySelector('input, select, textarea, button');
            if (firstInput) firstInput.focus();
        }
    });
}
