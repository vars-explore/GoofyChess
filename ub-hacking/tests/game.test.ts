import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { Game } from '../server/game';
import { demos } from '../shared/demos';
import { boardEvent } from '../shared/reactions';

function game(){const g=new Game('online');g.players.w={name:'White',socket:'white',token:'a'};g.players.b={name:'Black',socket:'black',token:'b'};return g;}
const input=(g:Game,from:string,to:string)=>({gameId:g.gameId,version:g.version,from,to});
test('server rejects unauthorized, illegal, out-of-turn, and stale moves',()=>{
 const g=game();assert.throws(()=>g.move('intruder',input(g,'e2','e4')));
 assert.throws(()=>g.move('black',input(g,'e7','e5')));
 assert.throws(()=>g.move('white',input(g,'e2','e5')));
 const first=input(g,'e2','e4');g.move('white',first);assert.equal(g.version,1);
 assert.throws(()=>g.move('white',first));assert.equal(g.chess.turn(),'b');
});
test('moves wait for both players, including reconnect',()=>{
 const g=game();g.players.b!.socket=null;assert.throws(()=>g.move('white',input(g,'e2','e4')));
 g.players.b!.socket='black';g.move('white',input(g,'e2','e4'));assert.equal(g.version,1);
});
test('rematch generation invalidates moves from the old board',()=>{
 const g=game(),old=input(g,'e2','e4');g.reset();assert.throws(()=>g.move('white',old));
});
test('every demo suggested move is legal and triggers its intended event',()=>{
 const expected:Record<string,string>={check:'check',queen:'queen',promotion:'promotion',enpassant:'enpassant',mate:'mate',stalemate:'stalemate'};
 for(const d of demos){const c=new Chess(d.fen);for(const setup of d.setup||[])c.move(setup);const m=c.move(d.move);assert.ok(m,d.id);const event=d.event||expected[d.id];if(event)assert.equal(boardEvent(c,m,1)?.kind,event,d.id);else assert.equal(boardEvent(c,m,1),null);}
});
test('castling moves king and rook and triggers its reaction',()=>{
 const c=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');const m=c.move('O-O');
 assert.equal(c.get('f1')?.type,'r');assert.equal(c.get('g1')?.type,'k');assert.equal(boardEvent(c,m,1)?.kind,'castle');
});
test('checkmate has priority over a capture and blocks further moves',()=>{
 const g=game();for(const [from,to] of [['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']])g.move(g.chess.turn()==='w'?'white':'black',input(g,from,to));
 assert.equal(g.result,'Black wins by checkmate');assert.equal(boardEvent(g.chess,g.chess.history({verbose:true}).at(-1)!,4)?.kind,'mate');
 assert.throws(()=>g.move('white',input(g,'e2','e4')));
});
test('snapshots never expose reconnect tokens or engine analysis',()=>{
 const g=game(),s=g.snapshot();assert.deepEqual(s.players.w,{name:'White',connected:true});assert.ok(!('token' in s.players.w!));assert.ok(!('score' in s));
});
