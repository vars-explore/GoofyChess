import type { Express } from 'express';
import { createHash } from 'node:crypto';
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
function getCachePath(id:string,url:string){
 const hash=createHash('sha256').update(url).digest('hex').slice(0,8);
 return resolve(cacheDir,`${id}-${hash}`);
}
export function attachMedia(app:Express){
 app.get('/api/media/:id',async(req,res)=>{
  const id=req.params.id,url=sources.get(id);if(!url){res.sendStatus(404);return;}
  const audio=id.startsWith('sound-');
  if(url.startsWith('/')){
   try {
    const localFile=resolve('public',url.replace(/^\//,''));
    const data=await readFile(localFile);
    const contentType=audio?'audio/mpeg':url.endsWith('.png')?'image/png':'image/jpeg';
    res.type(contentType).set('Cache-Control','no-cache').send(data);
    return;
   }catch{res.sendStatus(404);return;}
  }
  const cacheFile=getCachePath(id,url);
  try {
   let data:Buffer;
   try{data=await readFile(cacheFile);}
   catch{
    if((failed.get(id)||0)>Date.now())throw new Error('Media retry cooldown');
    let job=pending.get(id);
    if(!job){job=(async()=>{
     const response=await fetch(url,{signal:AbortSignal.timeout(7000)});
     if(!response.ok)throw new Error('Asset HTTP '+response.status);
     const type=response.headers.get('content-type')||'';
     const valid=audio?type.startsWith('audio/'):(type.startsWith('image/')||type.startsWith('video/'));
     if(!valid)throw new Error('Unexpected media type: '+type);
     const reader=response.body?.getReader();if(!reader)throw new Error('No media body');
     const chunks:Uint8Array[]=[];let size=0;
     while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12*1024*1024){await reader.cancel();throw new Error('Media too large');}chunks.push(value);}
     const bytes=Buffer.concat(chunks);await mkdir(cacheDir,{recursive:true});await writeFile(cacheFile,bytes);return bytes;
    })();pending.set(id,job);}
    try{data=await job;}finally{pending.delete(id);}
   }
   const contentType=audio?'audio/mpeg':url.endsWith('.mp4')?'video/mp4':url.endsWith('.webm')?'video/webm':url.endsWith('.gif')?'image/gif':url.endsWith('.png')?'image/png':url.endsWith('.webp')?'image/webp':'image/jpeg';
   res.type(contentType).set('Cache-Control','no-cache').send(data);
  }catch{failed.set(id,Date.now()+60000);res.set('Cache-Control','no-store').redirect(302,url);}
 });
 void fetch('https://api.imgflip.com/get_memes',{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).then(data=>{
  if(!data.success||!Array.isArray(data.data?.memes))return;
  for(const [kind,m] of Object.entries(memeMedia)){
   if(!m.id||m.id.startsWith('custom'))continue;
   const live=data.data.memes.find((x:{id:string})=>x.id===m.id);
   if(live&&/^https:\/\/i\.imgflip\.com\/[a-zA-Z0-9]+\.(jpg|png)$/.test(live.url))sources.set('meme-'+kind,live.url);
  }
 }).catch(()=>console.warn('Imgflip catalog refresh unavailable; using verified template URLs.'));
}
