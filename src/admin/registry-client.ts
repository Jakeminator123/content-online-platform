export const registryClient = String.raw`
(() => {
  'use strict';
  let snapshot=null,salesforceStatus=null,busy=false,started=false,query='';
  const panel=document.getElementById('registry-panel'),root=document.getElementById('registry-body'),legacyView=document.getElementById('view'),search=document.getElementById('search');
  if(!panel||!root)return;
  if(legacyView){legacyView.hidden=true;legacyView.replaceChildren();}
  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const canonicalOrigin=()=>snapshot?.runtime?.customerSites?.canonicalOrigin||location.origin;
  const canonicalPathPrefix=()=>snapshot?.runtime?.customerSites?.pathPrefix||'/portal';
  const fallbackUrl=customer=>canonicalOrigin()+canonicalPathPrefix()+'/'+encodeURIComponent(customer.slug);
  const customerLoginUrl=customer=>canonicalOrigin()+'/login?portal='+encodeURIComponent(customer.slug);
  const managedDomain=customer=>{const rootDomain=snapshot?.runtime?.customerDomains?.rootDomain;return Boolean(rootDomain&&customer?.site?.domain&&customer.site.domain.endsWith('.'+rootDomain)&&!customer.site.domain.slice(0,-rootDomain.length-1).includes('.'));};
  const domainReady=customer=>customer.site?.domainStatus==='ready'||Boolean(snapshot?.runtime?.customerDomains?.wildcardReady&&managedDomain(customer));
  const url=customer=>domainReady(customer)&&customer.site.domain?'https://'+customer.site.domain:fallbackUrl(customer);
  const allowedDomain=customer=>customer.site?.domain?'https://'+customer.site.domain+' (och '+canonicalOrigin()+' för plattformens adress)':canonicalOrigin();
  const slugify=value=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,63).replace(/-+$/g,'');
  const availableSlug=value=>{const base=slugify(value);if(!base)return '';const taken=new Set(snapshot?.data?.customers?.map(customer=>customer.slug)||[]);if(!taken.has(base))return base;for(let number=2;number<1000;number++){const suffix='-'+number,candidate=base.slice(0,63-suffix.length).replace(/-+$/g,'')+suffix;if(!taken.has(candidate))return candidate;}return base;};
  const views=new Set(['overview','customers','users','cron','reports','connections','salesforce','publishers','products']);
  const view=()=>views.has(location.hash.slice(1))?location.hash.slice(1):'overview';
  const label={draft:'Utkast',published:'Publicerad',archived:'Arkiverad',active:'Aktiv',inactive:'Inaktiv',not_configured:'Inte konfigurerad',pending:'DNS väntar',ready:'Klar'};
  const roleLabel={customer_reader:'Läsare',customer_admin:'Kundadmin'};
  const toolLabels={portal_context:'Portalkontext och tonalitet',portal_navigation:'Navigera mellan tillåtna sektioner',portfolio_summary:'Sammanfatta portfölj',usage_summary:'Sammanfatta verifierad användning'};
  const button=(text,action,id,className='button secondary')=>'<button class="'+className+'" type="button" data-reg="'+action+'" data-id="'+esc(id||'')+'">'+esc(text)+'</button>';
  const pill=(text,tone='')=>'<span class="pill '+tone+'">'+esc(text)+'</span>';
  const matches=(...values)=>!query||values.some(value=>String(value??'').toLocaleLowerCase('sv').includes(query));
  const field=(name,title,value='',maxlength=120,type='text',hint='')=>'<label>'+esc(title)+'<input class="registry-input" type="'+type+'" name="'+name+'" value="'+esc(value)+'" maxlength="'+maxlength+'" '+(type==='password'?'autocomplete="off"':'')+' required>'+(hint?'<small class="registry-hint">'+esc(hint)+'</small>':'')+'</label>';
  const optionalField=(name,title,value='',maxlength=240,type='text',hint='')=>'<label>'+esc(title)+'<input class="registry-input" type="'+type+'" name="'+name+'" value="'+esc(value)+'" maxlength="'+maxlength+'" '+(type==='password'?'autocomplete="off"':'')+'>'+(hint?'<small class="registry-hint">'+esc(hint)+'</small>':'')+'</label>';
  const slugField=()=>'<label>Slug efter inloggning<input class="registry-input" type="text" name="slug" maxlength="63" minlength="2" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required aria-describedby="registry-slug-help"><small class="registry-hint" id="registry-slug-help">Kunden kommer till <output data-slug-preview>'+esc(canonicalOrigin()+canonicalPathPrefix()+'/{slug}')+'</output> efter inloggning. Ange bara sluggen, utan domän eller snedstreck.</small></label>';
  const swatch=customer=>'<span class="registry-swatch" aria-label="Temafärger"><i style="background:'+esc(customer.site.primaryColor)+'"></i><i style="background:'+esc(customer.site.accentColor)+'"></i></span>';

  const agentState=customer=>{
    if(!customer.site.agent.enabled)return 'Avstängd';
    const mode=snapshot?.runtime?.agentModeByCustomer?.[customer.id];
    return mode==='customer'?'Egen D-ID-konfiguration':mode==='platform_fallback'?'Gemensam D-ID-agent':mode==='incomplete'?'Ofullständig konfiguration':'Saknar konfiguration';
  };
  const domainState=customer=>customer.site.domain?(domainReady(customer)?'Klar':label[customer.site.domainStatus]||'Inte klar'):'Plattformens portaladress';
  const publisherName=id=>snapshot?.data?.publishers?.find(publisher=>publisher.id===id)?.name||id;
  const customerName=id=>snapshot?.data?.customers?.find(customer=>customer.id===id)?.name||'Okänd kund';
  const salesforceState=()=>salesforceStatus?.connected?'Ansluten':salesforceStatus?.configured?'Redo för OAuth':salesforceStatus?.unavailable?'Status kunde inte läsas':'Inte konfigurerad';
  const formattedSalesforceDate=()=>{if(!salesforceStatus?.updatedAt)return 'Ingen lyckad anslutning';const date=new Date(salesforceStatus.updatedAt);return Number.isNaN(date.getTime())?'Tidpunkt saknas':date.toLocaleString('sv-SE');};
  const header=(title,description)=>'<div class="card-head"><div><div class="eyebrow">SPARAT REGISTER · NEON</div><h2>'+esc(title)+'</h2><p>'+esc(description)+'</p></div>'+button('Uppdatera','reload')+'</div>';

  function overviewView(customers,publishers,members){
    const activeCustomers=customers.filter(customer=>customer.status!=='archived');
    const pendingDomains=customers.filter(customer=>customer.site.domain&&!domainReady(customer));
    const missingMembers=activeCustomers.filter(customer=>customer.kind==='customer'&&!members.some(member=>member.customerId===customer.id&&member.status==='active'));
    const next=[];
    if(!salesforceStatus?.connected)next.push('Salesforce: '+salesforceState()+'.');
    if(pendingDomains.length)next.push(pendingDomains.length+' kunddomän'+(pendingDomains.length===1?'':'er')+' väntar på verifiering.');
    if(missingMembers.length)next.push(missingMembers.length+' kund'+(missingMembers.length===1?'':'er')+' saknar aktiv portalanvändare.');
    if(!next.length)next.push('Inga öppna konfigurationssteg hittades i registret.');
    return '<div class="registry-overview"><div><strong>'+activeCustomers.length+'</strong><span>Aktiva kunder</span></div><div><strong>'+customers.filter(customer=>customer.status==='published').length+'</strong><span>Publicerade portaler</span></div><div><strong>'+members.filter(member=>member.status==='active').length+'</strong><span>Aktiva portalbehörigheter</span></div><div><strong>'+customers.filter(customer=>customer.salesforceAccountId).length+'</strong><span>Salesforce-kopplingar</span></div></div><div class="soft-box"><strong>Nästa att hantera</strong>'+next.map(item=>'<span>'+esc(item)+'</span>').join('')+'</div><p class="section-space"><a class="button teal" href="#customers">Hantera kunder</a> <a class="button secondary" href="#connections">Granska anslutningar</a></p>';
  }

  function customersView(customers,publishers){
    let html='<p>Skapa en kund genom att välja namn och slug. Alla kunder använder den gemensamma portalruntime som är publicerad från detta projekt.</p><form data-reg-form="add_customer" class="registry-form registry-create">'+field('name','Organisationsnamn')+slugField()+'<button class="button teal" type="submit">Lägg till kund</button></form>';
    const visible=customers.filter(customer=>matches(customer.name,customer.slug,customer.status,customer.site.domain,customer.publisherIds.map(publisherName).join(' ')));
    html+=visible.length?visible.map(customer=>{
      const preview=url(customer),login=customerLoginUrl(customer);
      return '<article class="registry-customer"><div class="registry-customer-main">'+swatch(customer)+'<div class="body"><strong>'+esc(customer.name)+'</strong><small>'+esc(label[customer.status])+' · Aktuell standarddashboard · '+esc(agentState(customer))+'</small><small><b>Portal efter inloggning:</b> '+esc(fallbackUrl(customer))+'</small><small><b>Egen domän (valfritt):</b> '+esc(customer.site.domain||'Inte konfigurerad')+(customer.site.domain?' · '+esc(domainState(customer)):'')+'</small><small><b>Publicister:</b> '+esc(customer.publisherIds.map(publisherName).join(', ')||'Inga valda')+'</small></div></div><div class="registry-actions">'+button('Styr kundsajt','edit_customer',customer.id,'button teal')+(customer.site.domain&&!domainReady(customer)?button('Kontrollera DNS','ensure_domain',customer.id):'')+(customer.status==='published'?'<a class="button secondary" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" href="'+esc(preview)+'">Granska kundsajt</a><a class="button secondary" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" href="'+esc(login)+'">Kundinloggning</a>'+button('Avpublicera','unpublish_customer',customer.id):customer.status==='draft'?button('Publicera','publish_customer',customer.id):button('Återställ till utkast','restore_customer',customer.id))+(customer.status!=='archived'?button('Arkivera kundsajt','archive_customer',customer.id):customer.kind!=='demo'?button('Radera permanent','delete_customer',customer.id):'')+'</div></article>';
    }).join(''):'<div class="empty"><h3>Ingen kund matchar sökningen</h3><p>Prova ett annat namn, slug eller status.</p></div>';
    return html+'<div id="registry-editor"></div><p class="footnote">Publicering gör dashboarden tillgänglig på /portal/{slug}. Inloggningen använder serverns medlemskap; sluggen ger aldrig behörighet. Permanent radering kräver först arkivering och därefter exakt sluggbekräftelse.</p>';
  }

  function usersView(customers,members){
    const visible=members.filter(member=>matches(member.displayName,member.verifiedEmail,member.role,member.status,customerName(member.customerId)));
    const rows=visible.map(member=>{
      const customer=customers.find(item=>item.id===member.customerId);
      const binding=member.identityBound===true?'Konto verifierat':member.identityBound===false?'Väntar på första verifierade inloggning':'Inloggningsstatus saknas';
      return '<div class="list-item"><div class="body"><strong>'+esc(member.displayName)+'</strong><small>'+esc(member.verifiedEmail)+' · '+esc(roleLabel[member.role]||member.role)+' · Behörighet '+esc((label[member.status]||member.status).toLocaleLowerCase('sv'))+'</small><small><b>Kund:</b> '+esc(customer?.name||'Kundpost saknas')+' · '+esc(binding)+'</small></div><div class="registry-actions">'+(customer?button('Hantera i kund','edit_customer',customer.id):'')+'</div></div>';
    }).join('');
    return '<p>Varje post är en portalbehörighet för en e-postadress och kundorganisation. En aktiv post kan vara en inbjudan som väntar på första verifierade inloggningen; identitetsleverantörens interna användar-id visas aldrig här.</p>'+(rows||'<div class="empty"><h3>Inga portalbehörigheter</h3><p>Lägg till en användare genom att öppna en kundorganisation.</p></div>')+'<div id="registry-editor"></div>';
  }

  function connectionsView(customers,publishers){
    const customerConnections=customers.filter(customer=>matches(customer.name,customer.slug,customer.site.domain,agentState(customer),domainState(customer)));
    const publisherConnections=publishers.filter(publisher=>matches(publisher.name,publisher.status,'datakälla saknas'));
    const customerRows=customerConnections.map(customer=>'<div class="list-item"><div class="body"><strong>'+esc(customer.name)+'</strong><small><b>Domän:</b> '+esc(domainState(customer))+(customer.site.domain?' · '+esc(customer.site.domain):'')+'</small><small><b>D-ID:</b> '+esc(agentState(customer))+'</small></div><div class="registry-actions">'+button('Styr kundsajt','edit_customer',customer.id)+'</div></div>').join('');
    const publisherRows=publisherConnections.map(publisher=>'<div class="list-item"><div class="body"><strong>'+esc(publisher.name)+'</strong><small>'+esc(label[publisher.status])+' · Datakälla saknas · '+customers.filter(customer=>customer.publisherIds.includes(publisher.id)).length+' kundkopplingar i registret</small></div>'+pill('Inte ansluten','amber')+'</div>').join('');
    return '<div class="grid-main"><section><div class="card-head"><div><h2>Plattform & kundsajter</h2><p>Endast verifierbara anslutningslägen</p></div>'+pill(salesforceState(),salesforceStatus?.connected?'green':'amber')+'</div><div class="card-body"><div class="soft-box"><strong>Salesforce</strong>'+esc(salesforceState())+(salesforceStatus?.connected?' · Senast sparad '+esc(formattedSalesforceDate()):'')+'</div>'+customerRows+'</div></section><section><div class="card-head"><div><h2>Publicistkällor</h2><p>Registerkoppling är inte dataintegration</p></div></div><div class="card-body">'+(publisherRows||'<div class="empty"><h3>Inga publicister</h3></div>')+'</div></section></div><div id="registry-editor"></div>';
  }

  function salesforceView(customers){
    const linked=customers.filter(customer=>customer.salesforceAccountId).length;
    const visible=customers.filter(customer=>matches(customer.name,customer.slug,customer.salesforceAccountName,customer.salesforceAccountId));
    const action=salesforceStatus?.configured?button(salesforceStatus.connected?'Auktorisera på nytt':'Anslut Salesforce','salesforce_connect','', 'button teal'):'';
    const rows=visible.map(customer=>{const eligible=customer.kind==='customer'&&customer.status!=='archived';const actions=(eligible?button(customer.salesforceAccountId?'Ändra koppling':'Lägg till koppling','edit_salesforce',customer.id):'')+(customer.salesforceAccountId?button('Koppla från','unlink_salesforce_account',customer.id):!eligible?pill(customer.kind==='demo'?'Skyddad pilot':'Arkiverad','amber'):'');return '<div class="list-item"><div class="body"><strong>'+esc(customer.name)+'</strong><small>'+(customer.salesforceAccountId?'<b>'+esc(customer.salesforceAccountName)+'</b> · '+esc(customer.salesforceAccountId):'Inget Salesforce Account sparat')+'</small></div><div class="registry-actions">'+actions+'</div></div>';}).join('');
    return '<div class="salesforce-hero"><div class="salesforce-brand"><div><div class="eyebrow">SALESFORCE · OAUTH</div><h2>'+esc(salesforceState())+'</h2><p>OAuth-status läses från servern. Endast en uttryckligen sparad Account-koppling visas per kund.</p></div></div><div class="salesforce-actions">'+action+'</div></div><div class="salesforce-metrics"><section class="sf-metric"><span>Kopplade kunder</span><strong>'+linked+'</strong><small>av '+customers.length+' registerposter</small></section><section class="sf-metric"><span>OAuth</span><strong>'+esc(salesforceStatus?.connected?'Klar':'—')+'</strong><small>'+esc(salesforceState())+'</small></section><section class="sf-metric"><span>API-version</span><strong>'+esc(salesforceStatus?.apiVersion||'—')+'</strong><small>Serverkonfiguration</small></section><section class="sf-metric"><span>Senast sparad</span><strong>'+esc(salesforceStatus?.updatedAt?new Date(salesforceStatus.updatedAt).toLocaleDateString('sv-SE'):'—')+'</strong><small>'+esc(formattedSalesforceDate())+'</small></section></div><div class="card-head"><div><h2>Kundkopplingar</h2><p>Sparade Salesforce Account-fält från kundregistret</p></div></div>'+(rows||'<div class="empty"><h3>Ingen kund matchar sökningen</h3></div>')+'<div id="registry-editor"></div><p class="footnote">Kontakter, affärer och förnyelser visas inte eftersom plattformen ännu inte har en verifierad import för dessa data.</p>';
  }

  function publishersView(customers,publishers){
    const visible=publishers.filter(publisher=>matches(publisher.name,publisher.status));
    let html='<p>Hantera publicistregistret. En registerpost eller kundkoppling ansluter inte automatiskt publicistens datakälla.</p><form data-reg-form="add_publisher" class="registry-form">'+field('name','Publicistens namn')+'<button class="button teal" type="submit">Lägg till publicist</button></form>';
    html+=visible.length?visible.map(publisher=>'<div class="list-item"><div class="body"><strong>'+esc(publisher.name)+'</strong><small>'+esc(label[publisher.status])+' · '+customers.filter(customer=>customer.publisherIds.includes(publisher.id)).length+' kundkopplingar · Datakälla saknas</small></div><div class="registry-actions">'+button('Byt namn','edit_publisher',publisher.id)+button(publisher.status==='active'?'Arkivera':'Återställ',publisher.status==='active'?'archive_publisher':'restore_publisher',publisher.id)+'</div></div>').join(''):'<div class="empty"><h3>Ingen publicist matchar sökningen</h3></div>';
    return html+'<div id="registry-editor"></div><p class="footnote">Arkivering stoppar nya kopplingar men bevarar befintliga relationer. Ingen extern licens eller datakälla påverkas.</p>';
  }

  function productsView(customers,publishers){
    const links=customers.flatMap(customer=>customer.publisherIds.map(publisherId=>({customer,publisher:publishers.find(item=>item.id===publisherId)}))).filter(link=>link.publisher&&matches(link.customer.name,link.customer.slug,link.publisher.name,link.customer.status,link.publisher.status));
    return '<div class="soft-box"><strong>Produktregister saknas</strong>Plattformen har ännu inget verifierat register över produkter eller produkt­tilldelningar. Nedan visas endast sparade kopplingar mellan kund och publicist.</div><div class="card-head section-space"><div><h2>Kund–publicistkopplingar</h2><p>Relationer i kundregistret, inte produkter eller licenser</p></div>'+pill(links.length+' kopplingar')+'</div>'+(links.length?links.map(link=>'<div class="list-item"><div class="body"><strong>'+esc(link.customer.name)+'</strong><small>'+esc(link.publisher.name)+' · Kund '+esc(label[link.customer.status])+' · Publicist '+esc(label[link.publisher.status])+'</small></div><div class="registry-actions">'+button('Hantera kund','edit_customer',link.customer.id)+'</div></div>').join(''):'<div class="empty"><h3>Inga kund–publicistkopplingar</h3><p>Koppla en publicist genom att öppna en kundorganisation.</p></div>')+'<div id="registry-editor"></div>';
  }

  function customerFlowView(customers,kind){
    const isCron=kind==='cron';
    const visible=customers.filter(customer=>matches(customer.name,customer.slug,customer.status,isCron?'cronjobb':'rapportflöde','inte anslutet'));
    return '<div class="soft-box"><strong>'+(isCron?'Inga cronjobb är anslutna':'Inga rapportflöden är anslutna')+'</strong>'+(isCron?'Plattformen har ännu inga verifierade schemalagda kundjobb.':'Plattformen har ännu inga verifierade rapportleveranser per kund.')+' Inga körningar kan startas från denna vy.</div><div class="card-head section-space"><div><h2>Kundorganisationer</h2><p>Status från det sparade kundregistret</p></div>'+pill(visible.length+' kunder')+'</div>'+(visible.length?visible.map(customer=>'<div class="list-item"><div class="body"><strong>'+esc(customer.name)+'</strong><small>'+esc(label[customer.status])+' · '+(customer.kind==='demo'?'Syntetisk pilot · ':'')+(isCron?'Cronjobb inte anslutet':'Rapportflöde inte anslutet')+'</small></div>'+pill('Inte anslutet','amber')+'</div>').join(''):'<div class="empty"><h3>Ingen kund matchar sökningen</h3></div>');
  }

  function render(){
    panel.hidden=false;
    if(legacyView){legacyView.hidden=true;legacyView.replaceChildren();}
    if(!snapshot){root.innerHTML='<div class="card-head"><div><h2>Sparat register</h2><p role="status">Registret kunde inte laddas. Kontrollera databasanslutningen och försök igen. Inga ändringar har sparats.</p></div>'+button('Försök igen','reload')+'</div><p id="registry-status" role="status"></p>';return;}
    const {customers,publishers,portalMembers=[]}=snapshot.data,current=view();
    const titles={overview:['Översikt','Kunder, åtkomst och anslutningar från det sparade registret.'],customers:['Kundsajter & styrning','Skapa, publicera och konfigurera kundorganisationer.'],users:['Portalanvändare','Sparade portalbehörigheter per kundorganisation.'],cron:['Cronjobb','Schemalagda kundjobb och deras verkliga anslutningsläge.'],reports:['Rapportflöde','Rapportleveranser per kund och deras verkliga anslutningsläge.'],connections:['Anslutningar','Faktiskt anslutningsläge för Salesforce, kunddomäner, D-ID och publicistkällor.'],salesforce:['Salesforce','OAuth-status och sparade Account-kopplingar.'],publishers:['Publicister','Content Onlines sparade publicistregister.'],products:['Kopplingar','Sparade kund–publicistrelationer; inget produktregister finns ännu.']};
    const content=current==='overview'?overviewView(customers,publishers,portalMembers):current==='customers'?customersView(customers,publishers):current==='users'?usersView(customers,portalMembers):current==='cron'||current==='reports'?customerFlowView(customers,current):current==='connections'?connectionsView(customers,publishers):current==='salesforce'?salesforceView(customers):current==='publishers'?publishersView(customers,publishers):productsView(customers,publishers);
    root.innerHTML=header(titles[current][0],titles[current][1])+'<div class="card-body">'+content+'<p id="registry-status" role="status"></p></div>';
  }

  function customerEditor(customer){
    const site=customer.site,agent=site.agent;
    const agentMode=snapshot.runtime?.agentModeByCustomer?.[customer.id];
    const defaultReady=snapshot.runtime?.agentDefaultConfigured===true;
    const publishers=snapshot.data.publishers.filter(publisher=>publisher.status==='active'||customer.publisherIds.includes(publisher.id));
    const preset='<label>Portal-mall<select class="registry-input" name="preset"><option value="insight" '+(site.preset==='insight'?'selected':'')+'>Standard · komplett</option><option value="library" '+(site.preset==='library'?'selected':'')+'>Library · kunskapsfokus</option><option value="minimal" '+(site.preset==='minimal'?'selected':'')+'>Minimal · avskalad</option></select></label>';
    const colors='<div class="registry-color-row"><label>Primärfärg<input class="registry-input registry-color" type="color" name="primaryColor" value="'+esc(site.primaryColor)+'"></label><label>Accentfärg<input class="registry-input registry-color" type="color" name="accentColor" value="'+esc(site.accentColor)+'"></label></div>';
    const tools=Object.keys(toolLabels).map(tool=>'<label class="registry-check"><input type="checkbox" name="agentTools" value="'+tool+'" '+(agent.tools.includes(tool)?'checked':'')+'>'+esc(toolLabels[tool])+'</label>').join('');
    const platformAgentText=agentMode==='customer'?'Egen D-ID-konfiguration är sparad. Testa widgeten på portalens faktiska origin.':agentMode==='platform_fallback'?'Den gemensamma D-ID-agenten är konfigurerad; inga kundunika D-ID-värden behövs. Testa widgeten på portalens faktiska origin.':defaultReady?'Den gemensamma D-ID-agenten är konfigurerad. Slå på reglaget och testa widgeten på portalens faktiska origin.':'Den gemensamma D-ID-agenten saknar giltig Agent ID/client key och widgeten förblir dold.';
    const customDomain='<details><summary>Egen domän (avancerat och valfritt)</summary>'+optionalField('domain','Hostname för egen domän',site.domain,253,'text','Exempel: kund.portal.contentonline.se. Lämna tomt för plattformens /portal/{slug}-adress.')+'<p class="registry-domain-note"><strong>D-ID Allowed Domains:</strong> '+esc(allowedDomain(customer))+'</p></details>';
    const agentOverride='<details '+(agent.agentId||agent.clientKey?'open':'')+'><summary>Egen D-ID-konfiguration (avancerat och valfritt)</summary><p class="registry-hint">Lämna båda fälten tomma för den gemensamma D-ID-agenten. En kundunik override kräver både Agent ID och client key.</p>'+optionalField('agentId','Agent ID',agent.agentId,128,'text','Exempel: v2_agt_...')+optionalField('clientKey','Client key från D-ID Embed',agent.clientKey,2048,'password','Browser key – aldrig D-ID API-nyckeln')+'</details>';
    return '<section class="registry-editor-card"><div class="registry-editor-head"><div><div class="eyebrow">STYR KUNDSAJT</div><h3>'+esc(customer.name)+'</h3><p>'+esc(url(customer))+'</p></div>'+button('Stäng','close_editor')+'</div><div class="soft-box"><strong>Portaladress efter inloggning</strong><a href="'+esc(fallbackUrl(customer))+'" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">'+esc(fallbackUrl(customer))+'</a><small>Slug: '+esc(customer.slug)+' · samma aktuella dashboard som övriga kunder.</small></div><form class="registry-form registry-editor-form" data-reg-form="update_customer" data-id="'+esc(customer.id)+'"><h4>Organisation & publicister</h4>'+field('name','Organisationsnamn',customer.name)+'<fieldset><legend>Publicister i kundens portal</legend>'+publishers.map(publisher=>'<label class="registry-check"><input type="checkbox" name="publisherIds" value="'+esc(publisher.id)+'" '+(customer.publisherIds.includes(publisher.id)?'checked':'')+'>'+esc(publisher.name)+(publisher.status==='archived'?' (arkiverad)':'')+'</label>').join('')+'</fieldset><button class="button teal" type="submit">Spara organisation</button></form><form class="registry-form registry-editor-form" data-reg-form="configure_customer_site" data-id="'+esc(customer.id)+'"><h4>Varumärke & portal</h4>'+preset+optionalField('logoUrl','Logotyp (publik HTTPS-adress)',site.logoUrl,500,'url','Tomt fält använder kundens initialer')+colors+field('heading','Portalrubrik',site.heading,120)+field('tagline','Ingress',site.tagline,240)+customDomain+'<fieldset class="registry-agent"><legend>D-ID-agent för '+esc(customer.name)+'</legend><label class="registry-switch"><input type="checkbox" name="agentEnabled" '+(agent.enabled?'checked':'')+'> Visa agenten på kundens portal</label><p class="registry-hint"><strong>'+esc(platformAgentText)+'</strong></p>'+agentOverride+field('greeting','Agentens hälsning',agent.greeting,240)+'<label>Positivitet: <output data-positivity-output>'+agent.positivity+'</output>/10<input class="registry-input registry-range" type="range" name="positivity" min="1" max="10" step="1" value="'+agent.positivity+'"></label><p class="registry-hint">Nivån styr ton, aldrig fakta. Agenten får inte dölja kostnader, nedgångar eller osäkerhet.</p><div class="registry-tools"><strong>Tillåtna klientverktyg</strong>'+tools+'</div></fieldset><button class="button teal" type="submit">Spara kundsajt</button></form>'+portalMembersEditor(customer)+'</section>';
  }

  const memberRoleOptions=role=>'<option value="customer_reader" '+(role==='customer_reader'?'selected':'')+'>Läsare</option><option value="customer_admin" '+(role==='customer_admin'?'selected':'')+'>Kundadmin</option>';
  const memberStatusOptions=status=>'<option value="active" '+(status==='active'?'selected':'')+'>Aktiv</option><option value="inactive" '+(status==='inactive'?'selected':'')+'>Inaktiv</option>';
  const roleField=role=>'<label>Roll<select class="registry-input" name="role">'+memberRoleOptions(role)+'</select></label>';
  function portalMembersEditor(customer){
    if(customer.kind==='demo')return '<div class="registry-form registry-editor-form" aria-labelledby="portal-members-heading"><h4 id="portal-members-heading">Portalanvändare</h4><p class="registry-hint">KTH är en syntetisk visningsdemo. Inga riktiga medlemskonton eller verifierade e-postadresser kan läggas till här.</p></div>';
    const members=(snapshot.data.portalMembers||[]).filter(member=>member.customerId===customer.id);
    const heading='<div class="registry-form registry-editor-form" aria-labelledby="portal-members-heading"><h4 id="portal-members-heading">Portalanvändare</h4><p class="registry-hint">Tillåt endast en e-postadress som kundens identitetsleverantör har verifierat. Behörigheten knyts server-side till denna kundorganisation.</p></div>';
    const existing=members.length?members.map(member=>'<form class="registry-form registry-editor-form" data-reg-form="update_portal_member" data-id="'+esc(member.id)+'" aria-label="Redigera portalanvändare '+esc(member.displayName)+'"><h4>'+esc(member.displayName)+' · '+esc(label[member.status])+'</h4>'+field('verifiedEmail','Verifierad e-postadress',member.verifiedEmail,254,'email')+field('displayName','Visningsnamn',member.displayName)+roleField(member.role)+'<label>Status<select class="registry-input" name="status">'+memberStatusOptions(member.status)+'</select></label><button class="button teal" type="submit">Spara portalanvändare</button></form>').join(''):'<p class="registry-hint">Inga portalbehörigheter har lagts till ännu.</p>';
    const add='<form class="registry-form registry-editor-form" data-reg-form="add_portal_member" data-customer-id="'+esc(customer.id)+'"><h4>Lägg till portalanvändare</h4>'+field('verifiedEmail','Verifierad e-postadress','',254,'email','Adressen måste vara verifierad vid inloggningen och matchas exakt efter normalisering.')+field('displayName','Visningsnamn')+roleField('customer_reader')+'<button class="button teal" type="submit">Lägg till portalanvändare</button></form>';
    return heading+existing+add;
  }

  function deleteCustomerEditor(customer){
    return '<section class="registry-editor-card" aria-labelledby="registry-delete-title"><div class="registry-editor-head"><div><div class="eyebrow">STEG 2 AV 2 · PERMANENT RADERING</div><h3 id="registry-delete-title">Radera '+esc(customer.name)+'</h3></div>'+button('Avbryt','close_editor')+'</div><form class="registry-form registry-editor-form" data-reg-form="delete_customer" data-id="'+esc(customer.id)+'" aria-describedby="registry-delete-help"><h4>Bekräfta permanent radering</h4><p class="registry-hint" id="registry-delete-help">Kundsajten är redan arkiverad och offline. Åtgärden kan inte ångras. Skriv exakt sluggen &quot;'+esc(customer.slug)+'&quot;.</p><label>Exakt slug<input class="registry-input" type="text" name="confirmation" maxlength="63" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="registry-delete-help" required></label><button class="button secondary" type="submit">Radera permanent</button></form></section>';
  }

  function salesforceEditor(customer){
    return '<section class="registry-editor-card" aria-labelledby="registry-salesforce-title"><div class="registry-editor-head"><div><div class="eyebrow">SALESFORCE ACCOUNT</div><h3 id="registry-salesforce-title">'+esc(customer.name)+'</h3><p>Spara endast en granskad Account-post.</p></div>'+button('Stäng','close_editor')+'</div><form class="registry-form registry-editor-form" data-reg-form="link_salesforce_account" data-id="'+esc(customer.id)+'"><h4>Kundkoppling</h4>'+field('accountName','Salesforce Account-namn',customer.salesforceAccountName||'',255)+'<label>Salesforce Account ID<input class="registry-input" type="text" name="accountId" value="'+esc(customer.salesforceAccountId||'')+'" maxlength="18" minlength="15" pattern="001[A-Za-z0-9]{12}(?:[A-Za-z0-9]{3})?" autocomplete="off" required><small class="registry-hint">Ett 15- eller 18-teckens Account ID som börjar med 001.</small></label><button class="button teal" type="submit">Spara koppling</button></form></section>';
  }

  async function adminToken(){
    const token=await window.Clerk?.session?.getToken();
    if(!token)throw new Error('Du behöver logga in igen.');
    return token;
  }
  async function request(body){
    const token=await adminToken();
    const response=await fetch('/admin/api/registry',{method:body?'POST':'GET',credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(!response.ok){
      if(response.status===409)throw new Error('Registret har ändrats eller URL, domän, namn eller verifierad e-postadress är upptagen. Uppdatera listan innan du försöker igen.');
      if(response.status===422)throw new Error('Kontrollera fälten. URL-namn, domän, medlemsuppgifter, färger eller agentinställningar är ogiltiga.');
      throw new Error('Ändringen kunde inte bekräftas. Uppdatera registret för att kontrollera status. Ingen lyckad sparning antas.');
    }
    return response.json();
  }
  async function loadSalesforceStatus(){
    try{
      const token=await adminToken();
      const response=await fetch('/admin/api/salesforce/status',{credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+token}});
      if(!response.ok)return {configured:false,connected:false,provider:'salesforce',unavailable:true};
      const status=await response.json();
      return status&&typeof status==='object'?status:{configured:false,connected:false,provider:'salesforce',unavailable:true};
    }catch{return {configured:false,connected:false,provider:'salesforce',unavailable:true};}
  }
  async function load(){
    busy=true;
    try{
      const results=await Promise.all([request(),loadSalesforceStatus()]);
      snapshot=results[0];salesforceStatus=results[1];render();
    }catch{snapshot=null;salesforceStatus={configured:false,connected:false,provider:'salesforce',unavailable:true};render();}
    finally{busy=false;}
  }
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

  async function connectSalesforce(){
    if(busy)return;busy=true;root.querySelectorAll('button').forEach(node=>node.disabled=true);state('Öppnar Salesforce…');
    try{
      const token=await adminToken();
      const response=await fetch('/admin/api/salesforce/oauth/start',{credentials:'same-origin',cache:'no-store',headers:{Authorization:'Bearer '+token}});
      if(!response.ok)throw new Error('Salesforce OAuth kunde inte startas.');
      const body=await response.json();
      if(typeof body.authorizationUrl!=='string'||!body.authorizationUrl.startsWith('https://'))throw new Error('Salesforce skickade ingen giltig auktoriseringsadress.');
      location.assign(body.authorizationUrl);
    }catch(error){state(error.message);busy=false;root.querySelectorAll('button').forEach(node=>node.disabled=false);}
  }

  root.addEventListener('click',event=>{
    const node=event.target instanceof Element?event.target.closest('[data-reg]'):null;if(!node||busy)return;
    const action=node.dataset.reg,id=node.dataset.id;
    if(action==='reload'){load();return;}if(action==='close_editor'){document.getElementById('registry-editor')?.replaceChildren();return;}if(!snapshot)return;
    if(action==='salesforce_connect'){connectSalesforce();return;}
    if(action==='ensure_domain'){ensureDomain(id);return;}
    if(action==='edit_customer'){const customer=snapshot.data.customers.find(item=>item.id===id);if(!customer)return;document.getElementById('registry-editor').innerHTML=customerEditor(customer);document.getElementById('registry-editor').scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(action==='edit_publisher'){const publisher=snapshot.data.publishers.find(item=>item.id===id);if(!publisher)return;document.getElementById('registry-editor').innerHTML='<form class="registry-form" data-reg-form="rename_publisher" data-id="'+esc(id)+'">'+field('name','Publicistens namn',publisher.name)+'<button class="button teal" type="submit">Spara namn</button></form>';return;}
    const customer=snapshot.data.customers.find(customer=>customer.id===id);
    if(action==='edit_salesforce'){if(!customer)return;const editor=document.getElementById('registry-editor');if(!editor)return;editor.innerHTML=salesforceEditor(customer);editor.scrollIntoView({block:'start',behavior:'smooth'});return;}
    if(action==='unlink_salesforce_account'){if(!customer||!confirm('Koppla från Salesforce Account för '+customer.name+'? Kundposten och Salesforce-anslutningen bevaras.'))return;mutate({action,id});return;}
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
    if(addForm){const name=addForm.querySelector('[name="name"]'),slug=addForm.querySelector('[name="slug"]'),preview=addForm.querySelector('[data-slug-preview]');if(name&&slug){if(event.target===slug)addForm.dataset.slugManual=slug.value.trim()?'true':'false';else if(event.target===name&&addForm.dataset.slugManual!=='true')slug.value=availableSlug(name.value);if(preview)preview.textContent=canonicalOrigin()+canonicalPathPrefix()+'/'+(slug.value||'{slug}');}}
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
    if(action==='link_salesforce_account'){
      mutate({action,id:form.dataset.id,accountName:String(data.get('accountName')||'').trim(),accountId:String(data.get('accountId')||'').trim()});return;
    }
    if(action==='delete_customer'){
      const customer=snapshot?.data?.customers?.find(customer=>customer.id===form.dataset.id);if(!customer)return;
      const input=form.querySelector('[name="confirmation"]');if(!(input instanceof HTMLInputElement))return;
      const confirmation=String(data.get('confirmation')||'').trim();
      if(confirmation!==customer.slug){input.setCustomValidity('Skriv exakt kundens slug.');input.reportValidity();state('Raderingen avbröts: bekräftelsen matchade inte kundens slug.');return;}
      input.setCustomValidity('');mutate({action,id:form.dataset.id,confirmation});return;
    }
    const command={action,name:String(data.get('name')||'').trim()};if(form.dataset.id)command.id=form.dataset.id;if(action==='add_customer')command.slug=String(data.get('slug')||'').trim();if(action==='update_customer')command.publisherIds=data.getAll('publisherIds');mutate(command);
  });
  function navigate(){if(!started)return;query='';if(search)search.value='';render();}
  if(search)search.addEventListener('input',()=>{query=search.value.trim().toLocaleLowerCase('sv');if(started)render();});
  window.addEventListener('hashchange',navigate);document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('[data-action="navigate"]'))queueMicrotask(navigate);});document.addEventListener('content-online:workspace-ready',()=>{if(!started){started=true;load();}});
})();
`;
