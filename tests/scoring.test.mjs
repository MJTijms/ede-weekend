import test from 'node:test';
import assert from 'node:assert/strict';
import {PLAYERS,GAMES,PADEL,MATCHES} from '../publish/data.js';
import {emptyState,validateState,standings,resultFrom} from '../publish/scoring.js';
test('Game Night: six rounds, all players, each game twice, no repeated teammate',()=>{
 const seen=new Map(PLAYERS.map(p=>[p,{games:{},partners:new Set(),tables:new Set()}]));
 GAMES.forEach((round,i)=>{
  assert.equal(round.filter(Boolean).length,2);assert.equal(round[[2,0,1][i%3]],null);
  assert.deepEqual(round.filter(Boolean).flatMap(m=>m.teams.flat()).sort(),[...PLAYERS].sort());
  for(const m of round.filter(Boolean))for(const team of m.teams){assert.equal(team.length,m.name==='Codenames'?3:2);for(const p of team){const s=seen.get(p);s.games[m.name]=(s.games[m.name]||0)+1;for(const q of team.filter(q=>q!==p)){assert.ok(!s.partners.has(q),`${p} repeats ${q}`);s.partners.add(q);}for(const q of m.teams.flat().filter(q=>q!==p))s.tables.add(q);}}
 });
 for(const s of seen.values()){assert.deepEqual(Object.values(s.games).sort(),[2,2,2]);assert.equal(s.partners.size,8);assert.equal(s.tables.size,11);}
});
test('Padel: four matches each, no repeated teammate, opponents max twice',()=>{
 const stats=new Map(PLAYERS.map(p=>[p,{matches:0,partners:new Set(),opponents:{}}]));
 for(const round of PADEL){assert.equal(round.length,2);assert.equal(new Set(round.flatMap(m=>m.teams.flat())).size,8);for(const match of round)match.teams.forEach((team,i)=>team.forEach(p=>{const s=stats.get(p);s.matches++;const mate=team.find(q=>q!==p);assert.ok(!s.partners.has(mate));s.partners.add(mate);for(const opponent of match.teams[1-i])s.opponents[opponent]=(s.opponents[opponent]||0)+1;}));}
 for(const s of stats.values()){assert.equal(s.matches,4);assert.equal(s.partners.size,4);assert.ok(Object.values(s.opponents).every(n=>n<=2));}
});
test('One point for every duo or trio member; replacement never doubles points',()=>{
 const state=emptyState(),match=GAMES[1][2];state.results[match.id]=resultFrom([null,null],0);
 for(const p of match.teams[0])assert.equal(standings(state).find(r=>r.name===p).game,1);
 state.results[match.id]=resultFrom([null,null],1);
 for(const p of match.teams[0])assert.equal(standings(state).find(r=>r.name===p).game,0);
 for(const p of match.teams[1])assert.equal(standings(state).find(r=>r.name===p).game,1);
});
test('Scores infer winner, draw awards no points, zero is a valid score',()=>{
 assert.equal(resultFrom([0,3],null).winner,1);assert.equal(resultFrom([3,3],null).winner,'draw');
 const state=emptyState();state.results[PADEL[0][0].id]=resultFrom([0,0],null);assert.ok(standings(state).every(r=>r.total===0));
 assert.throws(()=>resultFrom([1,null],0));assert.throws(()=>resultFrom([null,null],null));assert.throws(()=>resultFrom([1.5,2],0));
});
test('Behavior: negatives allowed, undo removes exactly one mutation, shared ranks',()=>{
 const state=emptyState();state.behavior=[{id:'one',player:'Q',delta:-1,at:new Date().toISOString()},{id:'two',player:'Q',delta:1,at:new Date().toISOString()}];assert.equal(standings(state).find(r=>r.name==='Q').total,0);
 state.behavior=state.behavior.filter(e=>e.id!=='two');assert.equal(standings(state).find(r=>r.name==='Q').behavior,-1);assert.equal(standings(state).find(r=>r.name==='Q').rank,12);assert.equal(standings(state)[0].rank,1);
});
test('Reject invented matches, duplicate behavior, wrong winners and malformed scores',()=>{
 const state=emptyState();state.results.fake={winner:0,scores:[null,null]};assert.throws(()=>validateState(state));delete state.results.fake;
 state.results[MATCHES[0].id]={winner:0,scores:[1,2,3]};assert.throws(()=>validateState(state));state.results={};
 state.behavior=[{id:'x',player:'Q',delta:1,at:new Date().toISOString()},{id:'x',player:'Q',delta:1,at:new Date().toISOString()}];assert.throws(()=>validateState(state));
});
