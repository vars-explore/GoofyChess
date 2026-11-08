import type { Chess, Move } from 'chess.js';
import type { Color, ReactionKind, Score } from './types';

// Centipawns. Entry/exit thresholds differ to avoid oscillation near a boundary.
export const reactionConfig = {winningEnter:220,winningExit:110,swing:250,comeback:180,cooldownMs:6500,durationMs:3000,minorEvery:3};
type Entry = {captions:string[];tone:'good'|'bad'|'weird';image?:string};
// Images are selected from the curated Imgflip database mapping in media.ts.
export const catalog:Record<ReactionKind,Entry> = {
 fork:{captions:['WHY NOT BOTH?','two problems. one horse.','MULTITASKING.'],tone:'good'},
 doublecheck:{captions:['MAKE THAT DOUBLE.','two checks. zero chill.','ONE KING. TWO PROBLEMS.'],tone:'bad'},
 recapture:{captions:['NO U.','and I took that personally','RETURN TO SENDER.'],tone:'good'},
 pawnbully:{captions:['SMALL PAWN. BIG AMBITIONS.','the intern just fired the manager','SIZE DOES NOT MATTER.'],tone:'good'},
 kingcapture:{captions:['FINE. I WILL DO IT MYSELF.','management has entered the chat','HANDS-ON LEADERSHIP.'],tone:'good'},
 underpromotion:{captions:['I HAVE A VERY SPECIFIC PLAN.','queen? too mainstream.','TRUST THE PROCESS.'],tone:'weird'},
 streak:{captions:['LET HIM COOK.','this piece is on a side quest','THREE COURSE MEAL.'],tone:'good'},
 instantkarma:{captions:['CAREER DURATION: ONE TURN.','promoted. immediately fired.','THE SHORTEST REIGN.'],tone:'bad'},
 firstblood:{captions:['AND SO IT BEGINS.','friendship has left the chat','FIRST BLOOD.'],tone:'weird'},
 queentrade:{captions:['A SOUL FOR A SOUL.','mutually assured queen destruction','FAIR TRADE. EMOTIONAL DAMAGE.'],tone:'weird'},
 check:{captions:['THIS IS FINE.','WHY IS IT HOT IN HERE?','nervous king noises'],tone:'bad'},
 mate:{captions:['WASTED.','and that’s a wrap.','connection to dignity lost'],tone:'bad'},
 queen:{captions:['GONE BUT NOT FORGOTTEN','that was my entire personality','emotional damage.'],tone:'bad'},
 promotion:{captions:['MAIN CHARACTER UNLOCKED','started from the bottom','the glow up is real'],tone:'good'},
 castle:{captions:['I’M OUT.','new address. who dis?','strategic relocation'],tone:'weird'},
 enpassant:{captions:['WAIT. THAT’S LEGAL?','google en passant','chess has a patch note?'],tone:'weird'},
 stalemate:{captions:['TASK FAILED SUCCESSFULLY','all that. for a draw.','celebration cancelled'],tone:'weird'},
 capture:{captions:['yoink.','a little snack','thank you for your donation'],tone:'good'},
 winning:{captions:['LET ME COOK.','calculated. obviously.','built different'],tone:'good'},
 losing:{captions:['I’M IN DANGER.','the math is not mathing','it’s getting personal'],tone:'bad'},
 swing:{captions:['IT WAS AT THIS MOMENT…','there goes the plot','my genius is frightening'],tone:'bad'},
 comeback:{captions:['WE ARE SO BACK.','call an ambulance. but not for me.','THE COMEBACK ARC'],tone:'good'},
 danger:{captions:['I HAVE A BAD FEELING.','boss music intensifies','oh no. oh no no no.'],tone:'bad'},
};
for(const kind of Object.keys(catalog) as ReactionKind[])catalog[kind].image='/api/media/meme-'+kind;
export function kingSquare(chess:Chess,color:Color) {return chess.board().flat().find(p=>p?.type==='k'&&p.color===color)?.square;}
export function boardEvent(chess:Chess,move:Move,ply:number):{kind:ReactionKind;square?:string}|null {
 if(chess.isCheckmate()) return {kind:'mate',square:kingSquare(chess,chess.turn())};
 if(chess.isStalemate()) return {kind:'stalemate',square:kingSquare(chess,chess.turn())};
 const history=chess.history({verbose:true}),previous=history.at(-2);
 if(move.captured&&previous?.promotion&&move.to===previous.to) return {kind:'instantkarma',square:move.to};
 if(move.captured==='q'&&previous?.captured==='q'&&previous.piece==='q'&&move.to===previous.to) return {kind:'queentrade',square:move.to};
 if(move.piece==='p'&&move.captured&&['q','r','b','n'].includes(move.captured)&&!move.promotion) return {kind:'pawnbully',square:move.to};
 if(move.captured==='q') return {kind:'queen',square:move.to};
 if(move.promotion&&move.promotion!=='q') return {kind:'underpromotion',square:move.to};
 if(move.promotion) return {kind:'promotion',square:move.to};
 const king=kingSquare(chess,chess.turn());
 if(chess.isCheck()&&king&&chess.attackers(king,move.color).length>=2) return {kind:'doublecheck',square:king};
 // Only announce a royal knight fork when the moved knight checks the king too.
 // This avoids calling a pinned knight's imaginary attacks a tactical fork.
 if(move.piece==='n'&&king&&chess.attackers(king,move.color).includes(move.to)){
  const victims=chess.board().flat().filter(p=>p&&p.color!==move.color&&(p.type==='q'||p.type==='r'));
  if(victims.some(p=>p&&chess.attackers(p.square,move.color).includes(move.to)))return {kind:'fork',square:move.to};
 }
 if(chess.isCheck()) return {kind:'check',square:kingSquare(chess,chess.turn())};
 if(move.flags.includes('e')) return {kind:'enpassant',square:move.to};
 if(move.flags.includes('k')||move.flags.includes('q')) return {kind:'castle',square:move.to};
 if(move.captured&&move.piece==='k')return {kind:'kingcapture',square:move.to};
 if(move.captured&&captureCount(history)===3)return {kind:'streak',square:move.to};
 if(move.captured&&previous?.captured&&move.to===previous.to)return {kind:'recapture',square:move.to};
 if(move.captured&&!history.slice(0,-1).some(m=>m.captured))return {kind:'firstblood',square:move.to};
 if(move.captured&&ply%reactionConfig.minorEvery===0) return {kind:'capture',square:move.to};
 return null;
}
// Follow this exact piece backward through its moves, rather than counting all
// rooks/knights of the same color. A promoted pawn keeps its identity.
export function captureCount(history:Move[]):number {
 const latest=history.at(-1);if(!latest)return 0;
 let square=latest.to,count=0;
 for(let i=history.length-1;i>=0;i--){
  const m=history[i];
  if(m.color===latest.color&&m.to===square){if(m.captured)count++;square=m.from;}
 }
 return count;
}
export function normalizeScore(score:Score,turn:Color):Score {return {...score,value:score.value*(turn==='w'?1:-1)};}
export function advantage(score:Score,color:Color) {return score.value*(color==='w'?1:-1);}
export function zone(score:Score,color:Color,previous=0):number {
 const n=advantage(score,color);
 if(score.kind==='mate') return n>0?1:-1;
 if(n>=reactionConfig.winningEnter) return 1;
 if(n<=-reactionConfig.winningEnter) return -1;
 if(previous===1&&n>reactionConfig.winningExit) return 1;
 if(previous===-1&&n< -reactionConfig.winningExit) return -1;
 return 0;
}
export function evaluationEvent(before:Score,after:Score,color:Color,previousZone:number):ReactionKind|null {
 const b=advantage(before,color),a=advantage(after,color);
 if(after.kind==='mate'&&a<0&&(before.kind!=='mate'||b>=0)) return 'danger';
 if(before.kind==='mate'&&b<0&&(after.kind!=='mate'||a>0)) return 'comeback';
 if(before.kind==='cp'&&after.kind==='cp') {
  if(b<=-reactionConfig.comeback&&a>=-50) return 'comeback';
  if(a-b<=-reactionConfig.swing) return 'swing';
  if(a-b>=reactionConfig.swing) return 'winning';
 }
 const next=zone(after,color,previousZone);
 if(next!==previousZone&&next===1) return 'winning';
 if(next!==previousZone&&next===-1) return 'losing';
 return null;
}
