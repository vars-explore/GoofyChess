import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readdirSync } from 'node:fs';
import type { Score } from '../shared/types';
import { normalizeScore } from '../shared/reactions';

type Job = {key:string;before:string;after:string;resolve:(s:[Score,Score]|null)=>void};
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
 private async evaluate(fen:string):Promise<Score> {
  const known=this.cache.get(fen);if(known) return known;
  let score:Score|undefined;
  this.send('position fen '+fen);
  const ms=Math.min(1500,Math.max(100,Number(process.env.ANALYSIS_MS)||300));
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
 analyze(key:string,before:string,after:string):Promise<[Score,Score]|null> {
  if(this.closed) return Promise.resolve(null);
  return new Promise(resolve=>{this.queue.get(key)?.resolve(null);this.queue.set(key,{key,before,after,resolve});void this.drain();});
 }
 cancel(key:string) {this.queue.get(key)?.resolve(null);this.queue.delete(key);}
 private async drain() {
  if(this.active) return;this.active=true;await this.boot;
  while(this.queue.size&&!this.closed) {
   const job=this.queue.values().next().value!;this.queue.delete(job.key);
   if(!this.ready){job.resolve(null);continue;}
   try {const before=await this.evaluate(job.before);const after=await this.evaluate(job.after);job.resolve([before,after]);}
   catch(e){this.error=String(e);console.error('Analysis disabled:',this.error);this.ready=false;this.proc?.kill();job.resolve(null);}
  }
  this.active=false;
 }
 async status() {await this.boot;return {ready:this.ready,error:this.error};}
 close() {this.closed=true;for(const j of this.queue.values())j.resolve(null);this.queue.clear();this.send('quit');this.proc?.kill();}
}
