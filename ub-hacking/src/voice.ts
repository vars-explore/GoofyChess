import { Chess, type Square } from 'chess.js';

export type VoiceMoveResolution = {
 move?:{from:Square;to:Square;promotion?:string};
 error?:string;
};

const pieceNames:Record<string,string>={pawn:'p',knight:'n',night:'n',bishop:'b',rook:'r',queen:'q',king:'k'};
const numberWords:Record<string,string>={one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8'};

export function resolveVoiceMove(chess:Chess,transcript:string):VoiceMoveResolution {
 const spoken=transcript.toLowerCase().replace(/[.,!?]/g,' ').replace(/\b(one|two|three|four|five|six|seven|eight)\b/g,word=>numberWords[word]||word).trim();
 if(!spoken)return {error:'I did not catch a move. Try again.'};
 const legal=chess.moves({verbose:true});
 if(/\bcastle\b|\bcastling\b/.test(spoken)){
  const long=/\b(queen ?side|long)\b/.test(spoken);
  const short=/\b(king ?side|short)\b/.test(spoken);
  const castles=legal.filter(move=>move.san.startsWith('O-O')&&(long?move.san==='O-O-O':short?move.san==='O-O':true));
  const choices=new Map(castles.map(move=>[`${move.from}-${move.to}`,move]));
  if(choices.size===1){const move=[...choices.values()][0];return {move:{from:move.from,to:move.to,promotion:move.promotion}};}
  return {error:choices.size?'That could mean either castle. Say king side or queen side.':'Castling is not legal in this position.'};
 }
 const san=spoken.replace(/\b(please|play|move|make|to|the|a|an)\b/g,'').replace(/[^a-z0-9+#=]/g,'');
 const sanMove=legal.find(move=>move.san.toLowerCase()===san);
 if(sanMove)return {move:{from:sanMove.from,to:sanMove.to,promotion:sanMove.promotion}};
 const pieceName=spoken.match(/\b(pawn|knight|night|bishop|rook|queen|king)\b/)?.[0];
 const squares=[...spoken.matchAll(/\b([a-h])\s*([1-8])\b/g)].map(match=>`${match[1]}${match[2]}` as Square);
 if(!squares.length)return {error:`I heard “${transcript}”, but could not match it to a legal move. Try “pawn e4”.`};
 const from=squares.length>1?squares[0]:undefined,to=squares.at(-1)!;
 const candidates=legal.filter(move=>
  move.to===to&&(!from||move.from===from)&&(!pieceName||move.piece===pieceNames[pieceName]),
 );
 const choices=new Map(candidates.map(move=>[`${move.from}-${move.to}`,move]));
 if(choices.size===1){const move=[...choices.values()][0];return {move:{from:move.from,to:move.to,promotion:move.promotion}};}
 if(choices.size>1)return {error:`I heard “${transcript}”, but that could be more than one legal move. Say the starting and destination squares.`};
 return {error:`I heard “${transcript}”, but it is not legal in this position.`};
}
