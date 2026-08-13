const list = document.querySelector("#admin-tools-list");
fetch("/discover/api/admin/tools", { headers: { accept: "application/json" } })
  .then((response) => response.json())
  .then((data) => { list.textContent = `${data.tools?.length ?? 0} ابزار`; });
