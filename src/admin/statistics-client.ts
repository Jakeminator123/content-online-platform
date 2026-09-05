export const statisticsClient = String.raw`
const statisticsUI = (() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => new Intl.NumberFormat('sv-SE', {maximumFractionDigits:0}).format(n);
  const delta = row => row.requestsPrevYtd > 0 ? (row.requestsYtd / row.requestsPrevYtd - 1) * 100 : null;
  const percent = n => n === null ? 'Ingen jämförelse' : (n > 0 ? '+' : '') + new Intl.NumberFormat('sv-SE',{maximumFractionDigits:1}).format(n) + ' %';
  const find = (data, id) => data.statistics?.customers.find(c => c.customerId === id);
  function overview(data) {
    const customers = data.statistics?.customers || [];
    return '<section class="stats-focus"><div class="stats-heading"><div><div class="eyebrow">KUNDDIALOGEN / NÄSTA STEG</div><h2>Rätt insikt. För rätt kund.</h2><p>Utvalda statistikvyer med en tydlig motivering.</p></div><span class="pill green">Regelbaserat urval</span></div><div class="stats-customer-grid">' + customers.map(c => '<article class="stats-customer"><div class="row"><strong>' + esc(c.customerName) + '</strong><span class="pill ' + (c.status === 'synthetic' ? 'blue' : 'amber') + '">' + (c.status === 'synthetic' ? 'Syntetiskt underlag' : 'Statistik saknas') + '</span></div>' + (c.focus.recommendations.length ? '<ol>' + c.focus.recommendations.map(r => '<li><strong>' + esc(r.title) + '</strong><p>' + esc(r.reason) + '</p></li>').join('') : '<p class="stats-empty">Tilldelningar finns, men inga kundspecifika mätvärden. KTH:s användning återanvänds inte för denna kund.</p>') + '<button class="text-link" data-action="statistics" data-id="' + esc(c.customerId) + '">Öppna kundens statistik <span aria-hidden="true">↗</span></button></article>').join('') + '</div><p class="stats-footnote">Samma urvalsregler används i kundvyn, chatten och det befintliga dagliga kontrolljobbet. Urvalet beräknas vid läsning; ingen körhistorik sparas.</p></section>';
  }
  function detail(data, id, selected = 'products') {
    const c = find(data, id);
    if (!c || !c.products.length) return '<div class="soft-box"><strong>Inget kundspecifikt statistikunderlag</strong>Visa produkttilldelningen, men dra inte slutsatser om användning. Saknad data är inte noll användning.</div>';
    const view = ['products','publishers','changes'].includes(selected) ? selected : 'products';
    const table = (headers, rows) => '<div class="table-scroll"><table><caption class="stats-caption">KTH · januari–augusti 2026 · syntetiska exempel</caption><thead><tr>' + headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('') + '</tr></thead><tbody>' + rows.map(row=>'<tr>'+row.map((cell,i)=> i === 0 ? '<th scope="row">'+cell+'</th>' : '<td>'+cell+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    let body;
    if (view === 'publishers') {
      const groups = new Map();c.products.forEach(p=>groups.set(p.publisher,(groups.get(p.publisher)||0)+p.requestsYtd));
      body = table(['Publicist','Användning'],[...groups.entries()].sort((a,b)=>b[1]-a[1]).map(([name,value])=>[esc(name),fmt(value)]));
    } else if (view === 'changes') {
      body = table(['Produkt','2025','2026','Förändring'],[...c.products].sort((a,b)=>(delta(a)??Infinity)-(delta(b)??Infinity)).map(p=>[esc(p.title),p.requestsPrevYtd===null?'Saknas':fmt(p.requestsPrevYtd),fmt(p.requestsYtd),'<span class="pill '+(delta(p)<0?'amber':'green')+'">'+esc(percent(delta(p)))+'</span>']));
    } else {
      body = table(['Produkt','Publicist','Användning'],[...c.products].sort((a,b)=>b.requestsYtd-a.requestsYtd).map(p=>[esc(p.title),esc(p.publisher),fmt(p.requestsYtd)]));
    }
    return '<div class="stats-detail-intro"><strong>Utvalt för ' + esc(c.customerName) + '</strong><p>Prioriterat utifrån förändring, efterfrågan och förnyelsedatum.</p></div><div class="stats-recommendations">'+c.focus.recommendations.map(r=>'<div><strong>'+esc(r.title)+'</strong><p>'+esc(r.reason)+'</p></div>').join('')+'</div>'+c.focus.warnings.map(w=>'<p class="soft-box">'+esc(w)+'</p>').join('')+'<div class="stats-tabs" role="group" aria-label="Kundens statistikvyer">'+[['products','Produkter'],['publishers','Publicister'],['changes','Förändringar']].map(([value,label])=>'<button type="button" data-action="statistics" data-id="'+esc(id)+'" data-stat-view="'+value+'" aria-pressed="'+(value===view)+'">'+label+'</button>').join('')+'</div>'+body+'<p class="stats-footnote">Produktmått i en visningsdemo, inte unika personer eller verifierade COUNTER-rapporter. Alla jämförelser använder samma exempelperiod.</p>';
  }
  return { overview, detail };
})();
`;
