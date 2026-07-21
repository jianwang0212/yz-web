const archive = document.querySelector('#archive');
const archiveTrigger = document.querySelector('[data-open-project-archive]');

function openArchive() {
    if (archive) archive.open = true;
}

archiveTrigger?.addEventListener('click', openArchive);

if (window.location.hash === '#archive') openArchive();
