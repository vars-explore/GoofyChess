import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../server/game';
import {isNewMove,checkmateNames} from '../shared/presentation';
import {catalog} from '../shared/reactions';
import {memeMedia,pickReactionSound,reactionSounds,soundMedia} from '../shared/media';
test('each scenario has a real image and a database sound',()=>{
 for(const kind of Object.keys(catalog) as (keyof typeof catalog)[]){
  assert.match(memeMedia[kind].url,/^https:\/\/i\.imgflip\.com\//);
  assert.ok(memeMedia[kind].id);
  assert.ok(reactionSounds[kind].some(sound=>soundMedia[sound]));
  assert.ok(reactionSounds[kind].length>0);
  for(const sound of reactionSounds[kind])assert.match(soundMedia[sound].url,/^\/sounds\/.+\.mp3$/);
 }
});
test('reaction sounds rotate between local alternatives without immediate repeats',()=>{
 for(const kind of Object.keys(reactionSounds) as (keyof typeof reactionSounds)[]){
  const [first,second]=reactionSounds[kind];
  if(second)assert.notEqual(pickReactionSound(kind,first,()=>0),first);
 }
 assert.deepEqual(Object.values(soundMedia).map(sound=>sound.source),Object.values(soundMedia).map(()=> 'local'));
});
test('move audio only fires on a new accepted move, not state broadcasts or reconnect',()=>{
 const g=new Game('local');g.players.w={name:'Alice',socket:'a',token:'token'};
 const a=g.snapshot();g.move('a',{gameId:g.gameId,version:0,from:'e2',to:'e4'});const b=g.snapshot();
 assert.equal(isNewMove(a,b),true);assert.equal(isNewMove(b,b),false);assert.equal(isNewMove(null,b),false);
 g.reset();assert.equal(isNewMove(b,g.snapshot()),false);
});
test('checkmate winner and loser names match the actual side that won',()=>{
 const g=new Game('local');g.players.w={name:'Alice',socket:'a',token:'a'};g.players.b={name:'Bob',socket:null,token:'b'};
 for(const [from,to] of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])g.move('a',{gameId:g.gameId,version:g.version,from,to});
 assert.deepEqual(checkmateNames(g.snapshot()),{winner:'Bob',loser:'Alice',color:'b'});
});
test('draws and resignations do not produce an anime checkmate finale',()=>{
 const s=new Game('local').snapshot();assert.equal(checkmateNames(s),null);
 assert.equal(checkmateNames({...s,result:'Draw by stalemate'}),null);
 assert.equal(checkmateNames({...s,result:'Black wins by resignation'}),null);
});
