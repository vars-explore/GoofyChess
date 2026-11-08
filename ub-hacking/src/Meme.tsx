import { useState } from 'react';
import { memeMedia } from '../shared/media';
import type { ReactionKind } from '../shared/types';
export function Meme({kind,caption}:{kind:ReactionKind;caption:string}){
 const [fallback,setFallback]=useState(false),[missing,setMissing]=useState(false);
 const media=memeMedia[kind];
 const src=fallback?media.url:`/api/media/meme-${kind}?v=${encodeURIComponent(media.url)}`;
 const isVideo=media.url.endsWith('.mp4')||media.url.endsWith('.webm');
 return (
  <>
   {!missing?(
    isVideo?(
     <video src={src} autoPlay loop muted playsInline aria-label={media.name} onError={()=>fallback?setMissing(true):setFallback(true)}/>
    ):(
     <img src={src} alt={media.name} onError={()=>fallback?setMissing(true):setFallback(true)}/>
    )
   ):<div className="meme-unavailable">Media unavailable</div>}
   <strong>{caption}</strong>
  </>
 );
}
