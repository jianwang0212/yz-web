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

    const revealTarget = (target, { scroll = false } = {}) => {
        if (!target) return;
        if (target.tagName === "DETAILS") target.open = true;
        openAncestors(target);

        if (scroll) {
            requestAnimationFrame(() => {
                target.scrollIntoView({ behavior: scrollBehavior, block: "start" });
            });
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

        revealTarget(document.getElementById(id), { scroll });
    };

    document.querySelectorAll("[data-read-target]").forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.readTarget;
            const target = document.getElementById(targetId);
            if (!target) return;

            revealTarget(target);
            history.replaceState(null, "", `#${targetId}`);
            target.scrollIntoView({ behavior: scrollBehavior, block: "start" });
            target.querySelector(":scope > summary")?.focus({ preventScroll: true });
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const target = document.getElementById(link.hash.slice(1));
            if (!target) return;

            event.preventDefault();
            revealTarget(target);
            history.replaceState(null, "", link.hash);
            target.scrollIntoView({ behavior: scrollBehavior, block: "start" });
        });
    });

    const tocLinks = [...document.querySelectorAll('.article-toc a[href^="#"]')];
    const tocTargets = tocLinks
        .map((link) => document.getElementById(link.hash.slice(1)))
        .filter(Boolean);

    if ("IntersectionObserver" in window && tocTargets.length) {
        const targetToLink = new Map(tocLinks.map((link) => [
            document.getElementById(link.hash.slice(1)),
            link,
        ]));

        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (!visible) return;

            tocLinks.forEach((link) => link.removeAttribute("aria-current"));
            targetToLink.get(visible.target)?.setAttribute("aria-current", "location");
        }, { rootMargin: "-18% 0px -68%", threshold: 0 });

        tocTargets.forEach((target) => observer.observe(target));
    }

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
