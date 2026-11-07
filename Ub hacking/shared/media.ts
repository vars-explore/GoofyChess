import type { ReactionKind } from './types';
// Verified Imgflip get_memes IDs. No game or player data is sent to the provider.
export const memeMedia:Record<ReactionKind,{id:string;name:string;url:string}>={
 check:{id:'87743020',name:'Two Buttons',url:'https://i.imgflip.com/1g8my4.jpg'},
 mate:{id:'505705955',name:'Absolute Cinema',url:'https://i.imgflip.com/8d317n.png'},
 queen:{id:'80707627',name:'Sad Pablo Escobar',url:'https://i.imgflip.com/1c1uej.jpg'},
 promotion:{id:'181913649',name:'Drake Hotline Bling',url:'https://i.imgflip.com/30b1gx.jpg'},
 castle:{id:'124822590',name:'Left Exit 12 Off Ramp',url:'https://i.imgflip.com/22bdq6.jpg'},
 enpassant:{id:'100777631',name:'Is This A Pigeon',url:'https://i.imgflip.com/1o00in.jpg'},
 stalemate:{id:'131940431',name:"Gru's Plan",url:'https://i.imgflip.com/26jxvz.jpg'},
 capture:{id:'438680',name:'Batman Slapping Robin',url:'https://i.imgflip.com/9ehk.jpg'},
 winning:{id:'97984',name:'Disaster Girl',url:'https://i.imgflip.com/23ls.jpg'},
 losing:{id:'67452763',name:'Squidward window',url:'https://i.imgflip.com/145qvv.jpg'},
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
};
export type SoundId=keyof typeof soundMedia;
export const reactionSounds:Record<ReactionKind,SoundId>={check:'boom',mate:'slash',queen:'violin',promotion:'wow',castle:'slash',enpassant:'bruh',stalemate:'bruh',capture:'boom',winning:'wow',losing:'violin',swing:'bruh',comeback:'wow',danger:'boom'};
