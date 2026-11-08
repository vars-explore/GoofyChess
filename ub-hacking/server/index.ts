import express from 'express';
import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Server } from 'socket.io';
import { Game } from './game';
import { attachMedia } from './media';
import { Engine } from './engine';
import { boardEvent, catalog, evaluationEvent, reactionConfig, zone } from '../shared/reactions';
import type { BotDifficulty, Color, Reaction, ReactionKind, Mode } from '../shared/types';

export function createApp(port=Number(process.env.PORT)||3001) {
 const app=express(),http=createServer(app),engine=new Engine(),rooms=new Map<string,Game>();
 const origins=process.env.ALLOWED_ORIGINS?.split(',');
 const io=new Server(http,{maxHttpBufferSize:8192,allowRequest:(req,cb)=>{
  const origin=req.headers.origin;
  let allowed=!origin;
  if(origin){try{allowed=origins?origins.includes(origin):new URL(origin).host===req.headers.host;}catch{allowed=false;}}
  cb(null,allowed);
 }});
 app.get('/api/health',(_req,res)=>res.json({ok:true,engine:engine.ready}));
 attachMedia(app);
 app.use(express.static(resolve('dist')));
 app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/index.html')));
 function broadcast(game:Game){io.to(game.id).emit('state',game.snapshot());}
 function react(game:Game,kind:ReactionKind,color:Color,square?:string,variant?:number){
  const player=game.players[color];if(!player?.socket)return;
  const item=catalog[kind],key=kind+color;
  const i=variant??((game.lastCaption[key]??-1)+1)%item.captions.length;game.lastCaption[key]=i;
  const reaction:Reaction={id:randomUUID(),gameId:game.gameId,version:game.version,kind,caption:item.captions[i],tone:item.tone,square,image:item.image,duration:reactionConfig.durationMs};
  game.lastReaction[color]=Date.now();io.to(player.socket).emit('reaction',reaction);
 }
 function baseline(game:Game){const id=game.gameId;void engine.analyze(game.id,game.chess.fen(),game.chess.fen()).then(scores=>{
  if(scores&&game.gameId===id&&game.version===0)for(const c of ['w','b'] as Color[])game.zones[c]=zone(scores[1],c);
 });}
 function getBotFallbackMove(game:Game,difficulty:BotDifficulty='medium'):{from:string;to:string;promotion?:string}|null {
  const moves=game.chess.moves({verbose:true});
  if(!moves.length)return null;
  if(difficulty==='easy'){
   const chosen=moves[Math.floor(Math.random()*moves.length)];
   return {from:chosen.from,to:chosen.to,promotion:chosen.promotion};
  }
  const tactical=moves.filter(m=>m.captured||m.san.includes('+'));
  const pool=tactical.length?tactical:moves;
  const chosen=pool[Math.floor(Math.random()*pool.length)];
  return {from:chosen.from,to:chosen.to,promotion:chosen.promotion};
 }
 async function triggerBotMove(game:Game) {
  if(game.mode!=='bot'||game.result)return;
  const botColor=(['w','b'] as Color[]).find(c=>!game.players[c]?.socket);
  if(!botColor||game.chess.turn()!==botColor)return;
  const gameId=game.gameId,version=game.version;
  // Give the opponent a natural thinking beat, even on easy or cached moves.
  await new Promise(r=>setTimeout(r,1600+Math.random()*400));
  if(rooms.get(game.id)!==game||game.gameId!==gameId||game.version!==version||game.result)return;
  const fen=game.chess.fen();
  const diff=game.difficulty||'medium';
  let uci=(diff==='easy'&&Math.random()<0.35)?null:await engine.bestMove(game.id,fen,diff);
  // Analysis may have triggered a meme while Stockfish was choosing its move.
  // Let that reaction and its sound finish before advancing the board.
  while(true){
   if(rooms.get(game.id)!==game||game.gameId!==gameId||game.version!==version||game.result)return;
   const remaining=Math.max(game.lastReaction.w,game.lastReaction.b)+reactionConfig.durationMs+150-Date.now();
   if(remaining<=0)break;
   await new Promise(r=>setTimeout(r,remaining));
  }
  let step:{from:string;to:string;promotion?:string}|null=null;
  if(uci&&/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)){
   step={from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||undefined};
  }else{
   step=getBotFallbackMove(game,diff);
  }
  if(!step)return;
  try{
   const before=game.chess.fen();
   const move=game.moveAsBot(step);
   broadcast(game);
   const event=boardEvent(game.chess,move,game.version);
   if(event){
    const variant=((game.lastCaption[event.kind+'w']??-1)+1)%catalog[event.kind].captions.length;
    for(const c of ['w','b'] as Color[])react(game,event.kind,c,event.square,variant);
   }
   const versionAfter=game.version,after=game.chess.fen();
   if(!game.result)void engine.analyze(game.id,before,after).then(scores=>{
    if(!scores||rooms.get(game.id)!==game||game.gameId!==gameId||game.version!==versionAfter||game.result)return;
    for(const c of ['w','b'] as Color[]){
     const perspective=c;
     const kind=evaluationEvent(scores[0],scores[1],perspective,game.zones[perspective]);
     game.zones[perspective]=zone(scores[1],perspective,game.zones[perspective]);
     if(!event&&kind&&Date.now()-game.lastReaction[c]>reactionConfig.cooldownMs)react(game,kind,c,move.to);
    }
   });
  }catch(err){console.error('Bot move failed:',err);}
 }
 io.on('connection',socket=>{
  let count=0,window=Date.now();
  function action(name:string,fn:(data:any)=>any){socket.on(name,(data,ack)=>{
   if(typeof ack!=='function')return;
   try{if(Date.now()-window>10000){window=Date.now();count=0;}if(++count>80)throw new Error('Slow down a moment.');ack({ok:true,...fn(data||{})});}
   catch(e){ack({ok:false,error:e instanceof Error?e.message:'Something went wrong.'});}
  });}
  function current(){const game=rooms.get(socket.data.room);if(!game||!game.color(socket.id))throw new Error('Join a room first.');return game;}
  function attach(game:Game,color:Color){socket.data.room=game.id;socket.join(game.id);game.touched=Date.now();broadcast(game);return {room:game.id,token:game.players[color]!.token,color,state:game.snapshot()};}
  action('create',data=>{
   if(socket.data.room)throw new Error('Leave your current room first.');
   if(rooms.size>=100)throw new Error('The theater is full. Try again later.');
   const mode:Mode=['local','demo','bot'].includes(data.mode)?data.mode:'online';
   const difficulty:BotDifficulty=['easy','medium','hard','expert'].includes(data.difficulty)?data.difficulty:'medium';
   const game=new Game(mode,mode==='demo'?(data.demo||'check'):undefined,difficulty);
   const color:Color=(mode==='local'||mode==='demo')?'w':data.color==='b'?'b':data.color==='random'?(Math.random()<.5?'w':'b'):'w';
   game.players[color]={name:String(data.name||'Anonymous legend').trim().slice(0,24)||'Anonymous legend',token:randomBytes(24).toString('hex'),socket:socket.id};
   if(mode==='local')game.players.b={name:String(data.opponentName||'The challenger').trim().slice(0,24)||'The challenger',token:randomBytes(24).toString('hex'),socket:null};
   if(mode==='bot'){
    const botColor:Color=color==='w'?'b':'w';
    const botNames:Record<BotDifficulty,string>={
     easy:'Noob Bot (Easy) 🤪',
     medium:'Casual Bot (Medium) ☕',
     hard:'Tryhard Bot (Hard) ⚡',
     expert:'Grandmaster Stockfish 🤖',
    };
    game.players[botColor]={name:botNames[difficulty],token:'bot',socket:null};
   }
   rooms.set(game.id,game);baseline(game);
   const res=attach(game,color);
   if(mode==='bot'&&game.chess.turn()!==color)void triggerBotMove(game);
   return res;
  });
  action('join',data=>{
   if(socket.data.room)throw new Error('Leave your current room first.');
   const game=rooms.get(String(data.room).toUpperCase());if(!game)throw new Error('Room not found. Ask your friend for a new invite.');
   if(game.mode!=='online')throw new Error('This is a local game.');
   const color:Color=!game.players.w?'w':'b';if(game.players[color])throw new Error('This room already has two players.');
   game.players[color]={name:String(data.name||'The challenger').trim().slice(0,24)||'The challenger',token:randomBytes(24).toString('hex'),socket:socket.id};return attach(game,color);
  });
  action('resume',data=>{
   const game=rooms.get(String(data.room));if(!game)throw new Error('Room expired. Start a new game.');
   const color=(['w','b'] as Color[]).find(c=>game.players[c]?.token===data.token);
   if(!color)throw new Error('Unable to recover this seat.');
   const old=game.players[color]!.socket;
   if(old&&old!==socket.id){const prev=io.sockets.sockets.get(old);prev?.leave(game.id);if(prev)prev.data.room=undefined;prev?.emit('replaced');}
   game.players[color]!.socket=socket.id;return attach(game,color);
  });
  action('move',data=>{
   const game=current(),before=game.chess.fen();const move=game.move(socket.id,data);broadcast(game);
   const event=boardEvent(game.chess,move,game.version);
   if(event){const variant=((game.lastCaption[event.kind+'w']??-1)+1)%catalog[event.kind].captions.length;for(const c of ['w','b'] as Color[])react(game,event.kind,c,event.square,variant);}
   const gameId=game.gameId,version=game.version,after=game.chess.fen();
   const color=game.color(socket.id);
   if(game.mode==='bot'&&!game.result&&color&&game.chess.turn()!==color){
    void triggerBotMove(game);
   }
   if(!game.result)void engine.analyze(game.id,before,after).then(scores=>{
    if(!scores||rooms.get(game.id)!==game||game.gameId!==gameId||game.version!==version||game.result)return;
    for(const c of ['w','b'] as Color[]){
     // Pass-and-play reacts from the mover's point of view.
     const perspective=game.mode==='online'?c:move.color;
     const kind=evaluationEvent(scores[0],scores[1],perspective,game.zones[perspective]);
     game.zones[perspective]=zone(scores[1],perspective,game.zones[perspective]);
     if(!event&&kind&&Date.now()-game.lastReaction[c]>reactionConfig.cooldownMs)react(game,kind,c,move.to);
    }
   });
   return {};
  });
  action('control',data=>{
   const game=current(),color=game.color(socket.id)!;game.touched=Date.now();
   if(data.action==='resign'&&!game.result)game.result=`${color==='w'?'Black':'White'} wins by resignation`;
   else if(data.action==='draw'&&!game.result){if(game.mode!=='online'||(game.offer&&game.offer!==color)){game.result='Draw by agreement';game.offer=null;}else game.offer=color;}
   else if(data.action==='decline')game.offer=null;
   else if(data.action==='rematch'&&game.result){
    if(game.mode==='bot'||game.mode!=='online'||(game.rematch&&game.rematch!==color)){
     game.reset(game.demo);baseline(game);
     const userColor=game.color(socket.id);
     if(game.mode==='bot'&&userColor&&game.chess.turn()!==userColor)void triggerBotMove(game);
    }else game.rematch=color;
   }
   else if(data.action==='reset'&&(game.mode==='local'||game.mode==='bot')){
    game.reset(game.demo);baseline(game);
    const userColor=game.color(socket.id);
    if(game.mode==='bot'&&userColor&&game.chess.turn()!==userColor)void triggerBotMove(game);
   }
   else if(data.action==='demo'&&game.mode==='demo'){game.reset(String(data.demo));baseline(game);}
   else throw new Error('This action is not available.');
   broadcast(game);return {};
  });
  function detach(){const game=rooms.get(socket.data.room);if(game){const color=game.color(socket.id);if(color)game.players[color]!.socket=null;game.touched=Date.now();broadcast(game);socket.leave(game.id);}socket.data.room=undefined;}
  action('leave',()=>{detach();return {};});socket.on('disconnect',detach);
 });
 const cleanup=setInterval(()=>{for(const [id,g] of rooms)if(Date.now()-g.touched>2*60*60*1000&&!Object.values(g.players).some(p=>p.socket)){engine.cancel(id);rooms.delete(id);}},60000);cleanup.unref();
 http.listen(port,'0.0.0.0',()=>console.log(`Blunder Theater server: http://localhost:${(http.address() as any).port}`));
 return {http,io,engine,rooms,close:async()=>{clearInterval(cleanup);engine.close();await new Promise<void>(r=>io.close(()=>r()));}};
}
if(process.env.NODE_ENV!=='test'){
 const instance=createApp();
 for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{void instance.close().then(()=>process.exit(0));});
}
