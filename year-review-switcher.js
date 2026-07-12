(function () {
  const switchers = document.querySelectorAll('[data-review-switcher]');
  if (!switchers.length) return;

  const close = (switcher, restoreFocus = false) => {
    const toggle = switcher.querySelector('.review-switcher-toggle');
    switcher.dataset.open = 'false';
    toggle?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle?.focus();
  };

  const open = (switcher, focusFirst = false) => {
    switchers.forEach((item) => {
      if (item !== switcher) close(item);
    });
    const toggle = switcher.querySelector('.review-switcher-toggle');
    switcher.dataset.open = 'true';
    toggle?.setAttribute('aria-expanded', 'true');
    if (focusFirst) switcher.querySelector('.review-switcher-menu a')?.focus();
  };

  switchers.forEach((switcher) => {
    const toggle = switcher.querySelector('.review-switcher-toggle');
    const menu = switcher.querySelector('.review-switcher-menu');
    if (!toggle || !menu) return;

    switcher.dataset.open = 'false';
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (switcher.dataset.open === 'true') close(switcher);
      else open(switcher);
    });

    toggle.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        open(switcher, true);
      }
    });

    switcher.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(switcher, true);
      }
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        close(switcher);
        const navMenu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger');
        navMenu?.classList.remove('active');
        hamburger?.classList.remove('active');
        hamburger?.setAttribute('aria-expanded', 'false');
      });
    });
  });

  document.addEventListener('click', (event) => {
    switchers.forEach((switcher) => {
      if (!switcher.contains(event.target)) close(switcher);
    });
  });
})();
