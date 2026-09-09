export const workspaceClient = String.raw`
(() => {
  'use strict';
  if(document.body.dataset.mode!=='admin')return;

  const pageMeta = {
    overview:['Översikt','Översikt','Kunder, kundsajter och publicister på en plats.'],
    customers:['Kundorganisationer','Kundorganisationer','Skapa, publicera och anpassa varje kundsajt.'],
    users:['Användare','Användare','Hantera kundernas portalmedlemmar och behörigheter.'],
    cron:['Cronjobb','Cronjobb','Schemalagda kontroller och jobb per kundorganisation.'],
    reports:['Rapportflöde','Rapportflöde','Rapporter och leveranser per kundorganisation.'],
    connections:['Anslutningar','Anslutningar','Status för plattformens verkliga anslutningar.'],
    salesforce:['Salesforce','Salesforce','Koppla rätt Salesforce-konto till rätt kundorganisation.'],
    publishers:['Publicister','Publicister','Content Onlines partnerregister och kundkopplingar.'],
    products:['Produkter & tilldelningar','Produkter & tilldelningar','Sparade kund–publicistkopplingar och produktkatalogens aktuella status.'],
  };
  let active='overview',workspaceReady=false,authGraceTimer=null;

  function closeNavigation(){
    const sidebar=document.getElementById('sidebar');
    const toggle=document.getElementById('menu-toggle');
    sidebar?.classList.remove('open');
    toggle?.setAttribute('aria-expanded','false');
  }

  function syncPage(){
    const meta=pageMeta[active]||pageMeta.overview;
    const title=document.getElementById('view-title');
    const description=document.getElementById('view-description');
    const toolbar=document.getElementById('toolbar');
    if(title)title.textContent=meta[1];
    if(description)description.textContent=meta[2];
    if(toolbar)toolbar.hidden=active==='overview';
    document.querySelectorAll('.nav button[data-id]').forEach(button=>button.setAttribute('aria-current',button.dataset.id===active?'page':'false'));
    document.querySelectorAll('.nav-section').forEach(section=>section.classList.toggle('has-active',Boolean(section.querySelector('[aria-current="page"]'))));
  }

  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('[data-action="navigate"]'):null;
    if(!button)return;
    const requested=button.dataset.id;
    active=requested&&pageMeta[requested]?requested:'overview';
    const search=document.getElementById('search');
    if(search instanceof HTMLInputElement)search.value='';
    history.replaceState(null,'','#'+active);
    syncPage();
    closeNavigation();
  });

  const menuToggle=document.getElementById('menu-toggle');
  menuToggle?.addEventListener('click',()=>{
    const sidebar=document.getElementById('sidebar');
    if(!sidebar)return;
    const open=sidebar.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded',String(open));
  });
  document.getElementById('scrim')?.addEventListener('click',closeNavigation);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeNavigation();});

  async function freshAdminHeaders(){
    const session=window.Clerk?.session;
    if(session===null)throw new Error('signed_out');
    if(session===undefined)throw new Error('auth_loading');
    const token=await session.getToken();
    if(!token)throw new Error('signed_out');
    return {Authorization:'Bearer '+token};
  }

  function hideProtectedWorkspace(text){
    workspaceReady=false;
    document.getElementById('registry-body')?.replaceChildren();
    const workspace=document.getElementById('workspace');
    const message=document.getElementById('message');
    const accessMessage=document.getElementById('access-message');
    if(workspace)workspace.hidden=true;
    if(message)message.textContent=text;
    if(accessMessage)accessMessage.hidden=false;
  }

  function handleClerkState(state){
    if(authGraceTimer!==null){clearTimeout(authGraceTimer);authGraceTimer=null;}
    if(state.session===null){hideProtectedWorkspace('Din session har avslutats.');location.replace('/admin/login');return;}
    if(state.session===undefined){authGraceTimer=setTimeout(()=>{authGraceTimer=null;if(window.Clerk?.session===undefined)hideProtectedWorkspace('Inloggningen kunde inte bekräftas. Ladda om sidan för att försöka igen.');},15000);}
  }

  async function start(){
    const message=document.getElementById('message');
    try{
      if(!window.Clerk)throw new Error('auth');
      await Clerk.load({ui:{ClerkUI:window.__internal_ClerkUICtor}});
      if(Clerk.session===null){location.replace('/admin/login');return;}
      if(Clerk.session===undefined)throw new Error('auth_loading');
      document.getElementById('sign-out')?.addEventListener('click',()=>Clerk.signOut({redirectUrl:'/admin/login'}));
      Clerk.addListener(handleClerkState);
      const session=await fetch('/admin/api/session',{headers:await freshAdminHeaders(),cache:'no-store',credentials:'omit'});
      if(!session.ok){if(message)message.textContent='Kontot saknar åtkomst eller kunde inte verifieras. Logga ut och försök igen.';return;}
      const identity=await session.json();
      const accountEmail=document.getElementById('account-email');
      if(accountEmail)accountEmail.textContent=identity.admin.email;

      active=pageMeta[location.hash.slice(1)]?location.hash.slice(1):'overview';
      workspaceReady=true;
      syncPage();
      const accessMessage=document.getElementById('access-message');
      const workspace=document.getElementById('workspace');
      if(accessMessage)accessMessage.hidden=true;
      if(workspace)workspace.hidden=false;
      document.dispatchEvent(new CustomEvent('content-online:workspace-ready'));
    }catch{
      hideProtectedWorkspace('Arbetsytan kunde inte laddas. Ladda om sidan för att försöka igen.');
    }
  }

  window.addEventListener('hashchange',()=>{
    if(!workspaceReady)return;
    active=pageMeta[location.hash.slice(1)]?location.hash.slice(1):'overview';
    const search=document.getElementById('search');
    if(search instanceof HTMLInputElement)search.value='';
    syncPage();
  });
  window.addEventListener('load',start);
})();
`;
