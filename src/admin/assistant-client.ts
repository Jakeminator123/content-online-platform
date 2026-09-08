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
    const agentLink=document.getElementById('assistant-agent-open');
    const agentStatus=document.getElementById('assistant-agent-status');
    const agentRetry=document.getElementById('assistant-agent-retry');
    const configureAgentLink=async()=>{
      agentLink.hidden=true;agentLink.removeAttribute('href');agentRetry.hidden=true;agentRetry.disabled=true;
      agentStatus.textContent='Hämtar agentens länk…';
      try{
        const response=await fetch('/admin/api/assistant/agent',{headers:await authHeaders(false),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw new Error('agent_config');
        const config=await response.json();
        if(!config.configured){agentStatus.textContent='D-ID-agentens länk är inte konfigurerad. Textchatten fungerar fortfarande.';agentRetry.hidden=false;return;}
        const target=new URL(config.url);
        if(target.origin!=='https://studio.d-id.com'||target.pathname!=='/agents/share'||target.username||target.password||target.hash||!target.searchParams.get('id')||!target.searchParams.get('key'))throw new Error('agent_destination');
        // A normal, user-clicked link avoids popup blockers and never forwards our session or chat.
        agentLink.href=target.href;agentLink.hidden=false;
        agentStatus.textContent='Separat dokumentationsagent utan åtkomst till adminverktyg. Skriv inga personuppgifter, avtal eller hemligheter.';
      }catch{
        agentStatus.textContent='Agentens länk kunde inte hämtas. Försök igen; textchatten fungerar fortfarande.';
        agentRetry.hidden=false;
      }finally{agentRetry.disabled=false;}
    };
    agentRetry.addEventListener('click',()=>configureAgentLink());
    void configureAgentLink();

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
    const presenterButton=document.getElementById('assistant-presenter-enable');
    const presenterStatus=document.getElementById('assistant-presenter-status');
    const presenterStage=document.getElementById('assistant-presenter-stage');
    let didApi=null;
    let presenterNeedsReload=false;
    let presenterPhase='config';
    const waitForPresenterApi=()=>new Promise((resolve,reject)=>{
      const deadline=Date.now()+15000;
      const check=()=>{
        const api=window.DID_AGENTS_API;
        if(typeof api?.configure==='function'&&typeof api?.functions?.speak==='function'){resolve(api);return;}
        if(Date.now()>=deadline){reject(new Error('presenter_init_timeout'));return;}
        setTimeout(check,100);
      };
      check();
    });
    const activatePresenter=async()=>{
      if(presenterNeedsReload){window.location.reload();return;}
      presenterPhase='config';
      presenterButton.disabled=true;presenterStatus.textContent='Kontrollerar D-ID-konfiguration…';
      const response=await fetch('/admin/api/assistant/presenter',{headers:await authHeaders(false),cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error('presenter_config');
      const config=await response.json();
      if(!config.configured){presenterButton.textContent='Inte konfigurerad';presenterStatus.textContent='D-ID saknar Agent ID eller domänbegränsad client key.';return;}
      presenterPhase='script';
      presenterStatus.textContent='Laddar röstavataren…';presenterStage.hidden=false;
      const script=document.createElement('script');script.type='module';script.src='https://agent.d-id.com/v2/index.js';
      // D-ID auto-initializes only the script selected by this exact attribute.
      script.dataset.name='did-agent';
      script.dataset.mode='full';script.dataset.targetId='assistant-presenter-stage';script.dataset.clientKey=config.clientKey;script.dataset.agentId=config.agentId;
      script.dataset.autoConnect='true';script.dataset.showRestartButton='false';script.dataset.showAgentName='false';script.dataset.track='false';
      await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error('presenter_script_timeout')),15000);
        script.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});
        script.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('presenter_script_load'));},{once:true});
        presenterNeedsReload=true;document.body.appendChild(script);
      });
      presenterPhase='initialization';
      // A module load event can precede registration of the asynchronous UI methods.
      didApi=await waitForPresenterApi();
      didApi.configure({showChatToggle:false,showMicToggle:false,showRestartButton:false,autoConnect:true});
      presenterButton.textContent='Röstavatar aktiv';presenterStatus.textContent='Aktiv utan mikrofon. Endast färdiga assistentsvar skickas till D-ID för uppläsning.';
    };
    presenterButton.addEventListener('click',()=>activatePresenter().catch(()=>{
      didApi=null;presenterStage.hidden=true;presenterButton.disabled=false;
      presenterButton.textContent=presenterNeedsReload?'Ladda om och försök igen':'Försök igen';
      const explanation=presenterPhase==='config'?'Adminsessionen eller D-ID-konfigurationen kunde inte hämtas.':presenterPhase==='script'?'D-ID:s skript kunde inte laddas.':'D-ID kunde inte initieras. Kontrollera agenten och client keyns tillåtna domän.';
      presenterStatus.textContent=explanation+' Textchatten fungerar fortfarande.';
      // Only a fixed stage label; never log config, keys, tokens, questions or provider payloads.
      console.warn('content_online_presenter_start_failed',{stage:presenterPhase});
    }));
    const speakAnswer=text=>{
      if(!didApi)return;
      const speechText=text.replace(/\n+Källor:[\s\S]*$/u,'').trim();
      if(!speechText)return;
      try{Promise.resolve(didApi.functions.speak({type:'text',input:speechText})).catch(()=>{presenterStatus.textContent='Svaret visas i text men kunde inte läsas upp av D-ID.';});}
      catch{presenterStatus.textContent='Svaret visas i text men kunde inte läsas upp av D-ID.';}
    };
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
        if(!answerResponse.ok)throw new Error('assistant');const answer=await answerResponse.json();addMessage('bot',answer.answer,answer.sources,answer.mode);speakAnswer(answer.answer);
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
