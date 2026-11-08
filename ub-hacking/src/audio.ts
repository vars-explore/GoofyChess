import { soundMedia, type SoundId } from '../shared/media';
let context:AudioContext|undefined,master:GainNode|undefined,reaction:HTMLAudioElement|undefined;
let reactionTimer:ReturnType<typeof setTimeout>|undefined;
let unlocked=false,muted=false,level=.6,generation=0;
const samples=new Map<SoundId,HTMLAudioElement>();
export function unlockAudio(){
 context??=new AudioContext();if(!master){master=context.createGain();master.connect(context.destination);}
 master.gain.value=muted?0:level;void context.resume();unlocked=true;
 for(const id of Object.keys(soundMedia) as SoundId[])if(!samples.has(id)){const audio=new Audio('/api/media/sound-'+id);audio.preload='auto';audio.load();samples.set(id,audio);}
}
export function configureAudio(isMuted:boolean,volume:number){muted=isMuted;level=volume;if(master)master.gain.value=muted?0:level;if(reaction)reaction.volume=level;if(muted)stopReactionSound();}
export function stopReactionSound(){generation++;if(reactionTimer)clearTimeout(reactionTimer);if(reaction){reaction.pause();reaction.oncanplay=null;reaction.onerror=null;}reaction=undefined;}
export function reactionSound(id:SoundId,maxMs=3200){
 if(!unlocked||muted)return;stopReactionSound();
 const token=generation,audio=samples.get(id)||new Audio('/api/media/sound-'+id);reaction=audio;audio.currentTime=0;audio.volume=level;
 let expired=false;
 const finish=()=>{expired=true;audio.pause();audio.oncanplay=null;audio.onerror=null;if(reaction===audio)reaction=undefined;};
 const play=()=>{if(token!==generation||expired||muted)return;void audio.play().catch(()=>{});};
 reactionTimer=setTimeout(finish,maxMs);
 audio.onerror=()=>{if(expired||token!==generation)return;audio.onerror=null;audio.src=soundMedia[id].url;audio.load();};
 audio.oncanplay=play;play();
}
// Independent of memes: a short wood-like tap for each accepted move.
export function moveSound(capture=false){
 if(!unlocked||muted||!context||!master||context.state!=='running')return;
 const t=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
 osc.type='triangle';osc.frequency.setValueAtTime(capture?380:650,t);osc.frequency.exponentialRampToValueAtTime(130,t+.065);
 gain.gain.setValueAtTime(.38,t);gain.gain.exponentialRampToValueAtTime(.001,t+.085);
 osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+.09);osc.onended=()=>{osc.disconnect();gain.disconnect();};
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.035),context.sampleRate),channel=buffer.getChannelData(0);
 for(let i=0;i<channel.length;i++)channel[i]=(Math.random()*2-1)*Math.exp(-i/(channel.length*.16))*.15;
 const noise=context.createBufferSource();noise.buffer=buffer;noise.connect(master);noise.start(t);noise.onended=()=>noise.disconnect();
}
