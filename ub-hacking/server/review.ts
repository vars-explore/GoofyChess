import type { Score } from '../shared/types';

function describe(score:Score):string {
 if(score.kind==='mate')return score.value>0?`White mates in ${score.value}`:`Black mates in ${Math.abs(score.value)}`;
 const pawns=score.value/100;
 return `${pawns>0?'+':''}${pawns.toFixed(2)}`;
}

export async function summarizeWithGemini(sans:string[],scores:Score[],result:string):Promise<string> {
 const key=process.env.GEMINI_API_KEY;
 if(!key)throw new Error('GEMINI_API_KEY is not configured');
 const stride=Math.max(1,Math.ceil(sans.length/180));
 const entries=sans.flatMap((san,index)=>index%stride===stride-1||index===sans.length-1
  ? [`Ply ${index+1}: ${san}; Stockfish after move: ${describe(scores[index+1]??scores.at(-1)!)}`]
  : []);
 const prompt=[
  'Write a concise post-game chess recap in 2–4 sentences using only the supplied moves and Stockfish evaluations.',
  'Explain who won and why, identify the biggest evaluation swings or turning points, and describe the game in approachable language.',
  'Sound like a witty Gen Z friend recapping the match in the group chat: playful, punchy, and a little dramatic.',
  'Use 1–2 natural slang phrases such as "let them cook", "sold the bag", "main character energy", "plot armor", or "absolutely cooked" when the actual game supports them. Vary the wording; do not force slang into every sentence.',
  'Pair the joke with a concrete chess takeaway. Roast the move, not the player; keep it friendly, with no profanity or personal insults.',
  'Use plain text without headings or bullet points, and at most one emoji. Avoid repetitive catchphrases or a wall of slang.',
  'Scores are from White’s perspective: positive favors White and negative favors Black; mate scores name the mating side.',
  'Do not invent tactics or claim a move was a blunder unless the evaluation supports it. If the game stayed close, say so.',
  `Result: ${result}`,
  `Moves and engine evaluations (sampled every ${stride} ply when needed):`,
  ...entries,
 ].join('\n');
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',{
  method:'POST',
  headers:{'content-type':'application/json','x-goog-api-key':key},
  body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.3,maxOutputTokens:300,thinkingConfig:{thinkingBudget:0}}}),
  signal:AbortSignal.timeout(60000),
 });
 if(!response.ok)throw new Error(`Gemini returned HTTP ${response.status}`);
 const data=await response.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>};
 const summary=data.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('').trim();
 if(!summary)throw new Error('Gemini returned an empty recap');
 return summary.slice(0,2000);
}
