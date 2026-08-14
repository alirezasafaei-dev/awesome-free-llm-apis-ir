document.querySelector("#discover-main-site")?.addEventListener("click",()=>{
  if(typeof window.plausible==="function")window.plausible("discover_persiantoolbox_click",{props:{source:"discover_note"}});
});
