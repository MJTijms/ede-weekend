import {PLAYERS,MATCHES} from './data.js';
export const emptyState = () => ({schemaVersion:1,revision:0,updatedAt:null,results:{},behavior:[]});
export function validateState(state) {
 if (!state || state.schemaVersion!==1 || !Number.isSafeInteger(state.revision) || state.revision<0 || !state.results || Array.isArray(state.results) || !Array.isArray(state.behavior)) throw Error('Ongeldige stand.');
 if(state.behavior.length>10000) throw Error('Te veel gedragsmutaties.');
 for(const [id,result] of Object.entries(state.results)) {
  const match=MATCHES.find(m=>m.id===id);
  if(!match || !result || !(Number.isInteger(result.winner)&&result.winner>=0&&result.winner<match.teams.length || result.winner==='draw')) throw Error('Ongeldige winnaar.');
  if(!Array.isArray(result.scores) || result.scores.length!==match.teams.length || result.scores.some(s=>s!==null&&(!Number.isInteger(s)||s<0||s>999))) throw Error('Ongeldige score.');
  if(result.scores.every(s=>s!==null)) {
   const max=Math.max(...result.scores), leaders=result.scores.map((s,i)=>s===max?i:-1).filter(i=>i>=0);
   if(leaders.length>1 ? result.winner!=='draw' : result.winner!==leaders[0]) throw Error('Winnaar en score komen niet overeen.');
  }
 }
 const ids=new Set();
 for(const e of state.behavior) {
  if(!e || typeof e.id!=='string'||e.id.length>100||ids.has(e.id)||!PLAYERS.includes(e.player)||![1,-1].includes(e.delta)||!Number.isFinite(Date.parse(e.at))) throw Error('Ongeldige gedragsmutatie.');
  ids.add(e.id);
 }
 return state;
}
export function standings(state) {
 const rows=PLAYERS.map(name=>({name,game:0,padel:0,behavior:0,total:0}));
 for(const match of MATCHES) {
  const result=state.results[match.id];
  if(!result || result.winner==='draw') continue;
  for(const name of match.teams[result.winner]) rows.find(r=>r.name===name)[match.kind==='game'?'game':'padel']+=1;
 }
 for(const event of state.behavior) rows.find(r=>r.name===event.player).behavior+=event.delta;
 for(const row of rows) row.total=row.game+row.padel+row.behavior;
 rows.sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'nl'));
 rows.forEach((r,i)=>r.rank=i&&r.total===rows[i-1].total?rows[i-1].rank:i+1);
 return rows;
}
export function resultFrom(scores,winner) {
 const all=scores.every(s=>s!==null);
 if(scores.some(s=>s!==null&&(!Number.isInteger(s)||s<0||s>999))) throw Error('Gebruik hele scores van 0 tot 999.');
 if(scores.some(s=>s!==null)&&!all) throw Error('Vul alle scores in, of laat ze allemaal leeg en kies een winnaar.');
 if(all) {
  const max=Math.max(...scores),leaders=scores.map((s,i)=>s===max?i:-1).filter(i=>i>=0);
  winner=leaders.length===1?leaders[0]:'draw';
 }
 if(winner===null) throw Error('Kies een winnaar of vul de scores in.');
 return {winner,scores,updatedAt:new Date().toISOString()};
}
