import { test } from 'node:test';
import assert from 'node:assert/strict';
import { io, type Socket } from 'socket.io-client';
import type { Ack, Snapshot } from '../shared/types';
process.env.NODE_ENV='test';

test('two live clients synchronize, reject extra players, and reclaim seats',{timeout:30000},async()=>{
 const {createApp}=await import('../server/index');
 const app=createApp(0),clients:Socket[]=[];
 try{
  if(!app.http.listening)await new Promise<void>(r=>app.http.once('listening',r));
  const port=(app.http.address() as {port:number}).port;
  async function connect(){const s=io(`http://127.0.0.1:${port}`,{forceNew:true,reconnection:false});clients.push(s);await new Promise<void>((r,j)=>{s.once('connect',r);s.once('connect_error',j);});return s;}
  const ask=(s:Socket,event:string,payload:any)=>new Promise<Ack>((r,j)=>s.timeout(5000).emit(event,payload,(err:Error|null,v:Ack)=>err?j(err):r(v)));
  const white=await connect(),black=await connect(),extra=await connect();
  const a=await ask(white,'create',{mode:'online',color:'w',name:'White'});assert.ok(a.ok);
  const b=await ask(black,'join',{room:a.room,name:'Black'});assert.ok(b.ok);
  assert.equal((await ask(extra,'join',{room:a.room})).ok,false);
  assert.equal((await ask(extra,'resume',{room:a.room,token:'wrong'})).ok,false);
  let whiteState:Snapshot|undefined,blackState:Snapshot|undefined;
  white.on('state',s=>{whiteState=s;});black.on('state',s=>{blackState=s;});
  const move={gameId:a.state!.gameId,version:0,from:'e2',to:'e4'};
  assert.equal((await ask(black,'move',move)).ok,false);
  const both=new Promise<void>(resolve=>{black.once('state',()=>resolve());});
  assert.equal((await ask(white,'move',move)).ok,true);await both;
  assert.equal(whiteState!.fen,blackState!.fen);assert.equal(blackState!.version,1);
  assert.equal((await ask(white,'move',move)).ok,false);
  const disconnected=new Promise<void>(resolve=>white.once('state',()=>resolve()));black.disconnect();await disconnected;
  const recovered=await connect();const resume=await ask(recovered,'resume',{room:b.room,token:b.token});assert.equal(resume.ok,true);assert.equal(resume.state!.version,1);
  assert.equal((await ask(recovered,'move',{gameId:resume.state!.gameId,version:1,from:'e7',to:'e5'})).ok,true);
  assert.equal((await ask(white,'control',{action:'draw'})).ok,true);
  assert.equal((await ask(recovered,'control',{action:'draw'})).ok,true);
  const g=app.rooms.get(a.room!)!;assert.equal(g.result,'Draw by agreement');
  const oldGame=g.gameId;
  await ask(white,'control',{action:'rematch'});await ask(recovered,'control',{action:'rematch'});
  assert.notEqual(g.gameId,oldGame);assert.equal(g.version,0);assert.equal(g.result,null);
 }finally{for(const s of clients)s.disconnect();await app.close();}
});
