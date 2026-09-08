export const registryClient = String.raw`
(() => {
  'use strict';
  let snapshot=null, busy=false, started=false;
  const panel=document.getElementById('registry-panel'),root=document.getElementById('registry-body');
  if(!panel||!root)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url=c=>'https://fokus-psi-sable.vercel.app/o/'+encodeURIComponent(c.slug);
  const activationUrl=c=>url(c)+'/login';
  const slugify=value=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,63).replace(/-+$/g,'');
  const view=()=>location.hash.slice(1)||'overview';
  const label={draft:'Utkast',published:'Publicerad',archived:'Arkiverad',active:'Aktiv'};
  const button=(text,action,id)=>'<button class="button secondary" type="button" data-reg="'+action+'" data-id="'+esc(id||'')+'">'+esc(text)+'</button>';
  const field=(name,title,value='',maxlength=120)=>'<label>'+title+'<input class="registry-input" name="'+name+'" value="'+esc(value)+'" maxlength="'+maxlength+'" required></label>';
  function render(){
    panel.hidden=!['overview','customers','publishers'].includes(view());
    if(panel.hidden)return;
    if(!snapshot){root.innerHTML='<h2>Sparat register</h2><p role="status">Registret kunde inte laddas. Kontrollera databasanslutningen och försök igen. Inga ändringar har sparats.</p>'+button('Försök igen','reload');return;}
    const {customers,publishers}=snapshot.data;
    let html='<div class="card-head"><div><div class="eyebrow">SPARAT REGISTER · NEON</div><h2>'+ (view()==='publishers'?'Content Onlines publicister':view()==='customers'?'Content Onlines kunder':'Kunder & publicister')+'</h2><p>Version '+snapshot.version+' · Ändringar sparas mellan inloggningar.</p></div>'+button('Uppdatera','reload')+'</div>';
    if(view()==='overview') html+='<p>'+customers.filter(c=>c.status!=='archived').length+' kunder · '+publishers.filter(p=>p.status==='active').length+' aktiva publicister</p><p><a class="button teal" href="#customers">Hantera kunder</a> <a class="button secondary" href="#publishers">Hantera publicister</a></p><p class="footnote">Statistikvyerna nedan är separat syntetisk demo, inte hämtade från detta register.</p>';
    if(view()==='customers'){
      html+='<p>En egen kundyta per organisation i den gemensamma portalen. Publicering delar namn, kundyta och aktiveringssida – aldrig användare eller intern data. Inget nytt repo eller Vercel-projekt behövs.</p><form data-reg-form="add_customer" class="registry-form">'+field('name','Organisationsnamn')+field('slug','URL-namn (föreslås automatiskt)', '', 63)+'<button class="button teal" type="submit">Lägg till kund</button></form>';
      html+=customers.map(c=>'<div class="list-item"><div class="body"><strong>'+esc(c.name)+'</strong><small>'+esc(label[c.status])+' · '+(c.kind==='demo'?'Syntetisk demo':'Kundkonton inväntar aktivering')+'</small><small>Kundyta: '+esc(url(c))+'</small><small>Aktivering: '+esc(activationUrl(c))+'</small><small>'+c.publisherIds.map(id=>esc(publishers.find(p=>p.id===id)?.name||id)).join(', ')+'</small></div><div class="registry-actions">'+button('Styr kund','edit_customer',c.id)+(c.status==='published'?'<a class="button secondary" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" href="'+url(c)+'">Granska kundyta</a><a class="button secondary" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" href="'+activationUrl(c)+'">Aktiveringssida</a>'+button('Avpublicera','unpublish_customer',c.id):c.status==='draft'?button('Publicera','publish_customer',c.id):button('Återställ till utkast','restore_customer',c.id))+(c.status!=='archived'?button('Arkivera','archive_customer',c.id):'')+'</div></div>').join('');
      html+='<div id="registry-editor"></div><p class="footnote">Publicera för att granska kundytan live. URL-namn återanvänds inte efter arkivering. KTH-konton gäller bara KTH:s syntetiska demo. Nya kunder får ingen KTH-data eller kundåtkomst förrän riktig medlemsinloggning har kopplats in.</p>';
    }
    if(view()==='publishers'){
      html+='<p>Hantera partnerregistret. Att lägga till en publicist ansluter inte automatiskt dess API eller informationsprodukter.</p><form data-reg-form="add_publisher" class="registry-form">'+field('name','Publicistens namn')+'<button class="button teal" type="submit">Lägg till publicist</button></form>';
      html+=publishers.map(p=>'<div class="list-item"><div class="body"><strong>'+esc(p.name)+'</strong><small>'+label[p.status]+' · '+customers.filter(c=>c.publisherIds.includes(p.id)).length+' kundkopplingar</small></div><div class="registry-actions">'+button('Byt namn','edit_publisher',p.id)+button(p.status==='active'?'Arkivera':'Återställ',p.status==='active'?'archive_publisher':'restore_publisher',p.id)+'</div></div>').join('');
      html+='<div id="registry-editor"></div><p class="footnote">Arkivering stoppar nya tilldelningar men bevarar befintliga kopplingar. Ingen historik eller extern licens raderas.</p>';
    }
    root.innerHTML=html+'<p id="registry-status" role="status"></p>';
  }
  async function request(body){
    const token=await window.Clerk?.session?.getToken();
    if(!token)throw new Error('Du behöver logga in igen.');
    const response=await fetch('/admin/api/registry',{method:body?'POST':'GET',credentials:'omit',cache:'no-store',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(!response.ok){
      if(response.status===409)throw new Error('Registret har ändrats eller URL/namnet är upptaget. Uppdatera listan innan du försöker igen.');
      if(response.status===422)throw new Error('Kontrollera fälten. URL-namn får innehålla små bokstäver, siffror och bindestreck (2–63 tecken).');
      throw new Error('Ändringen kunde inte bekräftas. Uppdatera registret för att kontrollera status. Ingen lyckad sparning antas.');
    }
    return response.json();
  }
  async function load(){
    busy=true;
    try{snapshot=await request();render();}catch{snapshot=null;render();}finally{busy=false;}
  }
  function state(text){let p=document.getElementById('registry-status');if(p)p.textContent=text;}
  async function mutate(command){
    if(busy||!snapshot)return;
    busy=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);state('Sparar…');
    try{snapshot=await request({version:snapshot.version,command});render();state('Ändringen är sparad.');}
    catch(error){state(error.message);}
    finally{busy=false;root.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  root.addEventListener('click',event=>{
    const b=event.target.closest('[data-reg]');if(!b||busy)return;
    const action=b.dataset.reg,id=b.dataset.id;
    if(action==='reload'){load();return;}
    if(!snapshot)return;
    if(action==='edit_customer'){
      const c=snapshot.data.customers.find(c=>c.id===id);if(!c)return;
      document.getElementById('registry-editor').innerHTML='<form class="registry-form" data-reg-form="update_customer" data-id="'+esc(id)+'"><div><h3>Styr '+esc(c.name)+'</h3><p class="footnote">'+esc(label[c.status])+' · '+esc(url(c))+'</p></div>'+field('name','Organisationsnamn',c.name)+'<fieldset><legend>Publicister för kunden (inte produktspecifika licenser)</legend>'+snapshot.data.publishers.filter(p=>p.status==='active'||c.publisherIds.includes(p.id)).map(p=>'<label class="registry-check"><input type="checkbox" name="publisherIds" value="'+esc(p.id)+'" '+(c.publisherIds.includes(p.id)?'checked':'')+'>'+esc(p.name)+(p.status==='archived'?' (arkiverad)':'')+'</label>').join('')+'</fieldset><button class="button teal" type="submit">Spara kund</button></form>';
      document.getElementById('registry-editor').scrollIntoView({block:'nearest'});
      return;
    }
    if(action==='edit_publisher'){
      const p=snapshot.data.publishers.find(p=>p.id===id);if(!p)return;
      document.getElementById('registry-editor').innerHTML='<form class="registry-form" data-reg-form="rename_publisher" data-id="'+esc(id)+'">'+field('name','Publicistens namn',p.name)+'<button class="button teal" type="submit">Spara namn</button></form>';return;
    }
    const item=snapshot.data.customers.find(c=>c.id===id)||snapshot.data.publishers.find(p=>p.id===id);
    if(action==='publish_customer'&&!confirm('Publicera '+item.name+' med egen kundyta och aktiveringssida? Namnet blir offentligt. Kunddata och konton publiceras inte.'))return;
    if(action.startsWith('archive_')&&!confirm('Arkivera '+item.name+'? Kundportalen blir otillgänglig om detta är en kund. Posten kan återställas.'))return;
    mutate({action,id});
  });
  root.addEventListener('input',event=>{
    const form=event.target.closest('[data-reg-form="add_customer"]');if(!form)return;
    const name=form.querySelector('[name="name"]'),slug=form.querySelector('[name="slug"]');if(!name||!slug)return;
    if(event.target===slug){form.dataset.slugManual=slug.value.trim()?'true':'false';return;}
    if(event.target===name&&form.dataset.slugManual!=='true')slug.value=slugify(name.value);
  });
  root.addEventListener('submit',event=>{
    const form=event.target.closest('[data-reg-form]');if(!form)return;event.preventDefault();
    const data=new FormData(form),action=form.dataset.regForm;
    const command={action,name:String(data.get('name')||'').trim()};
    if(form.dataset.id)command.id=form.dataset.id;
    if(action==='add_customer')command.slug=String(data.get('slug')||'').trim();
    if(action==='update_customer')command.publisherIds=data.getAll('publisherIds');
    mutate(command);
  });
  function navigate(){if(started)render();}
  window.addEventListener('hashchange',navigate);
  document.addEventListener('click',event=>{if(event.target.closest('[data-action="navigate"]'))queueMicrotask(navigate);});
  document.addEventListener('content-online:workspace-ready',()=>{if(!started){started=true;load();}});
})();
`;
