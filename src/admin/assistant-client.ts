export const assistantClient = String.raw`
(() => {
  'use strict';
  const launcher=document.getElementById('assistant-launcher');
  const panel=document.getElementById('assistant-panel');
  const close=document.getElementById('assistant-close');
  if(!launcher||!panel||!close)return;
  const setOpen=open=>{panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));(open?close:launcher).focus();};
  launcher.addEventListener('click',()=>setOpen(panel.hidden));
  close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setOpen(false);});
  if(document.body.dataset.mode!=='admin')return;

  const dataAccess=role=>role==='Kundadministratör'?['Komplett tillåten kundbild','Kostnad','Användare och roller']:['Aktiv portfölj','Publicerad usage','Egna ärenden'];
  const authHeaders=async json=>({Authorization:'Bearer '+await Clerk.session.getToken(),...(json?{'Content-Type':'application/json'}:{})});
  document.addEventListener('content-online:workspace-ready',event=>activate(event.detail.workspace).catch(()=>{}),{once:true});

  async function activate(workspace){
    document.getElementById('assistant-locked').hidden=true;
    document.getElementById('assistant-app').hidden=false;
    const tabs=document.querySelectorAll('[data-assistant-tab]');
    tabs.forEach(tab=>tab.addEventListener('click',()=>{
      tabs.forEach(item=>{const active=item===tab;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active));});
      document.querySelectorAll('.assistant-view').forEach(view=>{const active=view.id==='assistant-view-'+tab.dataset.assistantTab;view.hidden=!active;view.classList.toggle('active',active);});
    }));

    const customerTarget=document.getElementById('assistant-customers');
    workspace.customers.forEach(customer=>{
      const card=document.createElement('article');card.className='assistant-customer';
      const head=document.createElement('div');head.className='assistant-customer-head';
      const copy=document.createElement('div');const title=document.createElement('h4');title.textContent=customer.name;
      const detail=document.createElement('p');detail.textContent=customer.users+' användare · '+customer.products+' produkter';
      const state=document.createElement('span');state.className='pill';state.textContent=customer.status;
      copy.append(title,detail);head.append(copy,state);card.append(head);
      const tags=document.createElement('div');tags.className='assistant-tags';['Produkter','Användning','Dokument','Ärenden'].forEach(area=>{const tag=document.createElement('span');tag.textContent=area;tags.appendChild(tag);});card.appendChild(tags);customerTarget.appendChild(card);
      workspace.users.filter(user=>user.customerId===customer.id).forEach(user=>{
        const userCard=document.createElement('article');userCard.className='assistant-user';
        const userTitle=document.createElement('h4');userTitle.textContent=user.name+' · '+user.role;
        const access=document.createElement('p');access.textContent=dataAccess(user.role).join(' · ');
        userCard.append(userTitle,access);customerTarget.appendChild(userCard);
      });
    });

    const messages=document.getElementById('assistant-messages');
    const form=document.getElementById('assistant-form');
    const input=document.getElementById('assistant-input');
    const addMessage=(role,text,sources=[],mode)=>{
      const row=document.createElement('div');row.className='assistant-message '+role;
      const bubble=document.createElement('div');bubble.textContent=text;if(mode){const label=document.createElement('strong');label.className='assistant-answer-mode';label.textContent=mode==='openai'?'AI-svar':'Faktasvar · AI är inte tillgänglig';bubble.prepend(label);}row.appendChild(bubble);messages.appendChild(row);
      if(sources.length){const badges=document.createElement('div');badges.className='assistant-sources';sources.forEach(source=>{const badge=document.createElement('span');badge.textContent=source;badges.appendChild(badge);});messages.appendChild(badges);}
      messages.scrollTop=messages.scrollHeight;
    };
    form.addEventListener('submit',async event=>{
      event.preventDefault();const question=input.value.trim();const button=form.querySelector('button');if(!question||button.disabled)return;
      addMessage('user',question);input.value='';button.disabled=true;button.textContent='…';
      try{
        const answerResponse=await fetch('/admin/api/assistant/message',{method:'POST',headers:await authHeaders(true),body:JSON.stringify({message:question}),cache:'no-store',credentials:'omit'});
        if(!answerResponse.ok)throw new Error('assistant');const answer=await answerResponse.json();addMessage('bot',answer.answer,answer.sources,answer.mode);
      }catch{addMessage('bot','Jag kunde inte svara just nu. Försök igen om en stund.');}
      finally{button.disabled=false;button.textContent='↑';input.focus();}
    });
    document.querySelectorAll('[data-prompt]').forEach(prompt=>prompt.addEventListener('click',()=>{input.value=prompt.dataset.prompt;form.requestSubmit();}));

    const jobsResponse=await fetch('/admin/api/jobs',{headers:await authHeaders(false),cache:'no-store',credentials:'omit'});
    if(!jobsResponse.ok)return;
    const jobsData=await jobsResponse.json();const jobsTarget=document.getElementById('assistant-jobs');const resultTarget=document.getElementById('assistant-job-result');
    jobsData.jobs.forEach(job=>{
      const card=document.createElement('article');card.className='assistant-job';const head=document.createElement('div');head.className='assistant-job-head';
      const copy=document.createElement('div');const title=document.createElement('h4');title.textContent=job.title;const detail=document.createElement('p');detail.textContent=job.description;copy.append(title,detail);
      const schedule=document.createElement('span');schedule.className='pill';schedule.textContent=job.schedule;head.append(copy,schedule);card.appendChild(head);
      const run=document.createElement('button');run.type='button';run.textContent='Kör kontroll nu';run.addEventListener('click',async()=>{
        run.disabled=true;run.textContent='Kör…';resultTarget.hidden=true;
        try{const response=await fetch('/admin/api/jobs/'+encodeURIComponent(job.id)+'/run',{method:'POST',headers:await authHeaders(false),cache:'no-store',credentials:'omit'});if(!response.ok)throw new Error('job');const payload=await response.json();resultTarget.textContent='';const strong=document.createElement('strong');strong.textContent=payload.execution.status==='completed'?'Kontrollen är klar':'Kontrollen behöver åtgärd';resultTarget.append(strong,document.createTextNode(payload.execution.summary+' Resultatet sparas inte ännu.'));resultTarget.hidden=false;}
        catch{resultTarget.textContent='Jobbet kunde inte köras just nu.';resultTarget.hidden=false;}
        finally{run.disabled=false;run.textContent='Kör kontroll nu';}
      });card.appendChild(run);jobsTarget.appendChild(card);
    });
  }
})();
`;
