export const demos = [
 {id:'check',name:'A little pressure',label:'Check',fen:'4k3/8/8/8/8/8/R7/4K3 w - - 0 1',move:'Re2+',hint:'Move the rook from a2 to e2.'},
 {id:'queen',name:'An expensive mistake',label:'Queen capture',fen:'4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1',move:'Rxd5',hint:'Move the rook from d1 to d5.'},
 {id:'promotion',name:'Character development',label:'Promotion',fen:'8/P6k/8/8/8/8/8/4K3 w - - 0 1',move:'a8=Q',hint:'Move the pawn from a7 to a8. Choose a queen.'},
 {id:'enpassant',name:'Wait. That’s legal?',label:'En passant',fen:'4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2',move:'exd6',hint:'Move the pawn from e5 to d6.'},
 {id:'mate',name:'Roll the credits',label:'Checkmate',fen:'7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',move:'Qg7#',hint:'Move the queen from f7 to g7.'},
 {id:'stalemate',name:'Task failed successfully',label:'Stalemate',fen:'7k/5K2/8/6Q1/8/8/8/8 w - - 0 1',move:'Qg6',hint:'Move the queen from g5 to g6.'},
 {id:'swing',name:'The plot twist',label:'Stockfish reaction',fen:'3rk3/8/8/8/8/8/8/3QK3 w - - 0 1',move:'Kf1',hint:'Move the king from e1 to f1, abandoning your queen. Give the hidden engine a moment.'},
];
