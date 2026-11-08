import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {boardEvent,captureCount} from '../shared/reactions';
import {demos} from '../shared/demos';
import {Game} from '../server/game';

for(const demo of demos.filter(d=>d.event)){
 test(`${demo.label}: legal setup and matching reaction`,()=>{
  const g=new Game('demo',demo.id);
  const move=g.chess.move(demo.move);
  assert.equal(boardEvent(g.chess,move,1)?.kind,demo.event);
 });
}
test('a plain knight check is not called a fork',()=>{
 const c=new Chess('3k4/8/8/6N1/8/8/8/4K3 w - - 0 1');
 const m=c.move('Nf7+');assert.equal(boardEvent(c,m,1)?.kind,'check');
});
test('first blood occurs only on the first capture',()=>{
 const c=new Chess();for(const m of ['e4','d5'])c.move(m);
 const first=c.move('exd5');assert.equal(boardEvent(c,first,3)?.kind,'firstblood');
 c.move('Nf6');c.move('d4');const second=c.move('Nxd5');assert.notEqual(boardEvent(c,second,6)?.kind,'firstblood');
});
test('landing on the previous move square alone is not a recapture',()=>{
 const c=new Chess('4k3/8/8/3p4/8/8/8/3RK3 b - - 0 1');c.move('d4');
 const m=c.move('Rxd4');assert.equal(boardEvent(c,m,2)?.kind,'firstblood');
});
test('captures by different rooks are not merged into one streak',()=>{
 const c=new Chess('7k/8/8/8/8/pp5p/8/R3K2R w - - 0 1');
 for(const m of ['Rxa3','Kg8','Rxh3','Kf8','Raxb3'])c.move(m);
 assert.equal(captureCount(c.history({verbose:true})),2);
 assert.notEqual(boardEvent(c,c.history({verbose:true}).at(-1)!,5)?.kind,'streak');
});
test('resetting a demo restores its history without accumulating captures',()=>{
 const g=new Game('demo','streak');g.chess.move('Rxc3');assert.equal(captureCount(g.chess.history({verbose:true})),3);
 g.reset('streak');const m=g.chess.move('Rxc3');assert.equal(captureCount(g.chess.history({verbose:true})),3);assert.equal(boardEvent(g.chess,m,1)?.kind,'streak');
});
