export const customerPortalClient = String.raw`
(() => {
  'use strict';
  const configNode=document.getElementById('portal-config');
  if(!configNode)return;
  let config;
  try{config=JSON.parse(configNode.textContent||'{}');}catch{return;}
  const sections=new Set(['overview','products','usage','documents','service']);
  const navButtons=[...document.querySelectorAll('[data-portal-nav]')];
  const sidebar=document.getElementById('portal-sidebar');
  const scrim=document.getElementById('portal-scrim');
  const closeMenu=()=>{sidebar?.classList.remove('open');scrim?.classList.remove('visible');document.getElementById('portal-menu')?.setAttribute('aria-expanded','false');};
  const goToSection=(section)=>{
    if(!sections.has(section))throw new Error('Sektionen är inte tillåten.');
    const target=document.querySelector('[data-portal-section="'+section+'"]');
    if(!target)throw new Error('Sektionen finns inte i denna portal.');
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    history.replaceState(null,'','#'+section);
    navButtons.forEach(button=>button.setAttribute('aria-current',button.dataset.portalNav===section?'page':'false'));
    closeMenu();
    return {ok:true,section,label:target.dataset.portalLabel||section};
  };
  navButtons.forEach(button=>button.addEventListener('click',()=>goToSection(button.dataset.portalNav)));
  document.getElementById('portal-menu')?.addEventListener('click',()=>{const open=sidebar?.classList.toggle('open');scrim?.classList.toggle('visible',!!open);document.getElementById('portal-menu')?.setAttribute('aria-expanded',String(!!open));});
  scrim?.addEventListener('click',closeMenu);
  if(location.hash&&sections.has(location.hash.slice(1)))queueMicrotask(()=>goToSection(location.hash.slice(1)));

  const readContext=async()=>{
    const response=await fetch(config.contextUrl,{cache:'no-store',credentials:'omit'});
    if(!response.ok)throw new Error('Portalinformationen är inte tillgänglig.');
    return response.json();
  };
  const registerTools=()=>{
    const api=window.DID_AGENTS_API;
    if(!api?.functions?.registerClientTool)return;
    const enabled=new Set(config.tools||[]);
    if(enabled.has('portal_context'))api.functions.registerClientTool('get_portal_context',async()=>JSON.stringify(await readContext()));
    if(enabled.has('portal_navigation'))api.functions.registerClientTool('navigate_portal',async args=>JSON.stringify(goToSection(String(args?.section||''))));
    if(enabled.has('portfolio_summary'))api.functions.registerClientTool('get_portfolio_summary',async()=>JSON.stringify((await readContext()).portfolio));
    if(enabled.has('usage_summary'))api.functions.registerClientTool('get_usage_summary',async()=>JSON.stringify((await readContext()).usage));
  };
  const bindDid=()=>{
    const api=window.DID_AGENTS_API;
    if(!api?.events?.on)return false;
    api.events.on('connection',event=>{if(event?.state==='Connected')registerTools();});
    return true;
  };
  if(config.agentEnabled){
    if(!bindDid()){
      let attempts=0;
      const timer=setInterval(()=>{attempts++;if(bindDid()||attempts>80)clearInterval(timer);},100);
    }
  }
})();
`;
