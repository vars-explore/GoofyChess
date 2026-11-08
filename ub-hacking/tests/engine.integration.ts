import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { Engine } from '../server/engine';
import { demos } from '../shared/demos';
import { evaluationEvent } from '../shared/reactions';
test('real Stockfish analyzes a queen-losing move and triggers a meme',{timeout:30000},async()=>{
 const e=new Engine();try{
  assert.equal((await e.status()).ready,true);
  const d=demos.find(x=>x.id==='swing')!,c=new Chess(d.fen);c.move(d.move);
  const scores=await e.analyze('test',d.fen,c.fen());assert.ok(scores);
  assert.ok(['swing','losing','danger'].includes(evaluationEvent(scores[0],scores[1],'w',1)||''));
 }finally{e.close();}
});
