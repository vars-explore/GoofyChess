import type { ReactionKind } from './types';
// Verified Imgflip get_memes IDs. No game or player data is sent to the provider.
export const memeMedia:Record<ReactionKind,{id:string;name:string;url:string}>={
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
 boom:{url:'https://www.myinstants.com/media/sounds/vine-boom.mp3',source:'https://www.myinstants.com/en/instant/vine-boom-sound-70972/'},
 bruh:{url:'https://www.myinstants.com/media/sounds/movie_1.mp3',source:'https://www.myinstants.com/en/instant/bruh/'},
 wow:{url:'https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3',source:'https://www.myinstants.com/en/instant/anime-wow/'},
 violin:{url:'https://www.myinstants.com/media/sounds/sad-violin.mp3',source:'https://www.myinstants.com/en/instant/sad-violin/'},
 slash:{url:'https://www.myinstants.com/media/sounds/sword_slash-ab22fe02-3826-345a-80ad-dc22261a9127.mp3',source:'https://www.myinstants.com/en/instant/sword-slash-20958/'},
 fahh:{url:'/sounds/fahh.mp3',source:'local'},
};
export type SoundId=keyof typeof soundMedia;
export const reactionSounds:Record<ReactionKind,SoundId>={check:'boom',mate:'slash',queen:'violin',promotion:'wow',castle:'slash',enpassant:'bruh',stalemate:'bruh',capture:'boom',winning:'wow',losing:'violin',swing:'fahh',comeback:'wow',danger:'boom'};
