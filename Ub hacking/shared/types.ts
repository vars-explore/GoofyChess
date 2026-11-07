export type Color = 'w' | 'b';
export type Mode = 'online' | 'local' | 'demo';
export type Score = {kind:'cp'|'mate';value:number};
export type ReactionKind = 'check'|'mate'|'queen'|'promotion'|'castle'|'enpassant'|'stalemate'|'capture'|'winning'|'losing'|'swing'|'comeback'|'danger';
export type Reaction = {id:string;gameId:string;version:number;kind:ReactionKind;caption:string;tone:'good'|'bad'|'weird';square?:string;image?:string;duration:number};
export type Seat = {name:string;connected:boolean};
export type Snapshot = {id:string;gameId:string;version:number;mode:Mode;fen:string;turn:Color;players:Partial<Record<Color,Seat>>;history:string[];last?:{from:string;to:string};captures:Record<Color,string[]>;result:string|null;offer:Color|null;rematch:Color|null;check:boolean;demo?:string};
export type Ack = {ok:boolean;error?:string;room?:string;token?:string;color?:Color;state?:Snapshot};
