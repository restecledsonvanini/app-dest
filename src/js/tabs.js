// Tab switching logic for ferramentas page

document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function () {
        const tabName = this.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Subtab switching (within a tab section)
document.querySelectorAll('.subtab-btn').forEach(button => {
    button.addEventListener('click', function () {
        const targetId = this.getAttribute('data-subtab');
        // find the target element by ID and its .subtab-contents container
        const target = document.getElementById(targetId);
        if (!target) return;
        const contents = target.closest('.subtab-contents');
        if (!contents) return;
        // deactivate sibling buttons within the same nav group
        const nav = this.closest('.subtab-nav');
        if (nav) nav.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        // hide all subtab-content inside this contents and show target
        contents.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
        target.classList.add('active');
        // focus first input for convenience
        const firstInput = target.querySelector('input, select, textarea, button');
        if (firstInput) firstInput.focus();
    });
});