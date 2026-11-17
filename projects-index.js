// Category filters operate on static, accessible cards; no data requests.
(() => {
    const categories = ['health', 'music', 'systems'];
    const groups = [...document.querySelectorAll('.project-group[data-project-group]')];
    const filters = [...document.querySelectorAll('button[data-project-filter]')];
    const overviewLinks = [...document.querySelectorAll('.project-overview-link')];
    const count = document.querySelector('[data-project-count]');
    const archive = document.getElementById('archive');

    function filterProjects(category = 'all') {
        const selected = categories.includes(category) ? category : 'all';
        let visibleCount = 0;
        for (const group of groups) {
            group.hidden = selected !== 'all' && group.dataset.projectGroup !== selected;
            if (!group.hidden) visibleCount += group.querySelectorAll('[data-project]').length;
        }
        for (const button of filters) {
            button.setAttribute('aria-pressed', String(button.dataset.projectFilter === selected));
        }
        if (count) count.textContent = String(visibleCount);
    }

    function openLinkedSection() {
        const id = window.location.hash.slice(1);
        if (id === 'archive' && archive) archive.open = true;
        if (categories.includes(id)) filterProjects(id);
    }

    for (const button of filters) {
        button.addEventListener('click', () => filterProjects(button.dataset.projectFilter));
    }
    for (const link of overviewLinks) {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const id = link.getAttribute('href').slice(1);
            filterProjects(id);
            window.history.replaceState(null, '', `#${id}`);
            document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
        });
    }
    window.addEventListener('hashchange', openLinkedSection);
    filterProjects();
    openLinkedSection();
})();
