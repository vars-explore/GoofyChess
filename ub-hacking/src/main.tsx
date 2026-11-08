import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chess, type Square } from 'chess.js';
import { io } from 'socket.io-client';
import { ArrowUpRight, ArrowRight, Bot, Check, ChevronDown, Copy, Flag, FlipVertical2, Headphones, Link, RotateCcw, Settings2, Sparkles, Users, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { Piece } from './Piece';
import { configureAudio, moveSound, reactionSound, stopReactionSound, unlockAudio } from './audio';
import { Meme } from './Meme';
import { CheckmateScene } from './CheckmateScene';
import { memeMedia, reactionSounds } from '../shared/media';
import { checkmateNames, isNewMove } from '../shared/presentation';
import { demos } from '../shared/demos';
import type { Ack, BotDifficulty, Color, Mode, Reaction, Snapshot } from '../shared/types';
import './style.css';
import './cutscene.css';

const socket=io({autoConnect:false});
const emptyFen=new Chess().fen();
const names:Record<string,string>={k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'};
type Session={room:string;token:string;color:Color};
function stored<T>(key:string,fallback:T):T{try{return JSON.parse(sessionStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
function App(){
 const [state,setState]=useState<Snapshot|null>(null),[connected,setConnected]=useState(false);
 const [session,setSession]=useState<Session|null>(()=>stored('bt-seat',null));
 const sessionRef=useRef(session);sessionRef.current=session;
 const stateRef=useRef(state);stateRef.current=state;
 const [name,setName]=useState(()=>localStorage.getItem('bt-name')||'');
 const [color,setColor]=useState('random');
 const [opponentName,setOpponentName]=useState('');
 const [finale,setFinale]=useState<ReturnType<typeof checkmateNames>>(null);
 const [roomCode,setRoomCode]=useState(()=>new URLSearchParams(location.search).get('room')||'');
 const [joinMode,setJoinMode]=useState(!!roomCode),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [lobbyTab,setLobbyTab]=useState<'bot'|'online'>(()=>roomCode?'online':'bot');
 const [difficulty,setDifficulty]=useState<BotDifficulty>('medium');
 const [selected,setSelected]=useState<Square|null>(null),[flip,setFlip]=useState(session?.color==='b');
 const [promotion,setPromotion]=useState<{from:string;to:string}|null>(null);
 const [reaction,setReaction]=useState<Reaction|null>(null);
 const [settings,setSettings]=useState(false),[muted,setMuted]=useState(false),[volume,setVolume]=useState(.6),[enabled,setEnabled]=useState(true);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [copied,setCopied]=useState(false),[confirm,setConfirm]=useState<'leave'|'resign'|null>(null);
 const prefs=useRef({muted,volume,enabled});prefs.current={muted,volume,enabled};
 const seen=useRef(new Set<string>()),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const chess=useMemo(()=>new Chess(state?.fen||emptyFen),[state?.fen]);
 const bottom:Color=flip?'b':'w';
 const files=flip?'hgfedcba':'abcdefgh',ranks=flip?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
 const squares=ranks.flatMap(rank=>files.split('').map(file=>(file+rank) as Square));
 const legal=selected?chess.moves({square:selected,verbose:true}):[];
 const isMyTurn=(state?.mode==='bot'||state?.mode==='online')?session?.color===state?.turn:true;
 const hasOpponent=state?.mode!=='online'||(state?.players.w?.connected&&state?.players.b?.connected);
 const playable=!!state&&!state.result&&connected&&!busy&&isMyTurn&&hasOpponent;
 function saveSeat(s:Session|null){setSession(s);sessionRef.current=s;s?sessionStorage.setItem('bt-seat',JSON.stringify(s)):sessionStorage.removeItem('bt-seat');}
 function request(event:string,data:any):Promise<Ack>{return new Promise(resolve=>socket.timeout(7000).emit(event,data,(err:Error|null,result:Ack)=>resolve(err?{ok:false,error:'Connection timed out. Please try again.'}:result)));}
 useEffect(()=>{
  const onConnect=()=>{stateRef.current=null;setConnected(true);const seat=sessionRef.current;if(seat)void request('resume',seat).then(r=>{if(r.ok&&r.state)setState(r.state);else{saveSeat(null);setState(null);setError(r.error||'Unable to reconnect.');}});};
  const onState=(next:Snapshot)=>{
   const old=stateRef.current;
   if(isNewMove(old,next)&&!prefs.current.muted)moveSound(next.history.at(-1)?.includes('x'));
   stateRef.current=next;setState(next);setSelected(null);setPromotion(null);
   if(old?.gameId!==next.gameId||old?.version!==next.version){setReaction(null);stopReactionSound();if(timer.current)clearTimeout(timer.current);}
   if(old?.gameId!==next.gameId)setFinale(null);
  };
  const onReaction=(next:Reaction)=>{
   const current=stateRef.current;if(!current||next.gameId!==current.gameId||next.version!==current.version||seen.current.has(next.id)||!prefs.current.enabled)return;
   seen.current.add(next.id);if(seen.current.size>200)seen.current.delete(seen.current.values().next().value!);
   if(timer.current)clearTimeout(timer.current);setReaction(next);
   if(next.kind==='mate'){setFinale(checkmateNames(current));return;}
   if(!prefs.current.muted)reactionSound(reactionSounds[next.kind],next.duration);
   timer.current=setTimeout(()=>setReaction(null),next.duration);
  };
  const onDisconnect=()=>setConnected(false);
  const replaced=()=>{saveSeat(null);setState(null);setError('This seat was opened in another tab.');};
  socket.on('connect',onConnect);socket.on('disconnect',onDisconnect);socket.on('state',onState);socket.on('reaction',onReaction);socket.on('replaced',replaced);socket.connect();
  return()=>{socket.off('connect',onConnect);socket.off('disconnect',onDisconnect);socket.off('state',onState);socket.off('reaction',onReaction);socket.off('replaced',replaced);socket.disconnect();if(timer.current)clearTimeout(timer.current);};
 },[]);
 useEffect(()=>{configureAudio(muted,volume);},[muted,volume]);
 useEffect(()=>{for(const kind of Object.keys(memeMedia)){const img=new Image();img.src='/api/media/meme-'+kind;}},[]);
 async function start(mode:Mode,join=false){
  unlockAudio();setBusy(true);setError('');localStorage.setItem('bt-name',name);
  const r=await request(join?'join':'create',{mode,name,opponentName,color,room:roomCode.trim(),demo:'check',difficulty});
  if(r.ok&&r.room&&r.token&&r.color&&r.state){saveSeat({room:r.room,token:r.token,color:r.color});setState(r.state);setFlip(r.color==='b');history.replaceState(null,'',mode==='online'?`?room=${r.room}`:location.pathname);}else setError(r.error||'Could not start game.');setBusy(false);
 }
 async function sendMove(from:string,to:string,piece?:string){
  if(!state)return;unlockAudio();setBusy(true);setSelected(null);setPromotion(null);setError('');
  const r=await request('move',{gameId:state.gameId,version:state.version,from,to,promotion:piece});if(!r.ok)setError(r.error||'Move rejected.');setBusy(false);
 }
 function attempt(from:Square,to:Square){if(!playable||!from||!/^[a-h][1-8]$/.test(from))return;const move=chess.moves({square:from,verbose:true}).find(m=>m.to===to);if(!move)return;if(move.promotion)setPromotion({from,to});else void sendMove(from,to);}
 function clickSquare(square:Square){if(!playable)return;if(selected&&legal.some(m=>m.to===square)){attempt(selected,square);return;}const p=chess.get(square);setSelected(p?.color===chess.turn()?(selected===square?null:square):null);}
 async function control(action:string,demo?:string){setError('');const r=await request('control',{action,demo});if(!r.ok)setError(r.error||'Action failed.');}
 async function leave(){await request('leave',{});saveSeat(null);setState(null);setReaction(null);setFinale(null);stopReactionSound();setConfirm(null);setFlip(false);history.replaceState(null,'',location.pathname);}
 async function copyInvite(){try{await navigator.clipboard.writeText(`${location.origin}/?room=${state?.id}`);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{setError('Copy this invite from your browser address bar.');}}
 const king=chess.board().flat().find(p=>p?.type==='k'&&p.color===chess.turn())?.square;
 const reactionIndex=reaction?.square?squares.indexOf(reaction.square as Square):-1;
 const reactionStyle=reactionIndex<0?{}:{left:`${Math.max(18,Math.min(82,(reactionIndex%8+.5)*12.5))}%`,top:`${Math.max(16,Math.min(78,(Math.floor(reactionIndex/8)+.5)*12.5))}%`};
 const preset=demos.find(d=>d.id===state?.demo);
 function playerBar(c:Color,top=false){
  const player=state?.players[c],active=state&&!state.result&&state.turn===c;
  const isMe=session?.color===c;
  const isBot=state?.mode==='bot'&&!isMe;
  const label=(state?.mode==='online'||state?.mode==='bot')?(player?.name||(isBot?'Bot':'Waiting for a friend...')):state?(player?.name||`${c==='w'?'White':'Black'} pieces`):(top?'Your worthy opponent':'You, probably a genius');
  const sub=state?.mode==='online'?(player?.connected?'Connected':player?'Reconnecting…':'Send them your invite'):state?.mode==='bot'?(isMe?'Unreasonably confident':'Silicon menace'):top?'A formidable menace':'Unreasonably confident';
  return <div className={`player-bar ${active?'active':''}`}><div className={`avatar ${c}`}><Piece type={c==='w'?'k':'n'} color={c}/></div><div className="player-info"><strong>{label}{(state?.mode==='online'||state?.mode==='bot')&&isMe&&<span className="you">YOU</span>}</strong><span>{sub}<span className="captured">{state?.captures[c].map((p,i)=><span key={i}><Piece type={p} color={c==='w'?'b':'w'}/></span>)}</span></span></div><span className={`turn-pill ${active?'on':''}`}>{active?(isBot?'THINKING…':'TO MOVE'):state?.result?'FINISHED':c==='w'?'WHITE':'BLACK'}</span></div>;
 }
 return <div className={reduced?'app reduced':'app'}>
  <header className="site-header"><a className="brand" href="/" onClick={e=>{if(state){e.preventDefault();setConfirm('leave');}}}><span className="brand-icon">♞</span>blunder<span className="brand-light">theater</span><span className="beta">BETA</span></a><nav><button className={!state||state.mode==='online'?'nav-link selected':'nav-link'} onClick={()=>state?setConfirm('leave'):setJoinMode(false)}>Play</button><button className={state?.mode==='demo'?'nav-link selected':'nav-link'} onClick={()=>state?state.mode==='demo'?undefined:setConfirm('leave'):void start('demo')} disabled={busy||!connected}>The meme lab <Sparkles size={13}/></button></nav><div className="header-right"><span className="live-dot"/><span className="header-caption">Chess. With consequences.</span><button className="icon-button" aria-label="Open settings" onClick={()=>setSettings(true)}><Settings2 size={19}/></button></div></header>
  <main>
   <section className="intro"><div><div className="eyebrow"><span/> THE BOARD HAS A SENSE OF HUMOR</div><h1>Good chess. <span>Bad decisions.</span></h1><p>Your next move might be brilliant. The memes will decide.</p></div><div className="intro-tag"><span>100% chess</span><span>0% emotional support <ArrowUpRight size={14}/></span></div></section>
   {error&&<div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}
   {!connected&&<div className="connection" role="status">Connecting to the theater… {state?'Your seat is saved.':''}</div>}
   <div className="play-layout"><section className="board-column">
    <div className="board-heading"><span><span className="live-dot"/>{state?state.mode==='online'?'FRIEND MATCH':state.mode==='bot'?`VS BOT (${state.difficulty?.toUpperCase()||'MEDIUM'})`:state.mode==='demo'?'THE MEME LAB':'PASS & PLAY':'THE MAIN STAGE'}</span><span>STANDARD CHESS <span className="dot-separator">/</span> NO CLOCK</span></div>
    {playerBar(bottom==='w'?'b':'w',true)}
    <div className="board-shell"><div className="board" role="group" aria-label="Chessboard">
     {squares.map((square,i)=>{const p=chess.get(square),target=legal.some(m=>m.to===square),last=state?.last&&(state.last.from===square||state.last.to===square),check=state?.check&&king===square;return <button key={square} className={`square ${(Math.floor(i/8)+i%8)%2?'dark':'light'} ${selected===square?'chosen':''} ${last?'last':''} ${check?'check':''}`} aria-label={`${square}${p?` ${p.color==='w'?'white':'black'} ${names[p.type]}`:' empty'}${target?' legal destination':''}`} onClick={()=>clickSquare(square)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();attempt(e.dataTransfer.getData('text/plain') as Square,square);}}>
      {i%8===0&&<span className="rank">{square[1]}</span>}{i>=56&&<span className="file">{square[0]}</span>}
      {p&&<span className="piece-wrap" draggable={!!playable&&p.color===chess.turn()} onDragStart={e=>{setSelected(square);e.dataTransfer.setData('text/plain',square);}}><Piece type={p.type} color={p.color}/></span>}
      {target&&<span className={p?'target capture-target':'target'}/>}
     </button>;})}
    </div>
    {!state&&<div className="sample-meme image-sample"><Meme kind="check" caption="YOUR KING, EVENTUALLY"/></div>}
    {reaction&&enabled&&!finale&&<div className={`meme real-meme ${reaction.tone}`} key={reaction.id} style={reactionStyle} role="status"><Meme kind={reaction.kind} caption={reaction.caption}/></div>}
    {promotion&&<div className="board-modal"><div className="promotion-card"><h3>A little upgrade?</h3><p>Choose your promotion.</p><div>{['q','r','b','n'].map(p=><button key={p} aria-label={`Promote to ${names[p]}`} onClick={()=>void sendMove(promotion.from,promotion.to,p)}><Piece type={p} color={chess.turn()}/></button>)}</div><button className="text-button" onClick={()=>setPromotion(null)}>Cancel</button></div></div>}
    </div>
    {playerBar(bottom)}
    <div className="board-toolbar"><span><Headphones size={15}/> {muted?'Sound off. Dignity still at risk.':'Sound on. You’ve been warned.'}</span><div><button className="icon-button" title="Flip board" aria-label="Flip board" onClick={()=>setFlip(!flip)}><FlipVertical2 size={18}/></button><button className="icon-button" title={muted?'Enable sound':'Mute sound'} aria-label={muted?'Enable sound':'Mute sound'} onClick={()=>{unlockAudio();setMuted(!muted);}}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button></div></div>
   </section>
   <aside className="sidebar">
    {!state?<><section className="lobby card"><div className="section-kicker"><Bot size={16}/> {lobbyTab==='bot'?'HUMAN VS MACHINE. ZERO MERCY.':'GOOD COMPANY. TERRIBLE MOVES.'}</div><h2>{lobbyTab==='bot'?'Play the bot.':'Bring a friend.<br/>Lose your dignity.'}</h2><p>{lobbyTab==='bot'?'Pick your difficulty. Prepare to be humbled (or entertained).':'Real chess. Live memes.<br/>A deeply unserious rivalry.'}</p><div className="tabs"><button className={lobbyTab==='bot'?'active':''} onClick={()=>setLobbyTab('bot')}><Bot size={13}/> Play bot</button><button className={lobbyTab==='online'&&!joinMode?'active':''} onClick={()=>{setLobbyTab('online');setJoinMode(false);}}><Users size={13}/> Create room</button><button className={lobbyTab==='online'&&joinMode?'active':''} onClick={()=>{setLobbyTab('online');setJoinMode(true);}}><Link size={13}/> Join friend</button></div>{lobbyTab==='bot'?<><span className="field-label">CHOOSE DIFFICULTY</span><div className="difficulty-picker">{[['easy','Easy 🤪','Blunder-prone, goofy'],['medium','Medium ☕','Casual club level'],['hard','Hard ⚡','Competitive Stockfish'],['expert','Grandmaster 🤖','Calculated menace']].map(([id,label,desc])=><button key={id} className={difficulty===id?'active':''} onClick={()=>setDifficulty(id as BotDifficulty)}><strong>{label}</strong><small>{desc}</small></button>)}</div><span className="field-label">PICK YOUR SIDE</span><div className="color-picker">{[['w','White','♔'],['random','Random','⇄'],['b','Black','♚']].map(([id,label,glyph])=><button key={id} className={color===id?'active':''} onClick={()=>setColor(id)}><span>{glyph}</span>{label}</button>)}</div><button className="primary" disabled={!connected||busy} onClick={()=>void start('bot')}>{busy?'Waking the bot…':'Start bot match'}<ArrowRight size={18}/></button></>:<><label className="field-label" htmlFor="nickname">YOUR ALIAS</label><input id="nickname" placeholder="e.g. DefinitelyNotMagnus" maxLength={24} value={name} onChange={e=>setName(e.target.value)}/>{joinMode?<><label className="field-label" htmlFor="room">ROOM CODE</label><input id="room" placeholder="8-character room code" maxLength={8} value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())}/></>:<><span className="field-label">PICK YOUR SIDE</span><div className="color-picker">{[['w','White','♔'],['random','Random','⇄'],['b','Black','♚']].map(([id,label,glyph])=><button key={id} className={color===id?'active':''} onClick={()=>setColor(id)}><span>{glyph}</span>{label}</button>)}</div></>}<button className="primary" disabled={!connected||busy||(joinMode&&!roomCode.trim())} onClick={()=>void start('online',joinMode)}>{busy?'Setting the stage…':joinMode?'Join the chaos':'Create a room'}<ArrowRight size={18}/></button></>}<div className="no-account"><span/>No signup. No stakes. Just vibes.</div><div className="or"><span/>OR KEEP IT LOCAL<span/></div><label className="field-label" htmlFor="opponent-name">LOCAL OPPONENT NAME</label><input id="opponent-name" placeholder="Your friend’s name" maxLength={24} value={opponentName} onChange={e=>setOpponentName(e.target.value)}/><button className="secondary local-play" disabled={!connected||busy} onClick={()=>void start('local')}><Users size={17}/>Pass & play<ArrowUpRight size={16}/></button></section><section className="lab-card" onClick={()=>!busy&&connected&&void start('demo')}><div className="lab-icon"><Zap size={21}/></div><div><h3>Skip to the funny part</h3><p>Try a few beautifully bad situations.</p></div><button aria-label="Try demo" disabled={!connected||busy}><ArrowUpRight size={19}/></button></section></>:<>
     <section className="game-card card"><div className="section-kicker"><span className="live-dot"/>{state.mode==='online'?'YOUR PRIVATE TABLE':state.mode==='bot'?`BOT ARENA • ${state.difficulty?.toUpperCase()||'MEDIUM'}`:state.mode==='demo'?'CONTROLLED CHAOS':'SAME SCREEN. SAME CHAOS.'}</div><h2>{state.result?'That’s a wrap.':state.mode==='bot'?(state.turn===session?.color?'Your turn to cook.':'Bot is calculating…'):state.mode==='online'&&!state.players[session?.color==='w'?'b':'w']?'Save them a seat.':`${state.turn==='w'?'White':'Black'} to move.`}</h2><p>{state.result||(state.mode==='bot'?'You vs the silicon menace. No mercy.':state.mode==='online'?'A friendly game. Allegedly.':state.mode==='demo'?'Set the scene. Make the move. Enjoy the consequences.':'Take turns on this device. No mercy required.')}</p>
     {state.mode==='online'&&<button className="invite" onClick={()=>void copyInvite()}><Link size={17}/><span>{state.id}</span>{copied?<Check size={17}/>:<Copy size={17}/>}<small>{copied?'Copied!':'Copy invite'}</small></button>}
     {state.mode==='demo'&&<><label htmlFor="scenario" className="field-label">CHOOSE YOUR DISASTER</label><div className="select-wrap"><select id="scenario" value={state.demo} onChange={e=>void control('demo',e.target.value)}>{demos.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select><ChevronDown size={16}/></div><div className="demo-hint"><Sparkles size={18}/><div><strong>{preset?.name}</strong><p>{preset?.hint}</p></div></div></>}
     {state.offer&&<div className="offer">{state.offer===session?.color?'Draw offered. Waiting for your friend.':<>Your friend offers a draw.<div><button onClick={()=>void control('draw')}>Accept</button><button onClick={()=>void control('decline')}>Decline</button></div></>}</div>}
     {state.result?<button className="primary" onClick={()=>void control('rematch')} disabled={state.rematch===session?.color}>{state.rematch===session?.color?'Waiting for rematch…':state.rematch?'Accept rematch':'Run it back'}<RotateCcw size={17}/></button>:<div className="game-actions">{state.mode==='online'?<><button onClick={()=>void control('draw')}>Offer draw</button><button onClick={()=>setConfirm('resign')}><Flag size={14}/>Resign</button></>:state.mode==='bot'?<><button onClick={()=>setConfirm('resign')}><Flag size={14}/>Resign</button><button onClick={()=>void control('reset')}><RotateCcw size={15}/>Restart match</button></>:<button onClick={()=>void control('reset')}><RotateCcw size={15}/>Reset position</button>}</div>}
     </section>
     <section className="moves card"><div className="moves-heading"><h3>The receipts</h3><span>{state.history.length} MOVES</span></div><div className="move-table"><div className="move-table-head"><span>#</span><span>WHITE</span><span>BLACK</span></div>{state.history.length?Array.from({length:Math.ceil(state.history.length/2)},(_,i)=><div className="move-row" key={i}><span>{i+1}</span><span>{state.history[i*2]}</span><span>{state.history[i*2+1]||'—'}</span></div>):<div className="empty-history"><span>♟</span><p>A clean slate.<br/>Let’s see how long that lasts.</p></div>}</div></section>
     <button className="leave-button" onClick={()=>setConfirm('leave')}>Leave the table <ArrowUpRight size={15}/></button>
    </>}
   </aside></div>
   <section className="feature-strip"><div><span className="feature-number">01</span><div><strong>Make your move.</strong><p>Same rules. Questionable execution.</p></div></div><div><span className="feature-number">02</span><div><strong>The board reacts.</strong><p>Memes that meet the moment.</p></div></div><div><span className="feature-number">03</span><div><strong>Try not to take it personally.</strong><p>It’s only a game. Probably.</p></div></div></section>
  </main><footer><span>♞ blunder theater</span><span>Made for bad moves and good company.</span><span>EST. 2026 <span className="footer-star">✳</span></span></footer>
  {settings&&<div className="modal-backdrop" onClick={()=>setSettings(false)}><section className="settings card" role="dialog" aria-modal="true" aria-label="Settings" onClick={e=>e.stopPropagation()}><div className="dialog-title"><h2>Set the vibe.</h2><button className="icon-button" aria-label="Close settings" onClick={()=>setSettings(false)}><X size={20}/></button></div><label><span>Sound effects<small>Short sounds. Maximum disrespect.</small></span><input type="checkbox" checked={!muted} onChange={e=>{unlockAudio();setMuted(!e.target.checked);}}/></label><label><span>Volume</span><input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label><label><span>Meme reactions<small>The whole reason we’re here.</small></span><input type="checkbox" checked={enabled} onChange={e=>{setEnabled(e.target.checked);setReaction(null);setFinale(null);stopReactionSound();}}/></label><label><span>Reduced motion<small>All the jokes. Less movement.</small></span><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/></label><button className="primary" onClick={()=>setSettings(false)}>Good to go <Check size={18}/></button></section></div>}
  {confirm&&<div className="modal-backdrop"><section className="settings card" role="dialog" aria-modal="true" aria-label={confirm==='leave'?'Leave table':'Resign game'}><h2>{confirm==='leave'?'Leaving so soon?':'Call it a day?'}</h2><p>{confirm==='leave'?'Your friend will see you as disconnected.':'Resigning ends the game and gives your opponent the win.'}</p><button className="primary" onClick={()=>{if(confirm==='leave')void leave();else{void control('resign');setConfirm(null);}}}>{confirm==='leave'?'Leave the table':'Resign'}</button><button className="secondary" onClick={()=>setConfirm(null)}>Keep playing</button></section></div>}
  {finale&&enabled&&<CheckmateScene winner={finale.winner} loser={finale.loser} reduced={reduced} onClose={()=>{setFinale(null);setReaction(null);}}/>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
