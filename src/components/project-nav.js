// components/project-nav.js

export function initProjectNav() {
  const list = document.querySelector('[data-project-nav="list"]');
  if (!list) return; // Nur auf CMS-Case-Study-Seiten mit der Referenz-Liste aktiv

  const links = Array.from(list.querySelectorAll('[data-project-nav="link"]'));
  if (!links.length) return;

  const currentPath = window.location.pathname.replace(/\/$/, '');
  const currentIndex = links.findIndex((link) => {
    const linkPath = new URL(link.href).pathname.replace(/\/$/, '');
    return linkPath === currentPath;
  });
  if (currentIndex === -1) return; // Aktuelles Item nicht in der Referenz-Liste gefunden

  const length = links.length;

  // Loop: nach dem letzten Projekt geht's zum ersten, vor dem ersten zum letzten
  const nextLink = links[(currentIndex + 1) % length];
  const prevLink = links[(currentIndex - 1 + length) % length];

  const nextButton = document.querySelector('[data-project-nav="next"]');
  const prevButton = document.querySelector('[data-project-nav="prev"]');

  if (nextButton) nextButton.href = nextLink.href;
  if (prevButton) prevButton.href = prevLink.href;
}
