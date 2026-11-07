import type { Express } from 'express';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { memeMedia,soundMedia } from '../shared/media';
const cacheDir=resolve('.media-cache');
const sources=new Map<string,string>([
 ...Object.entries(memeMedia).map(([key,m])=>['meme-'+key,m.url] as [string,string]),
 ...Object.entries(soundMedia).map(([key,m])=>['sound-'+key,m.url] as [string,string]),
]);
const pending=new Map<string,Promise<Buffer>>();
const failed=new Map<string,number>();
export function attachMedia(app:Express){
 app.get('/api/media/:id',async(req,res)=>{
  const id=req.params.id,url=sources.get(id);if(!url){res.sendStatus(404);return;}
  const audio=id.startsWith('sound-');
  try {
   let data:Buffer;
   try{data=await readFile(resolve(cacheDir,id));}
   catch{
    if((failed.get(id)||0)>Date.now())throw new Error('Media retry cooldown');
    let job=pending.get(id);
    if(!job){job=(async()=>{
     const response=await fetch(url,{signal:AbortSignal.timeout(7000)});
     if(!response.ok)throw new Error('Asset HTTP '+response.status);
     const type=response.headers.get('content-type')||'';
     if(!(audio?type.startsWith('audio/'):type.startsWith('image/')))throw new Error('Unexpected media type');
     const reader=response.body?.getReader();if(!reader)throw new Error('No media body');
     const chunks:Uint8Array[]=[];let size=0;
     while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8*1024*1024){await reader.cancel();throw new Error('Media too large');}chunks.push(value);}
     const bytes=Buffer.concat(chunks);await mkdir(cacheDir,{recursive:true});await writeFile(resolve(cacheDir,id),bytes);return bytes;
    })();pending.set(id,job);}
    try{data=await job;}finally{pending.delete(id);}
   }
   res.type(audio?'audio/mpeg':url.endsWith('.png')?'image/png':'image/jpeg').set('Cache-Control','public, max-age=86400').send(data);
  }catch{failed.set(id,Date.now()+60000);res.set('Cache-Control','no-store').redirect(302,url);}
 });
 void fetch('https://api.imgflip.com/get_memes',{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).then(data=>{
  if(!data.success||!Array.isArray(data.data?.memes))return;
  for(const [kind,m] of Object.entries(memeMedia)){
   const live=data.data.memes.find((x:{id:string})=>x.id===m.id);
   if(live&&/^https:\/\/i\.imgflip\.com\/[a-zA-Z0-9]+\.(jpg|png)$/.test(live.url))sources.set('meme-'+kind,live.url);
  }
 }).catch(()=>console.warn('Imgflip catalog refresh unavailable; using verified template URLs.'));
}
