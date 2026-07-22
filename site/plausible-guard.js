const tracker = document.currentScript?.nextElementSibling;

try {
  if (location.hostname !== tracker?.dataset.domain) {
    localStorage.setItem("plausible_ignore", "true");
  }
} catch {
  // Storage can be unavailable in hardened browser modes; the tracker remains non-blocking.
}
