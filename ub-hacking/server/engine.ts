import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readdirSync } from 'node:fs';
import type { BotDifficulty, Score } from '../shared/types';
import { normalizeScore } from '../shared/reactions';

type AnalyzeJob = { type: 'analyze'; key: string; before: string; after: string; resolve: (s: [Score, Score] | null) => void };
type MoveJob = { type: 'move'; key: string; fen: string; difficulty: BotDifficulty; resolve: (m: string | null) => void };
type ReviewJob = { type: 'review'; key: string; fens: string[]; resolve: (s: Score[] | null) => void };
type Job = AnalyzeJob | MoveJob | ReviewJob;
// One process / one search at a time. Pending work is coalesced by room.
export class Engine {
 private proc?:ChildProcessWithoutNullStreams;
 private queue=new Map<string,Job>();
 private active=false;
 private closed=false;
 private waiter?:{line:(s:string)=>void;fail:(e:Error)=>void};
 private cache=new Map<string,Score>();
 public ready=false;
 public error:string|null=null;
 private boot:Promise<void>;
 constructor() {this.boot=this.start().catch(e=>{this.error=String(e);console.error('Stockfish unavailable:',this.error);this.proc?.kill();});}
 private async start() {
  const native=process.env.STOCKFISH_PATH;
  let args:string[]=[];
  if(!native) {
   const require=createRequire(import.meta.url);
   const root=dirname(require.resolve('stockfish/package.json'));
   const files=readdirSync(join(root,'bin'));
   const js=files.find(f=>/lite-single.*\.js$/.test(f));
   if(!js) throw new Error('Stockfish lite-single engine not found. Set STOCKFISH_PATH.');
   args=[join(root,'bin',js)];
  }
  this.proc=spawn(native||process.execPath,args,{windowsHide:true,stdio:'pipe'});
  let buffer='';
  this.proc.stdout.on('data',chunk=>{buffer+=String(chunk);let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i).trim();buffer=buffer.slice(i+1);this.waiter?.line(line);}});
  this.proc.stderr.on('data',chunk=>console.error('Stockfish:',String(chunk).slice(0,500)));
  this.proc.on('error',e=>this.waiter?.fail(e));
  this.proc.on('exit',()=>{this.ready=false;this.waiter?.fail(new Error('Stockfish process exited'));});
  await this.command('uci',s=>s==='uciok',15000);
  this.send('setoption name Hash value 32');
  this.send('setoption name Threads value 1');
  await this.command('isready',s=>s==='readyok',15000);
  this.ready=true;
  console.log('Stockfish ready (lite, single-threaded).');
 }
 private send(s:string) {this.proc?.stdin.write(s+'\n');}
 private command(cmd:string,done:(line:string)=>boolean,timeout=6000):Promise<void> {
  return new Promise((resolve,reject)=>{
   const finish=(error?:Error)=>{clearTimeout(timer);this.waiter=undefined;error?reject(error):resolve();};
   const timer=setTimeout(()=>finish(new Error('Stockfish timed out')),timeout);
   this.waiter={line:s=>{if(done(s)) finish();},fail:e=>finish(e)};
   this.send(cmd);
  });
 }
 private async evaluate(fen:string,requestedMs?:number):Promise<Score> {
  const known=this.cache.get(fen);if(known) return known;
  let score:Score|undefined;
  this.send('position fen '+fen);
  const ms=Math.min(1500,Math.max(100,requestedMs??(Number(process.env.ANALYSIS_MS)||300)));
  await this.command('go movetime '+ms,line=>{
   const m=line.match(/score (cp|mate) (-?\d+)/);
   if(m&&!/lowerbound|upperbound/.test(line)) score={kind:m[1] as Score['kind'],value:Number(m[2])};
   return line.startsWith('bestmove');
  });
  if(!score) throw new Error('Stockfish returned no score');
  const normalized=normalizeScore(score,fen.split(' ')[1] as 'w'|'b');
  if(this.cache.size>1000) this.cache.delete(this.cache.keys().next().value!);
  this.cache.set(fen,normalized);return normalized;
 }
 private async searchMove(fen:string,difficulty:BotDifficulty):Promise<string|null> {
  const settings:Record<BotDifficulty,{skill:number;depth:number;ms:number}>={
   easy:{skill:0,depth:2,ms:200},
   medium:{skill:6,depth:5,ms:400},
   hard:{skill:14,depth:9,ms:750},
   expert:{skill:20,depth:14,ms:1200},
  };
  const cfg=settings[difficulty]||settings.medium;
  this.send('position fen '+fen);
  this.send('setoption name Skill Level value '+cfg.skill);
  let best:string|null=null;
  await this.command(`go depth ${cfg.depth} movetime ${cfg.ms}`,line=>{
   const m=line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
   if(m)best=m[1];
   return line.startsWith('bestmove');
  },cfg.ms+4000);
  return best;
 }
 analyze(key:string,before:string,after:string):Promise<[Score,Score]|null> {
  if(this.closed) return Promise.resolve(null);
  return new Promise(resolve=>{this.queue.get(key)?.resolve(null as any);this.queue.set(key,{type:'analyze',key,before,after,resolve});void this.drain();});
 }
 bestMove(key:string,fen:string,difficulty:BotDifficulty='medium'):Promise<string|null> {
  if(this.closed) return Promise.resolve(null);
  return new Promise(resolve=>{
   const jobKey=key+'-bot';
   this.queue.get(jobKey)?.resolve(null as any);
   this.queue.set(jobKey,{type:'move',key:jobKey,fen,difficulty,resolve});
   void this.drain();
  });
 }
 review(key:string,fens:string[]):Promise<Score[]|null> {
  if(this.closed)return Promise.resolve(null);
  return new Promise(resolve=>{const jobKey=key+'-review';this.queue.get(jobKey)?.resolve(null as any);this.queue.set(jobKey,{type:'review',key:jobKey,fens,resolve});void this.drain();});
 }
 cancel(key:string) {this.queue.get(key)?.resolve(null as any);this.queue.delete(key);for(const suffix of ['-bot','-review']){this.queue.get(key+suffix)?.resolve(null as any);this.queue.delete(key+suffix);}}
 private async drain() {
  if(this.active) return;this.active=true;await this.boot;
  while(this.queue.size&&!this.closed) {
   const job=this.queue.values().next().value!;this.queue.delete(job.key);
   if(!this.ready){job.resolve(null as any);continue;}
   try {
    if(job.type==='move'){
     const move=await this.searchMove(job.fen,job.difficulty);
     job.resolve(move);
    }else if(job.type==='review'){
     const scores:Score[]=[];
     for(const fen of job.fens)scores.push(await this.evaluate(fen,120));
     job.resolve(scores);
    }else{
     const before=await this.evaluate(job.before);
     const after=await this.evaluate(job.after);
     job.resolve([before,after]);
    }
   }
   catch(e){this.error=String(e);console.error('Engine operation failed:',this.error);this.ready=false;this.proc?.kill();job.resolve(null as any);}
  }
  this.active=false;
 }
 async status() {await this.boot;return {ready:this.ready,error:this.error};}
 close() {this.closed=true;for(const j of this.queue.values())j.resolve(null);this.queue.clear();this.send('quit');this.proc?.kill();}
}
