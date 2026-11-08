import type { ReactionKind } from './types';
// Verified Imgflip get_memes IDs. No game or player data is sent to the provider.
export const memeMedia:Record<ReactionKind,{id:string;name:string;url:string}>={
 fork:{id:'87743020',name:'Two Buttons',url:'https://i.imgflip.com/1g8my4.jpg'},
 doublecheck:{id:'91538330',name:'X, X Everywhere',url:'https://i.imgflip.com/1ihzfe.jpg'},
 recapture:{id:'217743513',name:'UNO Draw 25 Cards',url:'https://i.imgflip.com/3lmzyx.jpg'},
 pawnbully:{id:'438680',name:'Batman Slapping Robin',url:'https://i.imgflip.com/9ehk.jpg'},
 kingcapture:{id:'61579',name:'One Does Not Simply',url:'https://i.imgflip.com/1bij.jpg'},
 underpromotion:{id:'101470',name:'Ancient Aliens',url:'https://i.imgflip.com/26am.jpg'},
 streak:{id:'97984',name:'Disaster Girl',url:'https://i.imgflip.com/23ls.jpg'},
 instantkarma:{id:'79132341',name:'Bike Fall',url:'https://i.imgflip.com/1b42wl.jpg'},
 firstblood:{id:'309868304',name:'Trade Offer',url:'https://i.imgflip.com/54hjww.jpg'},
 queentrade:{id:'135256802',name:'Epic Handshake',url:'https://i.imgflip.com/28j0te.jpg'},
 check:{id:'custom-check',name:'Sweaty Man',url:'https://i.imgflip.com/5d1xrs.jpg'},
 mate:{id:'505705955',name:'Absolute Cinema',url:'https://i.imgflip.com/8d317n.png'},
 queen:{id:'80707627',name:'Sad Pablo Escobar',url:'https://i.imgflip.com/1c1uej.jpg'},
 promotion:{id:'custom-promotion',name:'Cat on Throne',url:'https://i.imgflip.com/aokwt5.png'},
 castle:{id:'124822590',name:'Left Exit 12 Off Ramp',url:'https://i.imgflip.com/22bdq6.jpg'},
 enpassant:{id:'custom-enpassant',name:'Unexpected Guitar Hit',url:'https://i.imgflip.com/47t2y4.png'},
 stalemate:{id:'131940431',name:"Gru's Plan",url:'https://i.imgflip.com/26jxvz.jpg'},
 capture:{id:'438680',name:'Batman Slapping Robin',url:'https://i.imgflip.com/9ehk.jpg'},
 winning:{id:'97984',name:'Disaster Girl',url:'https://i.imgflip.com/23ls.jpg'},  
 losing:{id:'custom-losing',name:'Sad Penguin',url:'https://i.imgflip.com/6ivmug.mp4'},
 swing:{id:'79132341',name:'Bike Fall',url:'https://i.imgflip.com/1b42wl.jpg'},
 comeback:{id:'135256802',name:'Epic Handshake',url:'https://i.imgflip.com/28j0te.jpg'},
 danger:{id:'4087833',name:'Waiting Skeleton',url:'https://i.imgflip.com/2fm6x.jpg'},
};
export const soundMedia={
 comedic:{url:'/sounds/Comedic_meme-style_r-1794095088013.mp3',source:'local'},
 scratch:{url:'/sounds/Create_a_classic_sna-1794150046226.mp3',source:'local'},
 whoosh:{url:'/sounds/Quick_whoosh_then_a_-1794150049305.mp3',source:'local'},
 fahh:{url:'/sounds/fahh.mp3',source:'local'},
};
export type SoundId=keyof typeof soundMedia;
export const reactionSounds:Record<ReactionKind,SoundId[]>={
 check:['scratch','comedic'],mate:['whoosh','comedic'],queen:['scratch','fahh'],
 promotion:['whoosh','comedic'],castle:['whoosh','comedic'],enpassant:['scratch','comedic'],
 stalemate:['fahh','comedic'],capture:['comedic','scratch'],winning:['comedic','whoosh'],
 losing:['fahh','scratch'],swing:['scratch','fahh'],comeback:['comedic','whoosh'],
 danger:['scratch','fahh'],fork:['comedic','scratch'],doublecheck:['scratch','comedic'],
 recapture:['comedic','scratch'],pawnbully:['comedic','fahh'],kingcapture:['whoosh','comedic'],
 underpromotion:['comedic','whoosh'],streak:['comedic','whoosh'],instantkarma:['fahh','scratch'],
 firstblood:['whoosh','comedic'],queentrade:['scratch','fahh'],
};

export function pickReactionSound(kind:ReactionKind,previous?:SoundId,random=Math.random):SoundId {
 const options=reactionSounds[kind],alternatives=previous?options.filter(id=>id!==previous):options;
 const choices=alternatives.length?alternatives:options;
 return choices[Math.floor(random()*choices.length)];
}
