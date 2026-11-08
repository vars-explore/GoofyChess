import { Chess } from 'chess.js';
import { randomBytes, randomUUID } from 'node:crypto';
import type { BotDifficulty, Color, Mode, Snapshot } from '../shared/types';
import { demos } from '../shared/demos';

export type Player = {name:string;token:string;socket:string|null};
export class Game {
 id=randomBytes(4).toString('hex').toUpperCase();
 gameId=randomUUID();version=0;chess=new Chess();
 players:Partial<Record<Color,Player>>={};
 result:string|null=null;offer:Color|null=null;rematch:Color|null=null;
 touched=Date.now();demo?:string;difficulty?:BotDifficulty;
 zones:Record<Color,number>={w:0,b:0};lastReaction:Record<Color,number>={w:0,b:0};
 lastCaption:Record<string,number>={};
 constructor(public mode:Mode,demo?:string,difficulty?:BotDifficulty){
  this.difficulty=difficulty;
  if(demo)this.reset(demo);
 }
 reset(demo?:string) {
  const preset=demo?demos.find(d=>d.id===demo):undefined;
  if(demo&&!preset)throw new Error('Unknown demo');
  this.chess=new Chess(preset?.fen);this.demo=demo;this.gameId=randomUUID();this.version=0;
  this.result=null;this.offer=null;this.rematch=null;this.zones={w:0,b:0};this.lastReaction={w:0,b:0};this.lastCaption={};this.touched=Date.now();
 }
 color(socket:string):Color|undefined {return (['w','b'] as Color[]).find(c=>this.players[c]?.socket===socket);}
 move(socket:string,input:{gameId:string;version:number;from:string;to:string;promotion?:string}) {
  const color=this.color(socket);
  if(!color)throw new Error('This seat belongs to another session.');
  if(this.result)throw new Error('This game has ended.');
  if(input.gameId!==this.gameId||input.version!==this.version)throw new Error('Board changed. Try your move again.');
  if(this.mode==='online'&&(!this.players.w?.socket||!this.players.b?.socket))throw new Error('Wait for both players to connect.');
  if((this.mode==='online'||this.mode==='bot')&&this.chess.turn()!==color)throw new Error('It is not your turn.');
  if(!/^[a-h][1-8]$/.test(input.from)||!/^[a-h][1-8]$/.test(input.to))throw new Error('Invalid square.');
  if(input.promotion&&!/^[qrbn]$/.test(input.promotion))throw new Error('Invalid promotion.');
  const move=this.chess.move({from:input.from,to:input.to,promotion:input.promotion});
  this.version++;this.touched=Date.now();this.offer=null;
  if(this.chess.isCheckmate())this.result=`${move.color==='w'?'White':'Black'} wins by checkmate`;
  else if(this.chess.isStalemate())this.result='Draw by stalemate';
  else if(this.chess.isInsufficientMaterial())this.result='Draw by insufficient material';
  // MVP: auto-adjudicate these claimable draw conditions for a casual game.
  else if(this.chess.isThreefoldRepetition())this.result='Draw by threefold repetition';
  else if(this.chess.isDrawByFiftyMoves())this.result='Draw by the fifty-move rule';
  return move;
 }
 moveAsBot(input:{from:string;to:string;promotion?:string}) {
  if(this.result)throw new Error('This game has ended.');
  const move=this.chess.move({from:input.from,to:input.to,promotion:input.promotion});
  this.version++;this.touched=Date.now();this.offer=null;
  if(this.chess.isCheckmate())this.result=`${move.color==='w'?'White':'Black'} wins by checkmate`;
  else if(this.chess.isStalemate())this.result='Draw by stalemate';
  else if(this.chess.isInsufficientMaterial())this.result='Draw by insufficient material';
  else if(this.chess.isThreefoldRepetition())this.result='Draw by threefold repetition';
  else if(this.chess.isDrawByFiftyMoves())this.result='Draw by the fifty-move rule';
  return move;
 }
 snapshot():Snapshot {
  const moves=this.chess.history({verbose:true}),last=moves.at(-1);
  const captures:Record<Color,string[]>={w:[],b:[]};for(const m of moves)if(m.captured)captures[m.color].push(m.captured);
  return {id:this.id,gameId:this.gameId,version:this.version,mode:this.mode,fen:this.chess.fen(),turn:this.chess.turn(),players:Object.fromEntries(Object.entries(this.players).map(([c,p])=>[c,{name:p.name,connected:!!p.socket}])),history:this.chess.history(),last:last?{from:last.from,to:last.to}:undefined,captures,result:this.result,offer:this.offer,rematch:this.rematch,check:this.chess.isCheck(),demo:this.demo,difficulty:this.difficulty};
 }
}
