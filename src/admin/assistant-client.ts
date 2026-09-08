export const assistantClient = String.raw`
(() => {
  'use strict';
  if(document.body.dataset.mode!=='admin')return;
  const launcher=document.getElementById('assistant-launcher');
  const panel=document.getElementById('assistant-panel');
  const close=document.getElementById('assistant-close');
  if(!launcher||!panel||!close)return;
  const setOpen=open=>{panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));(open?close:launcher).focus();};
  launcher.addEventListener('click',()=>setOpen(panel.hidden));
  close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setOpen(false);});

  const authHeaders=async()=>({Authorization:'Bearer '+await Clerk.session.getToken(),'Content-Type':'application/json'});
  document.addEventListener('content-online:workspace-ready',()=>activate(),{once:true});

  function activate(){
    document.getElementById('assistant-locked').hidden=true;
    document.getElementById('assistant-app').hidden=false;
    const messages=document.getElementById('assistant-messages');
    const form=document.getElementById('assistant-form');
    const input=document.getElementById('assistant-input');
    if(!messages||!form||!input)return;
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
        const answerResponse=await fetch('/admin/api/assistant/message',{method:'POST',headers:await authHeaders(),body:JSON.stringify({message:question}),cache:'no-store',credentials:'omit'});
        if(!answerResponse.ok)throw new Error('assistant');const answer=await answerResponse.json();addMessage('bot',answer.answer,answer.sources,answer.mode);
      }catch{addMessage('bot','Jag kunde inte svara just nu. Försök igen om en stund.');}
      finally{button.disabled=false;button.textContent='↑';input.focus();}
    });
    document.querySelectorAll('[data-prompt]').forEach(prompt=>prompt.addEventListener('click',()=>{input.value=prompt.dataset.prompt;form.requestSubmit();}));
  }
})();
`;
