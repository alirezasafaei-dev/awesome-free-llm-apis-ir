const ICON_PREFIX="icon:";
function applyManagedIcons(){
  for(const card of document.querySelectorAll(".discover-card")){
    const iconNode=card.querySelector(".discover-card-icon");
    const badge=[...card.querySelectorAll(".discover-badge")].find(node=>node.textContent.trim().startsWith(ICON_PREFIX));
    if(!badge)continue;
    const icon=badge.textContent.trim().slice(ICON_PREFIX.length).trim();
    if(iconNode&&icon)iconNode.textContent=icon;
    badge.remove();
  }
}
const list=document.querySelector("#discover-list");
if(list)new MutationObserver(applyManagedIcons).observe(list,{childList:true,subtree:true});
applyManagedIcons();
document.querySelector("#discover-main-site")?.addEventListener("click",()=>{
  if(typeof window.plausible==="function")window.plausible("discover_persiantoolbox_click",{props:{source:"discover_note"}});
});
