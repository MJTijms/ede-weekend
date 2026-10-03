import {PLAYERS,GAMES,PADEL,MATCHES,PACKING,PLANNING} from './data.js';
import {emptyState,validateState,standings,resultFrom} from './scoring.js';
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={trophy:'M8 21h8M12 17v4M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H4v3a4 4 0 0 0 4 4M17 5h3v3a4 4 0 0 1-4 4',calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',bag:'M5 6h14l1 15H4L5 6ZM9 6V4a3 3 0 0 1 6 0v2M9 11h6',dice:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01',padel:'M16 3a6 8 35 1 0 0 14 6 8 35 1 0 0-14ZM7 17l-4 5M6 19l2 2M12 6h.01M16 8h.01M11 10h.01M15 12h.01',heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',check:'m5 12 4 4L19 6',arrow:'M7 17 17 7M7 7h10v10',edit:'m14 4 6 6M4 20l4-1L21 6l-4-4L4 15v5Z',info:'M12 10v7M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',music:'M9 18V5l12-2v13M9 8l12-2M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3M21 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3',chat:'M21 11a8 8 0 0 1-8 8H4l-3 3V9a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8Z',spy:'M4 10h16M8 10l2-7h4l2 7M5 15a3 3 0 1 0 6 0H5ZM13 15a3 3 0 1 0 6 0h-6ZM11 15h2'};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.info}"/></svg>`;
const views=[['klassement','Klassement','trophy'],['planning','Planning','calendar'],['paklijst','Paklijst','bag'],['game-night','Game Night','dice'],['padel','Padel','padel'],['gedrag','Gedrag','heart']];
let state=emptyState(),editable=false,csrf='',mode='public',rounds={'game-night':0,padel:0},busy=false,saveError='',publishError='',pending=false,currentMatch=null,selectedWinner=null,toastTimer;
const currentView=()=>views.some(v=>v[0]===location.hash.slice(1))?location.hash.slice(1):'klassement';
const initials=name=>name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
const signed=n=>n>0?`+${n}`:n;
function toast(message,undo) {
 clearTimeout(toastTimer);const element=$('#toast');element.innerHTML=`<span>${escape(message)}</span>${undo?'<button>Ongedaan maken</button>':''}`;
 if(undo) element.querySelector('button').onclick=()=>{element.classList.remove('show');undo();};
 element.classList.add('show');toastTimer=setTimeout(()=>element.classList.remove('show'),undo?8500:4500);
}
function connection() {
 const label=$('#connection');label.className='connection'+(saveError||publishError?' error':' good');
 label.textContent=busy?'Opslaan…':saveError?'Opslaan mislukt':publishError?'Online bijwerken mislukt':editable?mode==='preview'?'Voorbeeld · lokaal':pending?'Opgeslagen · online bijwerken…':'Beheerder · opgeslagen':state.updatedAt?'Openbare stand · bijgewerkt':'Openbare stand';
}
const hero=(eyebrow,title,description)=>`<section class="hero"><div class="hero-content"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="description">${description}</p></div></section>`;
const fileLink=(file,label='Origineel als PNG')=>`<div class="page-end"><a class="asset-link" href="assets/${file}.png" download="EDE-${file}.png">${label} ${icon('arrow')}</a></div>`;
const count=matches=>matches.filter(m=>state.results[m.id]).length;
function leaderboard() {
 const rows=standings(state),gc=count(GAMES.flat().filter(Boolean)),pc=count(PADEL.flat()),behavior=state.behavior.reduce((n,e)=>n+e.delta,0);
 return hero('HET WEEKEND / HET KLASSEMENT','Geloof me: je wilt winnen.','Game Night + padel + gedrag. Iedere punt telt voor Waar is Party.')+`<div class="stats">${[['Game Night',gc,'/ 12 uitslagen','dice',gc/12],['Padel',pc,'/ 12 wedstrijden','padel',pc/12],['Gedrag',signed(behavior),'punten uitgedeeld','heart',null]].map(([name,n,suffix,i,progress])=>`<div class="stat"><div class="stat-label">${name}${icon(i)}</div><div class="big-number">${n} <small>${suffix}</small></div>${progress!==null?`<div class="stat-progress"><span style="width:${progress*100}%"></span></div>`:''}</div>`).join('')}</div><div class="section-heading"><h2>De ranglijst</h2><span class="tag">12 spelers · ${gc+pc}/24 uitslagen</span></div><section class="ranking-panel"><div class="table-scroll"><table><caption class="sr-only">Ranglijst met punten per onderdeel</caption><thead><tr><th scope="col">#</th><th scope="col">Speler</th><th scope="col" class="num">Game Night</th><th scope="col" class="num">Padel</th><th scope="col" class="num">Gedrag</th><th scope="col" class="num total">Totaal</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.rank===1&&r.total>0?'leader':''}"><td>${r.rank<10?'0':''}${r.rank}</td><td><div class="player-name"><span class="avatar">${initials(r.name)}</span>${r.name}</div></td><td class="num">${r.game}</td><td class="num">${r.padel}</td><td class="num ${r.behavior>0?'positive':r.behavior<0?'negative':''}">${signed(r.behavior)}</td><td class="num total">${r.total}</td></tr>`).join('')}</tbody></table></div><div class="ranking-footer">${icon('info')}${gc+pc===0&&state.behavior.length===0?'Nog alles te winnen. De eerste uitslag zet de toon.':'Gelijke totaalscore? Dan deel je de plaats.'}</div></section><div class="class-note">${icon('trophy')}<p><strong>EDE — Flikkerweekend klassement</strong><br>De ranglijst bepaalt het spel Waar is Party. Ook desinteresse en commentaar op de organisatie kunnen punten kosten. Aftrekken kan juist weer een punt opleveren.</p></div>`;
}
function matchCard(match,name) {
 if(!match) return `<article class="match-card inactive"><h3>${name}</h3><span class="inactive-x" aria-label="Deze ronde niet ingedeeld">X</span></article>`;
 const result=state.results[match.id];const mi=match.kind==='padel'?'padel':match.name==='Hitster'?'music':match.name==='30 Seconds'?'chat':'spy';
 return `<article class="match-card" data-match="${match.id}"><div class="match-top"><h3>${match.name}</h3><span class="match-icon">${icon(mi)}</span></div>${match.time?`<p class="match-time">${match.time} · 15 minuten spelen</p>`:''}${match.teams.map((team,i)=>`<div class="team ${result?.winner===i?'winner':''}"><div><p class="team-label">Team ${i+1}</p><div class="team-name">${team.join(' & ')}</div>${result?.winner===i?`<p class="winner-mark">${icon('trophy')} Winnaar</p>`:''}</div>${result?.scores[i]!==null&&result?.scores[i]!==undefined?`<span class="team-score">${result.scores[i]}</span>`:''}</div>`).join('')}<div class="match-bottom"><p class="result-status ${result?'done':''}">${result?(result.winner==='draw'?'Gelijke uitslag · 0 punten':'Uitslag verwerkt · +1 per winnaar'):'Nog geen uitslag'}</p>${editable?`<button class="primary-button" data-edit="${match.id}" ${busy?'disabled':''}>${icon(result?'edit':'check')}${result?'Uitslag aanpassen':'Uitslag invoeren'}</button>`:''}</div></article>`;
}
function schedule(view) {
 const gn=view==='game-night',list=gn?GAMES:PADEL,round=rounds[view],names=['Hitster','30 Seconds','Codenames'];
 const rest=gn?[]:PLAYERS.filter(p=>!list[round].flatMap(m=>m.teams.flat()).includes(p));
 return hero(gn?'VRIJDAG 23 OKTOBER / GAME NIGHT':'ZATERDAG 24 OKTOBER / 11:00–13:00',gn?'Let the games begin.':'Twee banen. Eén strijd.',gn?'6 rondes · 2 spellen tegelijk · kies zelf hoe lang je speelt.':'6 rondes · 15 minuten spelen · 5 minuten wisselen.')+`<div class="round-tabs" role="group" aria-label="Kies een ronde">${list.map((r,i)=>`<button class="round-tab ${i===round?'active':''}" data-round="${i}" aria-pressed="${i===round}">Ronde ${i+1}${r.filter(Boolean).every(m=>state.results[m.id])?icon('check'):''}</button>`).join('')}</div><div class="section-heading"><h2>Ronde ${round+1}</h2><span class="tag ${count(list[round].filter(Boolean))===2?'yellow':''}">${count(list[round].filter(Boolean))}/2 uitslagen</span></div><div class="match-grid ${gn?'':'padel'}">${list[round].map((m,i)=>matchCard(m,names[i])).join('')}</div>${rest.length?`<p class="round-note"><strong>Deze ronde langs de baan:</strong> ${rest.join(', ')}.</p>`:''}<div class="rules-strip">${icon('info')}<span>${gn?'Hitster & 30 Seconds: 3 teams van 2. Codenames: 2 teams van 3, met één spymaster per team.<br>Na 6 rondes heeft iedereen ieder spel 2× gespeeld. De grijze X betekent dat het spel deze ronde niet ingedeeld is.':'Iedereen speelt 4 wedstrijden. Een overwinning levert beide teamgenoten 1 punt op.<br>12:55–13:00 afronden. Rond 13:30 terug bij Bospark Ede.'}</span></div>${fileLink(gn?'game-night':'padel')}`;
}
function behaviorPage() {
 const rows=standings(state),recent=state.behavior.slice(-8).reverse();
 return hero('HET KLASSEMENT / GEDRAG','Goed bezig. Of juist niet.','Een extra punt voor goed gedrag. Een punt eraf voor de rest.')+`<div class="section-heading"><h2>De gedragspunten</h2><span class="tag">${state.behavior.length} beoordelingen</span></div><div class="behavior-grid">${PLAYERS.map(name=>{const r=rows.find(x=>x.name===name);return `<article class="behavior-card"><div class="behavior-identity"><span class="avatar">${initials(name)}</span>${name}</div><div class="behavior-controls">${editable?`<button class="point-button minus" data-behavior="-1" data-player="${name}" aria-label="Min 1 gedragspunt voor ${name}" ${busy?'disabled':''}>−</button>`:''}<div class="behavior-points ${r.behavior>0?'positive':r.behavior<0?'negative':''}">${signed(r.behavior)}<small>gedragspunten</small></div>${editable?`<button class="point-button plus" data-behavior="1" data-player="${name}" aria-label="Plus 1 gedragspunt voor ${name}" ${busy?'disabled':''}>+</button>`:''}</div></article>`;}).join('')}</div><section class="history"><h2>Net uitgedeeld</h2>${recent.length?recent.map(e=>`<div class="history-item"><span>${e.player} <strong class="${e.delta>0?'positive':'negative'}">${signed(e.delta)}</strong></span><time datetime="${e.at}">${new Date(e.at).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'})}</time></div>`).join(''):'<p class="muted small">Nog geen gedragspunten. Een schone lei voor iedereen.</p>'}</section>`;
}
function packingPage() {return hero('23–25 OKTOBER / DE VOORBEREIDING','Pak je spullen.','Beddengoed is aanwezig. Eigen handdoeken neem je mee.')+`<div class="packing-grid">${PACKING.map((group,i)=>`<section class="packing-card ${i===3?'shared':''}"><h2>${group.title}</h2><ul>${group.items.map(item=>`<li>${item}</li>`).join('')}</ul></section>`).join('')}</div><div class="rules-strip">${icon('info')}Voor de liefhebber: pas maandag 26 oktober vertrekken.</div>${fileLink('paklijst')}`;}
function planningPage() {return hero('23–25 OKTOBER / BOSPark EDE'.toUpperCase(),'Het weekend, op een rij.','Game Night. Padel. Escaleren. Welness.')+`<div class="planning-grid">${PLANNING.map(day=>`<section class="day-card"><div class="day-head"><h2>${day.day}</h2><p class="day-date">${day.date}</p><span class="tag">${day.tag}</span></div><div class="timeline">${day.items.map(([time,title,notes])=>`<div class="timeline-item"><p class="timeline-time">${time}</p><p class="timeline-title">${title}</p>${notes.length?`<ul>${notes.map(n=>`<li>${n}</li>`).join('')}</ul>`:''}</div>`).join('')}</div></section>`).join('')}</div>${fileLink('planning')}`;}
function render() {
 const view=currentView();$('#navigation').innerHTML=views.map(([id,label,i])=>`<a class="nav-link ${id===view?'active':''}" href="#${id}" ${id===view?'aria-current="page"':''}>${icon(i)}${label}</a>`).join('');
 $('#main').innerHTML=(saveError?`<div class="admin-warning" role="alert">${escape(saveError)} <button class="quiet-button" id="reload-state">Opnieuw laden</button></div>`:'')+(publishError?`<div class="admin-warning" role="alert">Lokaal opgeslagen; online bijwerken is mislukt. <button class="quiet-button" id="retry-publish">Opnieuw online bijwerken</button></div>`:'')+(view==='klassement'?leaderboard():view==='planning'?planningPage():view==='paklijst'?packingPage():view==='gedrag'?behaviorPage():schedule(view));
 document.title=`${views.find(v=>v[0]===view)[1]} · EDE`;
 document.querySelectorAll('[data-round]').forEach(b=>b.onclick=()=>{rounds[view]=Number(b.dataset.round);render();});
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openMatch(b.dataset.edit));
 document.querySelectorAll('[data-behavior]').forEach(b=>b.onclick=()=>changeBehavior(b.dataset.player,Number(b.dataset.behavior)));
 if($('#reload-state')) $('#reload-state').onclick=()=>loadState(true);
 if($('#retry-publish')) $('#retry-publish').onclick=retryPublish;
 connection();
}
async function save(next) {
 if(busy||!editable) return false;
 busy=true;saveError='';render();
 try {
  validateState(next);
  const response=await fetch('api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-EDE-CSRF':csrf},body:JSON.stringify({baseRevision:state.revision,state:next})});
  const data=await response.json();
  if(!response.ok) {if(data.state)state=validateState(data.state);throw Error(data.error||'De stand kon niet worden opgeslagen.');}
  state=validateState(data.state);publishError=data.publishError||'';pending=data.pending;return true;
 } catch(error) {saveError=error.message;toast('Opslaan mislukt. Probeer opnieuw.');return false;}
 finally {busy=false;render();}
}
async function changeBehavior(player,delta) {
 const event={id:crypto.randomUUID(),player,delta,at:new Date().toISOString()};const next=structuredClone(state);next.behavior.push(event);
 if(await save(next)) toast(`${player}: ${signed(delta)} gedragspunt`,async()=>{const undone=structuredClone(state);undone.behavior=undone.behavior.filter(e=>e.id!==event.id);if(await save(undone))toast('Gedragspunt teruggedraaid.');});
}
function openMatch(id) {
 currentMatch=MATCHES.find(m=>m.id===id);const result=state.results[id];selectedWinner=result?.winner??null;
 const dialog=$('#result-dialog');dialog.innerHTML=`<div class="dialog-head"><div><p class="eyebrow">${currentMatch.kind==='game'?'GAME NIGHT':'PADEL'} / RONDE ${id[1]}</p><h2 id="dialog-title">${currentMatch.name} · uitslag</h2></div><button class="close-dialog" aria-label="Sluiten">×</button></div><form class="result-form"><p class="form-instruction">Kies het winnende team. Scores invullen mag ook; dan bepaalt de score automatisch de winnaar.</p>${currentMatch.teams.map((team,i)=>`<div class="result-team"><input class="winner-radio" type="radio" name="winner" value="${i}" id="winner-${i}" ${selectedWinner===i?'checked':''}><label for="winner-${i}"><small>Team ${i+1}</small>${team.join(' & ')}</label><input type="number" min="0" max="999" step="1" inputmode="numeric" name="score-${i}" aria-label="Score team ${i+1}" value="${result?.scores[i]??''}"></div>`).join('')}<label class="draw-option"><input class="winner-radio" type="radio" name="winner" value="draw" ${selectedWinner==='draw'?'checked':''}>Gelijk geëindigd · geen wedstrijdpunten</label><p class="form-error" role="alert" id="form-error"></p><div class="form-actions">${result?'<button class="quiet-button" type="button" id="remove-result">Uitslag wissen</button>':''}<button type="submit" class="primary-button yellow">Uitslag opslaan ${icon('check')}</button></div></form>`;
 dialog.querySelector('.close-dialog').onclick=()=>dialog.close();
 dialog.querySelectorAll('input[name=winner]').forEach(r=>r.onchange=()=>{selectedWinner=r.value==='draw'?'draw':Number(r.value);});
 dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();try {const scores=currentMatch.teams.map((_,i)=>{const v=dialog.querySelector(`[name=score-${i}]`).value;return v===''?null:Number(v);});const result=resultFrom(scores,selectedWinner);const next=structuredClone(state);next.results[id]=result;dialog.querySelector('[type=submit]').disabled=true;if(await save(next)){dialog.close();toast('Uitslag opgeslagen. Klassement bijgewerkt.');}else $('#form-error').textContent=saveError;}catch(error){$('#form-error').textContent=error.message;}finally {if(dialog.open)dialog.querySelector('[type=submit]').disabled=false;}};
 if($('#remove-result')) $('#remove-result').onclick=async()=>{const previous=state.results[id],next=structuredClone(state);delete next.results[id];if(await save(next)){dialog.close();toast('Uitslag gewist.',async()=>{const undo=structuredClone(state);if(!undo.results[id]){undo.results[id]=previous;if(await save(undo))toast('Uitslag teruggezet.');}});}};
 dialog.showModal();
}
async function retryPublish() {try{const response=await fetch('api/publish',{method:'POST',headers:{'X-EDE-CSRF':csrf}});const data=await response.json();if(!response.ok)throw Error(data.error);publishError='';toast('De openbare stand wordt bijgewerkt.');render();}catch(e){toast('Online bijwerken lukt nog niet.');}}
async function loadState(force=false) {
 if(busy||$('#result-dialog').open&&!force)return;
 try {
  const response=await fetch(editable?'api/state':`scores.json?version=${Date.now()}`,{cache:'no-store'});
  if(!response.ok)throw Error('De stand kon niet worden geladen.');
  const payload=await response.json(),next=validateState(editable?payload.state:payload);
  if(force||next.revision>=state.revision){state=next;saveError='';if(editable){publishError=payload.publishError||'';pending=payload.pending;}render();}
 }catch(e){saveError='De stand kan momenteel niet worden geladen. Probeer opnieuw.';render();}
}
async function init() {
 const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 if(local)try{const r=await fetch('api/session',{cache:'no-store'});if(r.ok){const session=await r.json();editable=session.editable===true;csrf=session.csrf;mode=session.mode;}}catch{}
 await loadState(true);
 setInterval(()=>loadState(),editable?5000:30000);
}
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0});});
$('#help-button').onclick=()=>$('#help-dialog').showModal();
$('#help-dialog .close-dialog').onclick=()=>$('#help-dialog').close();
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
init();
