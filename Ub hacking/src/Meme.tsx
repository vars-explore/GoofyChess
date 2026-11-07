import { useState } from 'react';
import { memeMedia } from '../shared/media';
import type { ReactionKind } from '../shared/types';
export function Meme({kind,caption}:{kind:ReactionKind;caption:string}){
 const [fallback,setFallback]=useState(false),[missing,setMissing]=useState(false);
 return <>{!missing?<img src={fallback?memeMedia[kind].url:'/api/media/meme-'+kind} alt={memeMedia[kind].name} onError={()=>fallback?setMissing(true):setFallback(true)}/>:<div className="meme-unavailable">Image unavailable</div>}<strong>{caption}</strong></>;
}
