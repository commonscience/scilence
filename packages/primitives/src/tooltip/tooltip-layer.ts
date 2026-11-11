/** Tooltip layer ownership. Numeric tokens order ordinary surfaces; native
 * dialogs/popovers require a native top-layer portal. Never focus the tooltip
 * or dismiss another popover to reveal it. Legacy renderer remains separate. */
export function mountTooltipLayer(node:HTMLElement,trigger:HTMLElement):(()=>void)|null {
 const doc=trigger.ownerDocument;
 if(!trigger.isConnected)return null;
 let modals:Element[]=[];try{modals=[...doc.querySelectorAll('dialog:modal')];}catch{/* Older hosts lack :modal. */}
 if(modals.length&&!modals.some(dialog=>dialog.contains(trigger)))return null;
 const owner=trigger.closest('dialog[open]');
 const host=owner??doc.body;
 let disposed=false;
 const cleanup=()=>{if(disposed)return;disposed=true;observer?.disconnect();owner?.removeEventListener('close',cleanup);owner?.removeEventListener('cancel',cleanup);node.remove();};
 // Initialize before append: MutationObserver callbacks may run after teardown.
 const Observer=doc.defaultView?.MutationObserver;
 const observer=Observer?new Observer(()=>{if(!trigger.isConnected||owner&&!owner.hasAttribute('open'))cleanup();}):null;
 if(typeof node.showPopover==='function')node.setAttribute('popover','manual');
 host.append(node);
 if(node.hasAttribute('popover')){
  try{node.showPopover();}catch{node.removeAttribute('popover');} // Dialog-local fallback for older WebViews.
 }
 owner?.addEventListener('close',cleanup);owner?.addEventListener('cancel',cleanup);
 observer?.observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 return cleanup;
}
