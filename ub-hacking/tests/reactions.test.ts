import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScore, evaluationEvent, zone, catalog } from '../shared/reactions.ts';
const cp=(value:number)=>({kind:'cp' as const,value});
const mate=(value:number)=>({kind:'mate' as const,value});
test('scores are normalized from the side to move to White',()=>{
 assert.deepEqual(normalizeScore(cp(240),'b'),cp(-240));
 assert.deepEqual(normalizeScore(cp(240),'w'),cp(240));
 assert.deepEqual(normalizeScore(mate(-3),'b'),mate(3));
});
test('each player gets the opposite advantage state',()=>{
 assert.equal(zone(cp(300),'w'),1);assert.equal(zone(cp(300),'b'),-1);
});
test('hysteresis retains state until the exit threshold is crossed',()=>{
 assert.equal(zone(cp(150),'w',1),1);assert.equal(zone(cp(150),'w',0),0);
 assert.equal(zone(cp(100),'w',1),0);assert.equal(zone(cp(-150),'w',-1),-1);
});
test('winning reactions do not repeat in a stable advantage',()=>{
 assert.equal(evaluationEvent(cp(300),cp(320),'w',1),null);
 assert.equal(evaluationEvent(cp(80),cp(230),'w',0),'winning');
});
test('negative swing roasts the losing player and celebrates the opponent',()=>{
 assert.equal(evaluationEvent(cp(100),cp(-300),'w',0),'swing');
 assert.equal(evaluationEvent(cp(100),cp(-300),'b',0),'winning');
});
test('recovering from a losing position gets a comeback',()=>{
 assert.equal(evaluationEvent(cp(-250),cp(0),'w',-1),'comeback');
});
test('forced mate is handled separately from centipawns',()=>{
 assert.equal(evaluationEvent(cp(-200),mate(-4),'w',-1),'danger');
 assert.equal(evaluationEvent(mate(-4),mate(-3),'w',-1),null);
 assert.equal(evaluationEvent(mate(-4),cp(-100),'w',-1),'comeback');
 assert.equal(evaluationEvent(cp(200),mate(4),'b',-1),'danger');
});
test('every reaction has a database image and caption variants',()=>{
 for(const item of Object.values(catalog)){assert.ok(item.image?.startsWith('/api/media/meme-'));assert.ok(item.captions.length>=2);assert.ok(['good','bad','weird'].includes(item.tone));}
});
