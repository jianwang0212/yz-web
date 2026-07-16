(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollBehavior = reduceMotion ? "auto" : "smooth";

    const openAncestors = (element) => {
        let current = element?.parentElement;
        while (current) {
            if (current.tagName === "DETAILS") current.open = true;
            current = current.parentElement;
        }
    };

    const revealHashTarget = ({ scroll = false } = {}) => {
        if (!window.location.hash) return;

        let id;
        try {
            id = decodeURIComponent(window.location.hash.slice(1));
        } catch {
            return;
        }

        const target = document.getElementById(id);
        if (!target) return;

        if (target.tagName === "DETAILS") target.open = true;
        openAncestors(target);
        if (scroll) {
            requestAnimationFrame(() => {
                target.scrollIntoView({ behavior: scrollBehavior, block: "start" });
            });
        }
    };

    const secondRetreat = document.getElementById("second-retreat");
    const readNext = document.querySelector("[data-read-next]");

    readNext?.addEventListener("click", () => {
        if (!secondRetreat) return;
        secondRetreat.open = true;
        history.replaceState(null, "", "#second-retreat");
        secondRetreat.scrollIntoView({ behavior: scrollBehavior, block: "start" });
        secondRetreat.querySelector(":scope > summary")?.focus({ preventScroll: true });
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", () => {
            const target = document.getElementById(link.hash.slice(1));
            if (target?.tagName === "DETAILS") target.open = true;
            openAncestors(target);
            requestAnimationFrame(() => {
                target?.scrollIntoView({ behavior: scrollBehavior, block: "start" });
            });
        });
    });

    document.querySelectorAll("details > summary").forEach((summary) => {
        summary.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            summary.parentElement.open = !summary.parentElement.open;
        });
    });

    const printState = new Map();
    window.addEventListener("beforeprint", () => {
        document.querySelectorAll("details").forEach((detail) => {
            printState.set(detail, detail.open);
            detail.open = true;
        });
    });

    window.addEventListener("afterprint", () => {
        printState.forEach((wasOpen, detail) => {
            detail.open = wasOpen;
        });
        printState.clear();
    });

    revealHashTarget({ scroll: true });
    window.addEventListener("hashchange", () => revealHashTarget({ scroll: true }));
})();
