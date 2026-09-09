export const registryClient = String.raw`
(() => {
  'use strict';
  let snapshot=null,busy=false,started=false;
  const panel=document.getElementById('registry-panel'),root=document.getElementById('registry-body');
  if(!panel||!root)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const canonicalOrigin=()=>snapshot?.runtime?.customerSites?.canonicalOrigin||location.origin;
  const canonicalPathPrefix=()=>snapshot?.runtime?.customerSites?.pathPrefix||'/portal';
  const fallbackUrl=customer=>canonicalOrigin()+canonicalPathPrefix()+'/'+encodeURIComponent(customer.slug);
  const managedDomain=customer=>{const rootDomain=snapshot?.runtime?.customerDomains?.rootDomain;return Boolean(rootDomain&&customer?.site?.domain&&customer.site.domain.endsWith('.'+rootDomain)&&!customer.site.domain.slice(0,-rootDomain.length-1).includes('.'));};
  const domainReady=customer=>customer.site?.domainStatus==='ready'||Boolean(snapshot?.runtime?.customerDomains?.wildcardReady&&managedDomain(customer));
  const url=customer=>domainReady(customer)&&customer.site.domain?'https://'+customer.site.domain:fallbackUrl(customer);
  const activationUrl=customer=>url(customer)+(url(customer).endsWith('/')?'':'/')+'login';
  const allowedDomain=customer=>customer.site?.domain?'https://'+customer.site.domain+' (och '+canonicalOrigin()+' för plattformens adress)':canonicalOrigin();
  const slugify=value=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,63).replace(/-+$/g,'');
  const availableSlug=value=>{const base=slugify(value);if(!base)return '';const taken=new Set(snapshot?.data?.customers?.map(customer=>customer.slug)||[]);if(!taken.has(base))return base;for(let number=2;number<1000;number++){const suffix='-'+number,candidate=base.slice(0,63-suffix.length).replace(/-+$/g,'')+suffix;if(!taken.has(candidate))return candidate;}return base;};
  const view=()=>location.hash.slice(1)||'overview';
  const label={draft:'Utkast',published:'Publicerad',archived:'Arkiverad',active:'Aktiv',inactive:'Inaktiv',not_configured:'Inte konfigurerad',pending:'DNS väntar',ready:'Klar'};
  const toolLabels={portal_context:'Portalkontext och tonalitet',portal_navigation:'Navigera mellan tillåtna sektioner',portfolio_summary:'Sammanfatta portfölj',usage_summary:'Sammanfatta verifierad användning'};
  const button=(text,action,id,className='button secondary')=>'<button class="'+className+'" type="button" data-reg="'+action+'" data-id="'+esc(id||'')+'">'+esc(text)+'</button>';
  const field=(name,title,value='',maxlength=120,type='text',hint='')=>'<label>'+esc(title)+'<input class="registry-input" type="'+type+'" name="'+name+'" value="'+esc(value)+'" maxlength="'+maxlength+'" '+(type==='password'?'autocomplete="off"':'')+' required>'+(hint?'<small class="registry-hint">'+esc(hint)+'</small>':'')+'</label>';
  const optionalField=(name,title,value='',maxlength=240,type='text',hint='')=>'<label>'+esc(title)+'<input class="registry-input" type="'+type+'" name="'+name+'" value="'+esc(value)+'" maxlength="'+maxlength+'" '+(type==='password'?'autocomplete="off"':'')+'>'+(hint?'<small class="registry-hint">'+esc(hint)+'</small>':'')+'</label>';
  const swatch=customer=>'<span class="registry-swatch" aria-label="Temafärger"><i style="background:'+esc(customer.site.primaryColor)+'"></i><i style="background:'+esc(customer.site.accentColor)+'"></i></span>';

  function render(){
    panel.hidden=!['overview','customers','publishers'].includes(view());
    if(panel.hidden)return;
    if(!snapshot){root.innerHTML='<h2>Sparat register</h2><p role="status">Registret kunde inte laddas. Kontrollera databasanslutningen och försök igen. Inga ändringar har sparats.</p>'+button('Försök igen','reload');return;}
    const {customers,publishers}=snapshot.data;
    let html='<div class="card-head"><div><div class="eyebrow">SPARAT REGISTER · NEON</div><h2>'+(view()==='publishers'?'Content Onlines publicister':view()==='customers'?'Kundsajter & styrning':'Kunder, sajter & publicister')+'</h2><p>Version '+snapshot.version+' · En Vercel-runtime, en portalmall och separat konfiguration per kund.</p></div>'+button('Uppdatera','reload')+'</div>';
    if(view()==='overview')html+='<div class="registry-overview"><div><strong>'+customers.filter(customer=>customer.status!=='archived').length+'</strong><span>Kunder</span></div><div><strong>'+customers.filter(customer=>customer.status==='published').length+'</strong><span>Publicerade kundsidor</span></div><div><strong>'+customers.filter(customer=>customer.site.agent.enabled).length+'</strong><span>Aktiverade agentprofiler</span></div><div><strong>'+publishers.filter(publisher=>publisher.status==='active').length+'</strong><span>Publicister</span></div></div><p><a class="button teal" href="#customers">Skapa och styra kundsajter</a> <a class="button secondary" href="#publishers">Hantera publicister</a></p>';
    if(view()==='customers'){
      html+='<p>Skapa en kund en gång. Plattformens inbyggda portalmall använder kundens färger, logotyp, publicister och D-ID-konfiguration – utan ett nytt repo eller Vercel-projekt.</p><form data-reg-form="add_customer" class="registry-form registry-create">'+field('name','Organisationsnamn')+field('slug','URL-namn (föreslås automatiskt)','',63,'text','Sidan får adressen /portal/url-namn på Content Onlines Vercel-sajt')+'<button class="button teal" type="submit">Lägg till kund</button></form>';
      html+=customers.map(customer=>{
        const agentMode=snapshot.runtime?.agentModeByCustomer?.[customer.id];
        const agentState=agentMode==='customer'?'D-ID konfigurerad per kund':agentMode==='platform_fallback'?'D-ID via plattformskonfiguration':agentMode==='incomplete'?'D-ID väntar på uppgifter':'Agent avstängd';
        const preview=url(customer),activation=activationUrl(customer);
        return '<article class="registry-customer"><div class="registry-customer-main">'+swatch(customer)+'<div class="body"><strong>'+esc(customer.name)+'</strong><small>'+esc(label[customer.status])+' · Standardmall · '+esc(agentState)+'</small><small><b>Kundadress:</b> '+esc(fallbackUrl(customer))+'</small><small><b>Egen domän:</b> '+esc(customer.site.domain||'Valfri · inte konfigurerad')+(customer.site.domain?' · '+esc(domainReady(customer)?'Klar':label[customer.site.domainStatus]):'')+'</small><small><b>Publicister:</b> '+esc(customer.publisherIds.map(id=>publishers.find(p=>p.id===id)?.name||id).join(', ')||'Inga valda')+'</small></div></div><div class="registry-actions">'+button('Styr kundsajt','edit_customer',customer.id,'button teal')+(customer.site.domain&&!domainReady(customer)?button('Kontrollera DNS','ensure_domain',customer.id):'')+(customer.status==='published'?'<a class="button secondary" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" href="'+esc(preview)+'">Granska kundsajt</a><a class="button secondary" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" href="'+esc(activation)+'">Aktiveringssida</a>'+button('Avpublicera','unpublish_customer',customer.id):customer.status==='draft'?button('Publicera','publish_customer',customer.id):button('Återställ till utkast','restore_customer',customer.id))+(customer.status!=='archived'?button('Arkivera kundsajt','archive_customer',customer.id):customer.kind!=='demo'?button('Radera permanent','delete_customer',customer.id):'')+'</div></article>';
      }).join('');
      html+='<div id="registry-editor"></div><p class="footnote">Publicering gör kundsidan tillgänglig direkt under /portal/url-namn på Content Onlines gemensamma Vercel-sajt. Egen domän är valfri och kan kopplas senare. D-ID Allowed Domains ska vara exakt en origin, aldrig en URL med sökväg.</p>';
    }
    if(view()==='publishers'){
      html+='<p>Hantera partnerregistret. Att lägga till en publicist ansluter inte automatiskt dess API eller informationsprodukter.</p><form data-reg-form="add_publisher" class="registry-form">'+field('name','Publicistens namn')+'<button class="button teal" type="submit">Lägg till publicist</button></form>';
      html+=publishers.map(publisher=>'<div class="list-item"><div class="body"><strong>'+esc(publisher.name)+'</strong><small>'+esc(label[publisher.status])+' · '+customers.filter(customer=>customer.publisherIds.includes(publisher.id)).length+' kundkopplingar</small></div><div class="registry-actions">'+button('Byt namn','edit_publisher',publisher.id)+button(publisher.status==='active'?'Arkivera':'Återställ',publisher.status==='active'?'archive_publisher':'restore_publisher',publisher.id)+'</div></div>').join('');
      html+='<div id="registry-editor"></div><p class="footnote">Arkivering stoppar nya tilldelningar men bevarar befintliga kopplingar. Ingen historik eller extern licens raderas.</p>';
    }
    root.innerHTML=html+'<p id="registry-status" role="status"></p>';
  }

  function customerEditor(customer){
    const site=customer.site,agent=site.agent;
    const publishers=snapshot.data.publishers.filter(publisher=>publisher.status==='active'||customer.publisherIds.includes(publisher.id));
    const preset='<label>Portal-mall<select class="registry-input" name="preset"><option value="insight" '+(site.preset==='insight'?'selected':'')+'>Standard · komplett</option><option value="library" '+(site.preset==='library'?'selected':'')+'>Library · kunskapsfokus</option><option value="minimal" '+(site.preset==='minimal'?'selected':'')+'>Minimal · avskalad</option></select></label>';
    const colors='<div class="registry-color-row"><label>Primärfärg<input class="registry-input registry-color" type="color" name="primaryColor" value="'+esc(site.primaryColor)+'"></label><label>Accentfärg<input class="registry-input registry-color" type="color" name="accentColor" value="'+esc(site.accentColor)+'"></label></div>';
    const tools=Object.keys(toolLabels).map(tool=>'<label class="registry-check"><input type="checkbox" name="agentTools" value="'+tool+'" '+(agent.tools.includes(tool)?'checked':'')+'>'+esc(toolLabels[tool])+'</label>').join('');
    return '<section class="registry-editor-card"><div class="registry-editor-head"><div><div class="eyebrow">STYR KUNDSAJT</div><h3>'+esc(customer.name)+'</h3><p>'+esc(url(customer))+'</p></div>'+button('Stäng','close_editor')+'</div><form class="registry-form registry-editor-form" data-reg-form="update_customer" data-id="'+esc(customer.id)+'"><h4>Organisation & publicister</h4>'+field('name','Organisationsnamn',customer.name)+'<fieldset><legend>Publicister i kundens portal</legend>'+publishers.map(publisher=>'<label class="registry-check"><input type="checkbox" name="publisherIds" value="'+esc(publisher.id)+'" '+(customer.publisherIds.includes(publisher.id)?'checked':'')+'>'+esc(publisher.name)+(publisher.status==='archived'?' (arkiverad)':'')+'</label>').join('')+'</fieldset><button class="button teal" type="submit">Spara organisation</button></form><form class="registry-form registry-editor-form" data-reg-form="configure_customer_site" data-id="'+esc(customer.id)+'"><h4>Varumärke & portal</h4>'+preset+optionalField('domain','Kunddomän',site.domain,253,'text','Endast hostname, utan https:// eller sökväg')+optionalField('logoUrl','Logotyp (publik HTTPS-adress)',site.logoUrl,500,'url','Tomt fält använder kundens initialer')+colors+field('heading','Portalrubrik',site.heading,120)+field('tagline','Ingress',site.tagline,240)+'<fieldset class="registry-agent"><legend>D-ID-agent för '+esc(customer.name)+'</legend><label class="registry-switch"><input type="checkbox" name="agentEnabled" '+(agent.enabled?'checked':'')+'> Visa agenten på kundens portal</label>'+optionalField('agentId','Agent ID',agent.agentId,128,'text','Exempel: v2_agt_...')+optionalField('clientKey','Client key från D-ID Embed',agent.clientKey,2048,'password','Browser key – inte D-ID API-nyckeln')+field('greeting','Agentens hälsning',agent.greeting,240)+'<label>Positivitet: <output data-positivity-output>'+agent.positivity+'</output>/10<input class="registry-input registry-range" type="range" name="positivity" min="1" max="10" step="1" value="'+agent.positivity+'"></label><p class="registry-hint">Nivån styr ton, aldrig fakta. Agenten får inte dölja kostnader, nedgångar eller osäkerhet.</p><div class="registry-tools"><strong>Tillåtna klientverktyg</strong>'+tools+'</div><p class="registry-domain-note"><strong>D-ID Allowed Domains:</strong> '+esc(allowedDomain(customer))+'</p></fieldset><button class="button teal" type="submit">Spara kundsajt</button></form>'+portalMembersEditor(customer)+'</section>';
  }

  const memberRoleOptions=role=>'<option value="customer_reader" '+(role==='customer_reader'?'selected':'')+'>Läsare</option><option value="customer_admin" '+(role==='customer_admin'?'selected':'')+'>Kundadmin</option>';
  const memberStatusOptions=status=>'<option value="active" '+(status==='active'?'selected':'')+'>Aktiv</option><option value="inactive" '+(status==='inactive'?'selected':'')+'>Inaktiv</option>';
  const roleField=role=>'<label>Roll<select class="registry-input" name="role">'+memberRoleOptions(role)+'</select></label>';
  function portalMembersEditor(customer){
    if(customer.kind==='demo')return '<div class="registry-form registry-editor-form" aria-labelledby="portal-members-heading"><h4 id="portal-members-heading">Portalanvändare</h4><p class="registry-hint">KTH är en syntetisk visningsdemo. Inga riktiga medlemskonton eller verifierade e-postadresser kan läggas till här.</p></div>';
    const members=(snapshot.data.portalMembers||[]).filter(member=>member.customerId===customer.id);
    const heading='<div class="registry-form registry-editor-form" aria-labelledby="portal-members-heading"><h4 id="portal-members-heading">Portalanvändare</h4><p class="registry-hint">Tillåt endast en e-postadress som kundens identitetsleverantör har verifierat. Behörigheten knyts server-side till denna kundorganisation.</p></div>';
    const existing=members.length?members.map(member=>'<form class="registry-form registry-editor-form" data-reg-form="update_portal_member" data-id="'+esc(member.id)+'" aria-label="Redigera portalanvändare '+esc(member.displayName)+'"><h4>'+esc(member.displayName)+' · '+esc(label[member.status])+'</h4>'+field('verifiedEmail','Verifierad e-postadress',member.verifiedEmail,254,'email')+field('displayName','Visningsnamn',member.displayName)+roleField(member.role)+'<label>Status<select class="registry-input" name="status">'+memberStatusOptions(member.status)+'</select></label><button class="button teal" type="submit">Spara portalanvändare</button></form>').join(''):'<p class="registry-hint">Inga riktiga portalanvändare är tillåtna ännu.</p>';
    const add='<form class="registry-form registry-editor-form" data-reg-form="add_portal_member" data-customer-id="'+esc(customer.id)+'"><h4>Lägg till portalanvändare</h4>'+field('verifiedEmail','Verifierad e-postadress','',254,'email','Adressen måste vara verifierad vid inloggningen och matchas exakt efter normalisering.')+field('displayName','Visningsnamn')+roleField('customer_reader')+'<button class="button teal" type="submit">Lägg till portalanvändare</button></form>';
    return heading+existing+add;
  }

  function deleteCustomerEditor(customer){
    return '<section class="registry-editor-card" aria-labelledby="registry-delete-title"><div class="registry-editor-head"><div><div class="eyebrow">PERMANENT RADERING</div><h3 id="registry-delete-title">Radera '+esc(customer.name)+'</h3></div>'+button('Avbryt','close_editor')+'</div><form class="registry-form registry-editor-form" data-reg-form="delete_customer" data-id="'+esc(customer.id)+'" aria-describedby="registry-delete-help"><h4>Bekräfta permanent radering</h4><p class="registry-hint" id="registry-delete-help">Åtgärden kan inte ångras. Skriv exakt kundnamnet &quot;'+esc(customer.name)+'&quot; eller URL-namnet &quot;'+esc(customer.slug)+'&quot;.</p><label>Exakt kundnamn eller URL-namn<input class="registry-input" type="text" name="confirmation" maxlength="120" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="registry-delete-help" required></label><button class="button secondary" type="submit">Radera permanent</button></form></section>';
  }

  async function request(body){
    const token=await window.Clerk?.session?.getToken();
    if(!token)throw new Error('Du behöver logga in igen.');
    const response=await fetch('/admin/api/registry',{method:body?'POST':'GET',credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(!response.ok){
      if(response.status===409)throw new Error('Registret har ändrats eller URL, domän, namn eller verifierad e-postadress är upptagen. Uppdatera listan innan du försöker igen.');
      if(response.status===422)throw new Error('Kontrollera fälten. URL-namn, domän, medlemsuppgifter, färger eller agentinställningar är ogiltiga.');
      throw new Error('Ändringen kunde inte bekräftas. Uppdatera registret för att kontrollera status. Ingen lyckad sparning antas.');
    }
    return response.json();
  }
  async function load(){busy=true;try{snapshot=await request();render();}catch{snapshot=null;render();}finally{busy=false;}}
  function state(text){const node=document.getElementById('registry-status');if(node)node.textContent=text;}
  async function mutate(command){
    if(busy||!snapshot)return;busy=true;root.querySelectorAll('button').forEach(node=>node.disabled=true);state('Sparar…');
    try{snapshot=await request({version:snapshot.version,command});render();state('Ändringen är sparad.');}catch(error){state(error.message);}finally{busy=false;root.querySelectorAll('button').forEach(node=>node.disabled=false);}
  }
  async function ensureDomain(id){
    if(busy||!snapshot)return;busy=true;root.querySelectorAll('button').forEach(node=>node.disabled=true);state('Kontrollerar Vercel och DNS…');
    try{
      const token=await window.Clerk?.session?.getToken();if(!token)throw new Error('Du behöver logga in igen.');
      const response=await fetch('/admin/api/customers/'+encodeURIComponent(id)+'/domain/ensure',{method:'POST',credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({version:snapshot.version})});
      if(!response.ok){if(response.status===503)throw new Error(managedDomain(snapshot.data.customers.find(customer=>customer.id===id))?'Wildcard-DNS är inte färdigverifierad i Vercel ännu. Den delade förhandsvisningen fungerar fortfarande.':'Den anpassade domänen kunde inte nå Vercel. Förhandsvisningen fungerar fortfarande.');throw new Error('Domänen kunde inte verifieras. Uppdatera registret och försök igen.');}
      const result=await response.json();await load();state(result.status==='ready'?'Domänen är verifierad och klar.':'Wildcard-domänen är tillagd. Konfigurera DNS/nameservers i Vercel och kontrollera igen.');
    }catch(error){state(error.message);}finally{busy=false;root.querySelectorAll('button').forEach(node=>node.disabled=false);}
  }

  root.addEventListener('click',event=>{
    const node=event.target instanceof Element?event.target.closest('[data-reg]'):null;if(!node||busy)return;
    const action=node.dataset.reg,id=node.dataset.id;
    if(action==='reload'){load();return;}if(action==='close_editor'){document.getElementById('registry-editor')?.replaceChildren();return;}if(!snapshot)return;
    if(action==='ensure_domain'){ensureDomain(id);return;}
    if(action==='edit_customer'){const customer=snapshot.data.customers.find(item=>item.id===id);if(!customer)return;document.getElementById('registry-editor').innerHTML=customerEditor(customer);document.getElementById('registry-editor').scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(action==='edit_publisher'){const publisher=snapshot.data.publishers.find(item=>item.id===id);if(!publisher)return;document.getElementById('registry-editor').innerHTML='<form class="registry-form" data-reg-form="rename_publisher" data-id="'+esc(id)+'">'+field('name','Publicistens namn',publisher.name)+'<button class="button teal" type="submit">Spara namn</button></form>';return;}
    const customer=snapshot.data.customers.find(customer=>customer.id===id);
    const item=customer||snapshot.data.publishers.find(publisher=>publisher.id===id);if(!item)return;
    if(action==='publish_customer'&&!confirm('Publicera '+item.name+' med kundsajt och aktiveringssida? Varumärkesuppgifterna blir offentliga; kunddata och konton publiceras inte.'))return;
    if(action==='archive_customer'&&!confirm('Arkivera kundsajten för '+item.name+'? Portalen blir omedelbart otillgänglig, men kundpost och inställningar bevaras så att sajten kan återställas.'))return;
    if(action==='delete_customer'){
      if(!customer)return;
      const editor=document.getElementById('registry-editor');if(!editor)return;
      editor.innerHTML=deleteCustomerEditor(customer);editor.scrollIntoView({block:'start',behavior:'smooth'});
      const confirmation=editor.querySelector('[name="confirmation"]');if(confirmation instanceof HTMLInputElement)confirmation.focus();return;
    }
    if(action==='archive_publisher'&&!confirm('Arkivera '+item.name+'? Befintliga kopplingar bevaras och posten kan återställas.'))return;
    mutate({action,id});
  });
  root.addEventListener('input',event=>{
    const addForm=event.target instanceof Element?event.target.closest('[data-reg-form="add_customer"]'):null;
    if(addForm){const name=addForm.querySelector('[name="name"]'),slug=addForm.querySelector('[name="slug"]');if(name&&slug){if(event.target===slug)addForm.dataset.slugManual=slug.value.trim()?'true':'false';else if(event.target===name&&addForm.dataset.slugManual!=='true')slug.value=availableSlug(name.value);}}
    if(event.target instanceof HTMLInputElement&&event.target.name==='positivity'){const output=event.target.closest('form')?.querySelector('[data-positivity-output]');if(output)output.textContent=event.target.value;}
    if(event.target instanceof HTMLInputElement&&event.target.name==='confirmation')event.target.setCustomValidity('');
  });
  root.addEventListener('submit',event=>{
    const form=event.target instanceof Element?event.target.closest('[data-reg-form]'):null;if(!form)return;event.preventDefault();
    const data=new FormData(form),action=form.dataset.regForm;
    if(action==='configure_customer_site'){
      mutate({action,id:form.dataset.id,site:{preset:String(data.get('preset')||'insight'),domain:String(data.get('domain')||'').trim().toLowerCase(),logoUrl:String(data.get('logoUrl')||'').trim(),primaryColor:String(data.get('primaryColor')||''),accentColor:String(data.get('accentColor')||''),heading:String(data.get('heading')||'').trim(),tagline:String(data.get('tagline')||'').trim(),agent:{enabled:data.get('agentEnabled')==='on',agentId:String(data.get('agentId')||'').trim(),clientKey:String(data.get('clientKey')||'').trim(),greeting:String(data.get('greeting')||'').trim(),positivity:Number(data.get('positivity')||5),tools:data.getAll('agentTools')}}});return;
    }
    if(action==='add_portal_member'){
      mutate({action,customerId:form.dataset.customerId,verifiedEmail:String(data.get('verifiedEmail')||'').trim().toLowerCase(),displayName:String(data.get('displayName')||'').trim(),role:String(data.get('role')||'customer_reader')});return;
    }
    if(action==='update_portal_member'){
      mutate({action,id:form.dataset.id,verifiedEmail:String(data.get('verifiedEmail')||'').trim().toLowerCase(),displayName:String(data.get('displayName')||'').trim(),role:String(data.get('role')||'customer_reader'),status:String(data.get('status')||'inactive')});return;
    }
    if(action==='delete_customer'){
      const customer=snapshot?.data?.customers?.find(customer=>customer.id===form.dataset.id);if(!customer)return;
      const input=form.querySelector('[name="confirmation"]');if(!(input instanceof HTMLInputElement))return;
      const confirmation=String(data.get('confirmation')||'').trim();
      if(confirmation!==customer.name&&confirmation!==customer.slug){input.setCustomValidity('Skriv exakt kundnamnet eller URL-namnet.');input.reportValidity();state('Raderingen avbröts: bekräftelsen matchade inte kundnamnet eller URL-namnet.');return;}
      input.setCustomValidity('');mutate({action,id:form.dataset.id,confirmation});return;
    }
    const command={action,name:String(data.get('name')||'').trim()};if(form.dataset.id)command.id=form.dataset.id;if(action==='add_customer')command.slug=String(data.get('slug')||'').trim();if(action==='update_customer')command.publisherIds=data.getAll('publisherIds');mutate(command);
  });
  function navigate(){if(started)render();}
  window.addEventListener('hashchange',navigate);document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('[data-action="navigate"]'))queueMicrotask(navigate);});document.addEventListener('content-online:workspace-ready',()=>{if(!started){started=true;load();}});
})();
`;
