export const workspaceClient = String.raw`
(() => {
  'use strict';
  const icons = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    customers: '<path d="M3 21V7l9-4v18M12 9h9v12M7 9v2m0 3v2m9-3v2m0 3v2M1 21h22"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m2-15a3 3 0 0 1 0 6m2 4a5 5 0 0 1 2 4"/>',
    book: '<path d="M12 6c-3-3-8-3-10-2v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2v15"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    link: '<path d="m9 15 6-6m-8 3-2 2a4 4 0 0 0 6 6l2-2m-2-12 2-2a4 4 0 0 1 6 6l-2 2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
  };
  const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (icons[name] || icons.grid) + '</svg>';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = value => new Intl.NumberFormat('sv-SE').format(value);
  const pill = (text, color='') => '<span class="pill '+color+'">'+esc(text)+'</span>';
  const btn = (text, action, id='', cls='text-link') => '<button aria-label="'+esc(text || 'Öppna detaljer')+'" class="'+cls+'" data-action="'+action+'" data-id="'+esc(id)+'">'+esc(text)+icon('arrow')+'</button>';
  const mark = item => '<span class="entity-mark" style="--entity-color:'+esc(item.color)+'">'+esc(item.initials)+'</span>';
  const entity = (item, sub='') => '<div class="entity">'+mark(item)+'<div><strong>'+esc(item.name)+'</strong><small>'+esc(sub)+'</small></div></div>';
  const table = (heads, rows) => '<div class="table-scroll"><table><thead><tr>'+heads.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
  const row = cells => '<tr>'+cells.map(c=>'<td>'+c+'</td>').join('')+'</tr>';
  const empty = text => '<div class="empty">'+icon('search')+'<h3>Inga träffar</h3><p>'+esc(text)+'</p></div>';
  const pageMeta = {
    overview: ['Överblick', 'En samlad bild. Bättre kunddialog.', 'Era kundrelationer, informationsprodukter och datakällor på ett ställe.'],
    customers: ['Kundorganisationer', 'Varje kund. En egen överblick.', 'Samma portal, med produkter och information utifrån kundens tilldelning.'],
    users: ['Användare', 'Rätt information till rätt person.', 'Kundadministratörer och läsare hör till en kundorganisation.'],
    publishers: ['Publicister', 'Partners bakom kunskapen.', 'Forskning och standarder från flera publicister, med en egen koppling för varje källa.'],
    products: ['Produkter & tilldelningar', 'Utbudet som möter kundens behov.', 'Se produktkatalogen och vilka organisationer som tilldelats respektive produkt.'],
    connections: ['Anslutningar', 'Från källa till kundinsikt.', 'Överblick över datakällor, importmetoder och vad som återstår att ansluta.'],
  };
  let data, active='overview', query='';
  const root=document.getElementById('view');
  const dialog=document.getElementById('detail-dialog');
  const matches = value => JSON.stringify(value).toLocaleLowerCase('sv-SE').includes(query.toLocaleLowerCase('sv-SE'));
  const publisher = id => data.publishers.find(p=>p.id===id);
  const sourceNote = () => '<div class="soft-box"><strong>Syntetiskt presentationsunderlag</strong>Källa: '+esc(data.provenance.source)+'<br>Period: '+esc(data.provenance.period)+'<br>'+esc(data.provenance.definition)+'</div>';
  function metrics(){
    const counts=[['Kundorganisationer',data.customers.length,'customers','1 pilotkund','2 fiktiva exempel'],['Produkter i katalogen',data.products.length,'book',data.publishers.length+' publicister','Forskning & standarder'],['Kundtilldelningar',data.assignments.length,'link','Delad produktkatalog','Unik portfölj per kund'],['Liveanslutningar',0,'grid','Under uppbyggnad','Inga externa importer']];
    return '<div class="metrics">'+counts.map(c=>'<div class="metric-card"><div class="metric-label">'+c[0]+icon(c[2])+'</div><span class="number">'+c[1]+'</span><div class="metric-foot"><em>'+c[3]+'</em> · '+c[4]+'</div></div>').join('')+'</div>';
  }
  function customerTable(list){
    if(!list.length)return empty('Prova ett annat organisationsnamn.');
    return table(['Organisation','Produkter','Användare','Status',''],list.map(c=>row([entity(c,c.type+' · '+c.unit),'<strong>'+c.products+'</strong>',''+c.users,pill(c.id==='customer-kth-demo'?'Pilotkund':'Fiktiv demo',c.id==='customer-kth-demo'?'green':'blue'),btn('Öppna','customer',c.id)])));
  }
  function overview(){
    const largest=data.products.filter(p=>p.publisherId==='ieee');
    return metrics()+'<div class="grid-main"><section class="card"><div class="card-head"><div><h2>Kundorganisationer</h2><p>Portföljer för forskning, utbildning och utveckling</p></div>'+btn('Visa alla','navigate','customers')+'</div>'+customerTable(data.customers)+'</section><section class="hero-card"><div class="eyebrow">I FOKUS · IEEE</div><h2>En stark partner.<br>Flera kundrelationer.</h2><p>IEEE är den största publicistpartnern i uppdraget. Här möts produkter, tilldelningar och MPS/MPS Insight.</p><div class="mini-flow"><span>IEEE</span>'+icon('arrow')+'<span>Produkter</span>'+icon('arrow')+'<span>'+data.customers.filter(c=>c.productIds.some(id=>largest.some(p=>p.id===id))).length+' kunder</span></div><div style="margin-top:19px">'+btn('Utforska IEEE','publisher','ieee')+'</div></section></div>'+ 
    '<div class="grid-main"><section class="card"><div class="card-head"><div><h2>Produkter som används mest</h2><p>KTH · januari–augusti 2026 · syntetisk demo</p></div>'+pill('Exempeldata','blue')+'</div><div class="card-body">'+[...data.products].sort((a,b)=>b.usage-a.usage).slice(0,4).map(p=>'<div class="port-row"><div class="row"><strong>'+esc(p.name)+'</strong><span>'+fmt(p.usage)+'</span></div><div class="bar"><span style="width:'+(p.usage/521760*100)+'%"></span></div></div>').join('')+'<p class="footnote">Exempel på användning per produkt. Mått från olika källor behöver verifieras före jämförelse.</p></div></section><section class="card"><div class="card-head"><div><h2>Att följa upp</h2><p>Inför nästa steg i piloten</p></div>'+icon('clock')+'</div><div class="card-body">'+[['01','Datakälla för IEEE','Verifiera åtkomst och format i MPS/MPS Insight.','connections'],['02','Kundernas tilldelningar','Granska vilka produkter varje organisation ska se.','customers'],['03','Fler publicister','Kartlägg varje partners leveranssätt.','publishers']].map(x=>'<div class="list-item"><span class="entity-mark">'+x[0]+'</span><div class="body"><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div>'+btn('','navigate',x[3],'row-action')+'</div>').join('')+'</div></section></div>';
  }
  function usersView(){
    const list=data.users.filter(matches);
    return '<section class="card"><div class="card-head"><div><h2>Kundernas portalanvändare</h2><p>Ingen av dessa kundroller ger intern systembehörighet</p></div>'+pill(list.length+' användare','blue')+'</div>'+(!list.length?empty('Prova ett annat namn eller en kundroll.'):table(['Användare','Organisation','Kundroll','Status'],list.map(u=>row([entity({name:u.name,initials:u.name.slice(0,2).toUpperCase(),color:'#456986'},'Portalanvändare'),esc(u.customer),pill(u.role,u.role==='Kundadministratör'?'blue':''),esc(u.status)]))))+'</section>';
  }
  function publishersView(){
    const list=data.publishers.filter(matches);
    return list.length?'<div class="publisher-grid">'+list.map(p=>'<section class="card publisher-card">'+entity(p,p.route)+'<p>'+esc(p.description)+'</p><div>'+pill(p.status,p.id==='ieee'?'amber':'')+'</div><div class="card-bottom"><span class="lead">'+data.products.filter(x=>x.publisherId===p.id).length+' produkter</span>'+btn('Visa partner','publisher',p.id)+'</div></section>').join('')+'</div>':empty('Prova en annan publicist.');
  }
  function productsView(){
    const list=data.products.filter(p=>matches({...p,publisher:publisher(p.publisherId).name}));
    return '<section class="card"><div class="card-head"><div><h2>Produktkatalog</h2><p>Tilldelning i portalen är separat från extern licensprovisionering</p></div>'+pill(list.length+' produkter')+'</div>'+(!list.length?empty('Prova ett annat produktnamn.'):table(['Produkt','Publicist','Typ','Tilldelade kunder',''],list.map(p=>row(['<strong>'+esc(p.name)+'</strong>',esc(publisher(p.publisherId).name),esc(p.type),data.customers.filter(c=>c.productIds.includes(p.id)).map(c=>pill(c.name)).join(' '),btn('Detaljer','product',p.id)]))))+'</section>';
  }
  function connectionsView(){
    const list=data.connections.filter(matches);
    return '<div class="grid-main"><section class="card"><div class="card-head"><div><h2>Datakällor</h2><p>Ingen generell COUNTER- eller SUSHI-anslutning antas</p></div>'+pill('0 anslutna','amber')+'</div>'+(!list.length?empty('Ingen källa matchar sökningen.'):table(['Källa','Metod','Status',''],list.map(c=>row(['<strong>'+esc(c.name)+'</strong><br><small class="lead">'+esc(c.owner)+'</small>',esc(c.mode),pill(c.status,c.name.startsWith('MPS')?'amber':''),btn('Detaljer','connection',c.name)]))))+'</section><section class="card"><div class="card-head"><h2>Importhistorik</h2>'+icon('clock')+'</div><div class="empty">'+icon('link')+'<h3>Redo för första datakällan</h3><p>Inga importer har körts.<br>Historik och fel visas när en källa är ansluten.</p></div></section></div><section class="card"><div class="card-head"><div><h2>Spårbarhet från början</h2><p>Varje importerad uppgift behöver ett sammanhang</p></div></div><div class="card-body"><div class="detail-grid">'+[['Ursprung','Publicist, källa och leveranssätt'],['Period','Startdatum, slutdatum och täckning'],['Definition','Rapporttyp, mått och beräkning'],['Status','Importerad, ofullständig eller felaktig']].map(x=>'<div><dt>'+x[0]+'</dt><dd>'+x[1]+'</dd></div>').join('')+'</div></div></section>';
  }
  function render(){
    const meta=pageMeta[active];
    document.getElementById('breadcrumb').textContent=meta[0];
    document.getElementById('view-eyebrow').textContent='CONTENT ONLINE / '+meta[0];
    document.getElementById('view-title').textContent=meta[1];
    document.getElementById('view-description').textContent=meta[2];
    document.getElementById('toolbar').hidden=active==='overview';
    document.querySelectorAll('.nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.id===active?'page':'false'));
    root.innerHTML=active==='overview'?overview():active==='customers'?'<section class="card"><div class="card-head"><h2>Kundregister</h2>'+pill('Syntetisk demo','blue')+'</div>'+customerTable(data.customers.filter(matches))+'</section>':active==='users'?usersView():active==='publishers'?publishersView():active==='products'?productsView():connectionsView();
  }
  function openDialog(title, subtitle, body){
    document.getElementById('detail-title').textContent=title;
    document.getElementById('detail-subtitle').textContent=subtitle;
    document.getElementById('detail-body').innerHTML=body;
    if(!dialog.open)dialog.showModal();
  }
  function customerDetail(id, preview=false){
    const c=data.customers.find(c=>c.id===id);if(!c)return;
    const items=data.products.filter(p=>c.productIds.includes(p.id));
    const customerUsers=data.users.filter(u=>u.customerId===id);
    openDialog(preview?c.name+' · kundförhandsvisning':c.name,preview?'Så här avgränsas kundens portfölj':'Kundorganisation · syntetiskt exempel',
      entity(c,c.fullName)+'<p class="connection-detail">'+esc(preview?'Här visas endast de produkter som tilldelats denna organisation i demokonfigurationen.':c.note)+'</p><div class="detail-grid"><div><dt>Produkter</dt><dd>'+items.length+' tilldelade</dd></div><div><dt>Kundroller</dt><dd>Kundadministratör och läsare</dd></div></div><h3>Tilldelad produktportfölj</h3>'+items.map(p=>'<div class="list-item">'+mark(publisher(p.publisherId))+'<div class="body"><strong>'+esc(p.name)+'</strong><small>'+esc(p.type)+' · '+esc(publisher(p.publisherId).name)+'</small></div>'+pill('Tilldelad','green')+'</div>').join('')+(preview?'':'<h3 class="section-space">Portalanvändare</h3>'+customerUsers.map(u=>'<div class="list-item"><div class="body"><strong>'+esc(u.name)+'</strong><small>'+esc(u.role)+'</small></div>'+pill('Demo')+'</div>').join(''))+'<div class="section-space">'+(preview?sourceNote():btn('Förhandsvisa kundens portfölj','preview',c.id,'button teal'))+'</div><p class="footnote">Detta är en visningsdemo. Ingen tilldelning sparas och ingen extern licens ändras.</p>');
  }
  function publisherDetail(id){
    const p=publisher(id);if(!p)return;
    const items=data.products.filter(x=>x.publisherId===id);
    const clients=data.customers.filter(c=>c.productIds.some(id=>items.some(p=>p.id===id)));
    openDialog(p.name,'Publicist & dataleverantör',entity(p,p.route)+'<p class="connection-detail">'+esc(p.description)+'</p><div class="detail-grid"><div><dt>Anslutningsstatus</dt><dd>'+esc(p.status)+'</dd></div><div><dt>Dataleverans</dt><dd>'+esc(p.route)+'</dd></div></div><h3>Produkter</h3>'+items.map(x=>'<div class="list-item"><div class="body"><strong>'+esc(x.name)+'</strong><small>'+esc(x.type)+'</small></div>'+btn('Visa','product',x.id)+'</div>').join('')+'<h3 class="section-space">Kunder via produkttilldelning</h3>'+clients.map(c=>'<div class="list-item">'+entity(c,c.type)+btn('Öppna','customer',c.id)+'</div>').join('')+'<p class="footnote">Publicisten är en partner. Kundrelationerna går via produkter, inte genom gemensamma kundkonton.</p>');
  }
  function productDetail(id){
    const p=data.products.find(x=>x.id===id);if(!p)return;
    openDialog(p.name,'Produktinformation · demo','<p class="connection-detail">'+esc(p.description)+'</p><div class="detail-grid"><div><dt>Publicist</dt><dd>'+esc(publisher(p.publisherId).name)+'</dd></div><div><dt>Produkttyp</dt><dd>'+esc(p.type)+'</dd></div></div><h3>Tilldelade organisationer</h3>'+data.customers.filter(c=>c.productIds.includes(id)).map(c=>'<div class="list-item">'+entity(c,c.unit)+btn('Kundvy','preview',c.id)+'</div>').join('')+'<div class="section-space">'+sourceNote()+'</div>');
  }
  function connectionDetail(name){
    const c=data.connections.find(x=>x.name===name);if(!c)return;
    openDialog(c.name,'Datakoppling','<div class="detail-grid"><div><dt>Ägare</dt><dd>'+esc(c.owner)+'</dd></div><div><dt>Status</dt><dd>'+esc(c.status)+'</dd></div><div><dt>Senaste import</dt><dd>Ingen import</dd></div><div><dt>Rapportperiod</dt><dd>Ingen data mottagen</dd></div></div><div class="soft-box"><strong>Nästa steg</strong>'+(name.startsWith('MPS')?'Verifiera IEEE-åtkomst, rapportformat, perioder och definitioner i MPS/MPS Insight. Ingen autentiseringsnyckel ska läggas i klienten.':name==='Salesforce'||name==='Fortnox'?'Denna källa ingår i en framtida anslutning. Informationsfält och åtkomst behöver beslutas.':'Kartlägg leveranssätt med varje publicist: API, filer eller en annan lösning.')+'</div>');
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-action]');if(!b)return;
    const {action,id}=b.dataset;
    if(action==='close'){dialog.close();return;}
    if(!data)return;
    if(action==='navigate'){active=pageMeta[id]?id:'overview';query='';document.getElementById('search').value='';history.replaceState(null,'','#'+active);render();document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');}
    if(action==='customer')customerDetail(id);
    if(action==='preview')customerDetail(id,true);
    if(action==='publisher')publisherDetail(id);
    if(action==='product')productDetail(id);
    if(action==='connection')connectionDetail(id);
  });
  document.getElementById('search').addEventListener('input',e=>{query=e.target.value;render();});
  document.getElementById('menu-toggle').addEventListener('click',()=>{const open=document.getElementById('sidebar').classList.toggle('open');document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));});
  document.getElementById('scrim').addEventListener('click',()=>{document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');}});
  const isDemo=document.body.dataset.mode==='demo';
  async function start(){
    const message=document.getElementById('message');
    try{
      let headers={};
      if(!isDemo){
        if(!window.Clerk)throw new Error('auth');
        await Clerk.load({ui:{ClerkUI:window.__internal_ClerkUICtor}});
        if(!Clerk.session){location.replace('/admin/login');return;}
        document.getElementById('sign-out').addEventListener('click',()=>Clerk.signOut({redirectUrl:'/admin/login'}));
        Clerk.addListener(s=>{if(!s.session){data=null;root.replaceChildren();document.getElementById('workspace').hidden=true;dialog.close();location.replace('/admin/login');}});
        headers={Authorization:'Bearer '+await Clerk.session.getToken()};
        const session=await fetch('/admin/api/session',{headers,cache:'no-store',credentials:'omit'});
        if(!session.ok){message.textContent='Kontot saknar åtkomst eller kunde inte verifieras. Logga ut och försök igen.';return;}
        const identity=await session.json();
        document.getElementById('account-email').textContent=identity.admin.email;
      }
      const response=await fetch(isDemo?'/demo/workspace':'/admin/api/workspace',{headers,cache:'no-store',credentials:'omit'});
      if(!response.ok)throw new Error('workspace');
      data=await response.json();
      if(!isDemo)document.dispatchEvent(new CustomEvent('content-online:workspace-ready',{detail:{workspace:data}}));
      active=pageMeta[location.hash.slice(1)]?location.hash.slice(1):'overview';
      document.getElementById('access-message').hidden=true;
      document.getElementById('workspace').hidden=false;
      render();
    }catch{
      data=null;root.replaceChildren();document.getElementById('workspace').hidden=true;
      message.textContent='Arbetsytan kunde inte laddas. Ladda om sidan för att försöka igen.';
      document.getElementById('access-message').hidden=false;
    }
  }
  window.addEventListener('load',start);
})();
`;
