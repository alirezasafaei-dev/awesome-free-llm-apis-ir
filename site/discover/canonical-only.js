(() => {
  if (window.location.hostname !== "ir.llm.persiantoolbox.ir") return;
  const target = new URL(window.location.href);
  target.hostname = "llm.persiantoolbox.ir";
  target.protocol = "https:";
  target.port = "";
  window.location.replace(target.href);
})();
