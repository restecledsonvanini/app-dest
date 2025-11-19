function openLink(url) {
        window.open(url, "_blank");
    }

    function copyLink(url, btn) {
        navigator.clipboard.writeText(url);

        const feedback = btn.parentElement.querySelector(".copied");
        feedback.classList.add("show");

        setTimeout(() => feedback.classList.remove("show"), 1500);
    }